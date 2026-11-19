/**
 * Migrates all local family-tree SQLite records (./data/lang-heritage.db)
 * and local portrait/heritage images (public/images/**) to Cloudinary + Google Cloud Firestore.
 *
 * Usage: npm run migrate:cloud
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from "firebase/firestore";

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].replace(/^["']|["']$/g, "").trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv(path.join(process.cwd(), ".env.local"));
loadDotEnv(path.join(process.cwd(), ".env"));

function getCloudinaryConfig() {
  const rawUrl = process.env.CLOUDINARY_URL?.trim();
  if (rawUrl && rawUrl.startsWith("cloudinary://")) {
    const parsed = new URL(rawUrl);
    return {
      cloudName: parsed.hostname,
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password),
    };
  }
  const cloudName = (
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    ""
  ).trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (
    process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_SECRET_KEY ||
    ""
  ).trim();
  const uploadPreset = (
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    ""
  ).trim();
  if (!cloudName) return null;
  if (apiKey && apiSecret) return { cloudName, apiKey, apiSecret };
  if (uploadPreset) return { cloudName, uploadPreset };
  return null;
}

async function uploadLocalImageToCloudinary(localPublicPath, cfg) {
  const absPath = path.join(
    process.cwd(),
    "public",
    localPublicPath.replace(/^\//, ""),
  );
  if (!fs.existsSync(absPath)) return localPublicPath;

  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";

  const bytes = fs.readFileSync(absPath);
  const folder = localPublicPath.includes("/heritage/")
    ? "family-tree/heritage"
    : "family-tree/portraits";
  const publicId = path.basename(absPath, ext);

  const form = new FormData();
  form.append("file", `data:${mime};base64,${bytes.toString("base64")}`);
  form.append("folder", folder);
  form.append("public_id", publicId);

  if (cfg.apiKey && cfg.apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      folder,
      public_id: publicId,
      timestamp: String(timestamp),
    };
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const signature = crypto
      .createHash("sha1")
      .update(`${sorted}${cfg.apiSecret}`)
      .digest("hex");
    form.append("api_key", cfg.apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
  } else if (cfg.uploadPreset) {
    form.append("upload_preset", cfg.uploadPreset);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`,
    { method: "POST", body: form },
  );
  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(
      `Cloudinary upload failed for ${localPublicPath}: ${json?.error?.message || res.status}`,
    );
  }
  return String(json.secure_url);
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.FIREBASE_API_KEY;
  const databaseId = process.env.FIREBASE_DATABASE_ID || "(default)";

  if (!projectId || !apiKey) {
    console.error("❌ Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY in .env");
    process.exit(1);
  }

  // 1. Verify Firestore exists first (with retry for transient DNS blips)
  let checkRes = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      checkRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
          projectId,
        )}/databases/${encodeURIComponent(databaseId)}/documents/family_members?pageSize=1&key=${encodeURIComponent(apiKey)}`,
      );
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
  if (!checkRes.ok) {
    const errText = await checkRes.text();
    if (checkRes.status === 403) {
      console.error(
        `❌ Firestore "${databaseId}" exists on "${projectId}", but Security Rules blocked access (HTTP 403).`,
      );
      console.error(
        `\n👉 Open https://console.firebase.google.com/project/${projectId}/firestore/rules`,
      );
      console.error(
        `   and publish rules allowing read, write on family_members, archival_records, and heritage_origins.\n`,
      );
    } else {
      console.error(
        `❌ Firestore "${databaseId}" is not ready on project "${projectId}" (HTTP ${checkRes.status}):`,
      );
      console.error(errText);
      console.error(
        `\n👉 Please check: https://console.firebase.google.com/project/${projectId}/firestore`,
      );
    }
    process.exitCode = 1;
    return;
  }

  // 2. Load local SQLite database
  const sqlitePath = path.join(process.cwd(), "data", "lang-heritage.db");
  if (!fs.existsSync(sqlitePath)) {
    console.error("❌ Local SQLite file ./data/lang-heritage.db not found.");
    process.exit(1);
  }

  const sqlite = createClient({
    url: `file:${sqlitePath.replace(/\\/g, "/")}`,
  });
  const [mRes, aRes, hRes] = await Promise.all([
    sqlite.execute("SELECT * FROM family_members"),
    sqlite.execute("SELECT * FROM archival_records"),
    sqlite.execute("SELECT * FROM heritage_origins"),
  ]);

  const members = mRes.rows.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    firstName: String(r.first_name),
    lastName: String(r.last_name),
    fullName: String(r.full_name),
    ...(r.nickname ? { nickname: String(r.nickname) } : {}),
    gender: String(r.gender),
    generation: Number(r.generation),
    branch: String(r.branch),
    parentId: r.parent_id ? String(r.parent_id) : null,
    ...(r.mother_name ? { motherName: String(r.mother_name) } : {}),
    ...(r.father_name ? { fatherName: String(r.father_name) } : {}),
    ...(r.birth_date ? { birthDate: String(r.birth_date) } : {}),
    ...(r.birth_year !== null && r.birth_year !== undefined
      ? { birthYear: Number(r.birth_year) }
      : {}),
    ...(r.birth_place ? { birthPlace: String(r.birth_place) } : {}),
    ...(r.death_date ? { deathDate: String(r.death_date) } : {}),
    ...(r.death_year !== null && r.death_year !== undefined
      ? { deathYear: Number(r.death_year) }
      : {}),
    ...(r.death_place ? { deathPlace: String(r.death_place) } : {}),
    ...(r.burial_place ? { burialPlace: String(r.burial_place) } : {}),
    ...(r.occupation ? { occupation: String(r.occupation) } : {}),
    ...(r.religion ? { religion: String(r.religion) } : {}),
    heritageTags: r.heritage_tags ? JSON.parse(String(r.heritage_tags)) : [],
    region: String(r.region || ""),
    ...(r.photo_url ? { photoUrl: String(r.photo_url) } : {}),
    bio: String(r.bio || ""),
    spouses: r.spouses ? JSON.parse(String(r.spouses)) : [],
    sources: r.sources ? JSON.parse(String(r.sources)) : [],
    sourceUrl: String(
      r.source_url || "https://www.brouwertree.com/langgene.html",
    ),
    isFeatured: Boolean(r.is_featured),
  }));

  const archives = aRes.rows.map((r) => ({
    id: String(r.id),
    category: String(r.category),
    year: Number(r.year),
    dateLabel: String(r.date_label),
    title: String(r.title),
    personNames: r.person_names ? JSON.parse(String(r.person_names)) : [],
    location: String(r.location),
    summary: String(r.summary),
    sourceCitation: String(r.source_citation),
    ...(r.member_id ? { memberId: String(r.member_id) } : {}),
    pageRef: String(r.page_ref),
  }));

  const origins = hRes.rows.map((r) => ({
    id: String(r.id),
    surname: String(r.surname),
    heritageGroup: String(r.heritage_group),
    ancestralRegion: String(r.ancestral_region),
    firstAppearanceGen: String(r.first_appearance_gen),
    firstAppearanceYear: Number(r.first_appearance_year),
    notableMembers: String(r.notable_members),
    historicalContext: String(r.historical_context),
    wikipediaSlug: String(r.wikipedia_slug),
    ...(r.nationalize_countries
      ? { nationalizeCountries: JSON.parse(String(r.nationalize_countries)) }
      : {}),
    ...(r.wikipedia_summary
      ? { wikipediaSummary: String(r.wikipedia_summary) }
      : {}),
    ...(r.wikipedia_url ? { wikipediaUrl: String(r.wikipedia_url) } : {}),
    ...(r.wikipedia_thumbnail
      ? { wikipediaThumbnail: String(r.wikipedia_thumbnail) }
      : {}),
    ...(r.open_archives_count !== null && r.open_archives_count !== undefined
      ? { openArchivesCount: Number(r.open_archives_count) }
      : {}),
    ...(r.last_enriched_at
      ? { lastEnrichedAt: String(r.last_enriched_at) }
      : {}),
  }));

  // 3. Upload local portraits to Cloudinary if configured
  const cloudinaryCfg = getCloudinaryConfig();
  const uploadedMap = new Map();
  if (cloudinaryCfg) {
    console.log(
      `☁️  Cloudinary detected (${cloudinaryCfg.cloudName}) — migrating local images...`,
    );
    async function migrateUrl(url) {
      if (!url || !url.startsWith("/images/")) return url;
      if (uploadedMap.has(url)) return uploadedMap.get(url);
      const secureUrl = await uploadLocalImageToCloudinary(url, cloudinaryCfg);
      uploadedMap.set(url, secureUrl);
      console.log(`   ✓ ${url} → ${secureUrl}`);
      return secureUrl;
    }

    for (const m of members) {
      if (m.photoUrl) m.photoUrl = await migrateUrl(m.photoUrl);
      for (const sp of m.spouses) {
        if (sp.photoUrl) sp.photoUrl = await migrateUrl(sp.photoUrl);
      }
    }
  } else {
    console.log(
      "ℹ️  Cloudinary env vars not set yet — keeping existing photo URLs during Firestore migration.",
    );
  }

  // 4. Write all collections into Google Cloud Firestore in a batch
  const app = initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  });
  const db =
    databaseId === "(default)"
      ? getFirestore(app)
      : getFirestore(app, databaseId);

  const batch = writeBatch(db);
  for (const m of members) {
    batch.set(doc(db, "family_members", m.id), JSON.parse(JSON.stringify(m)));
  }
  for (const a of archives) {
    batch.set(doc(db, "archival_records", a.id), JSON.parse(JSON.stringify(a)));
  }
  for (const h of origins) {
    batch.set(doc(db, "heritage_origins", h.id), JSON.parse(JSON.stringify(h)));
  }

  console.log(
    `🔥 Writing ${members.length} members, ${archives.length} archives, ${origins.length} heritage origins to Firestore...`,
  );
  await batch.commit();

  // 5. Verify read-back from Firestore
  const [mSnap, aSnap, hSnap] = await Promise.all([
    getDocs(collection(db, "family_members")),
    getDocs(collection(db, "archival_records")),
    getDocs(collection(db, "heritage_origins")),
  ]);

  console.log(
    `✅ Migration complete! Verified in Firestore (${projectId}/${databaseId}):`,
  );
  console.log(`   - family_members:   ${mSnap.size}`);
  console.log(`   - archival_records: ${aSnap.size}`);
  console.log(`   - heritage_origins: ${hSnap.size}`);
  sqlite.close();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exitCode = 1;
});
