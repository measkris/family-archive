import crypto from "node:crypto";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  // Support CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
  const rawUrl = process.env.CLOUDINARY_URL?.trim();
  if (rawUrl && rawUrl.startsWith("cloudinary://")) {
    try {
      const parsed = new URL(rawUrl);
      const cloudName = parsed.hostname;
      const apiKey = decodeURIComponent(parsed.username);
      const apiSecret = decodeURIComponent(parsed.password);
      if (cloudName && apiKey && apiSecret) {
        return { cloudName, apiKey, apiSecret };
      }
    } catch {
      // fall through to individual vars
    }
  }

  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (
    process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_SECRET_KEY ||
    ""
  ).trim();
  const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();

  if (!cloudName) return null;
  if (apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  if (uploadPreset) {
    return { cloudName, uploadPreset };
  }
  return null;
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  mimeType: string,
  options?: { folder?: string; publicId?: string },
): Promise<{ secureUrl: string; publicId: string }> {
  const cfg = getCloudinaryConfig();
  if (!cfg) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) to .env.",
    );
  }

  const folder = options?.folder || "family-tree/portraits";
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const form = new FormData();
  form.append("file", dataUri);
  form.append("folder", folder);

  if (options?.publicId) {
    form.append("public_id", options.publicId);
  }

  if (cfg.apiKey && cfg.apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string> = {
      folder,
      timestamp: String(timestamp),
    };
    if (options?.publicId) {
      paramsToSign.public_id = options.publicId;
    }
    const sorted = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
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

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
    cfg.cloudName,
  )}/image/upload`;

  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    const msg =
      json?.error?.message || `Cloudinary upload failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return {
    secureUrl: String(json.secure_url),
    publicId: String(json.public_id || ""),
  };
}
