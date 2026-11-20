import type { FamilyMemberRecord } from '@/lib/data/lang-genealogy';

/**
 * Normalizes an arbitrary ID to a valid GEDCOM cross-reference tag (e.g., @I_II_A@).
 */
function cleanGedcomId(id: string, prefix = 'I'): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return `@${prefix}_${sanitized}@`;
}

/**
 * Cleans string content for GEDCOM lines (no raw newlines; replace with spaces or split).
 */
function cleanLine(val: unknown): string {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

/**
 * Formats a date string for standard GEDCOM (e.g., "ca. 1805" -> "ABT 1805", "12 May 1842" -> "12 MAY 1842").
 */
function formatGedcomDate(dateStr?: string, yearNum?: number): string {
  if (!dateStr && yearNum) return String(yearNum);
  if (!dateStr) return '';
  const s = dateStr.trim();
  if (/^ca\.?\s*/i.test(s)) {
    return `ABT ${s.replace(/^ca\.?\s*/i, '').toUpperCase()}`;
  }
  if (/^after\s*/i.test(s)) {
    return `AFT ${s.replace(/^after\s*/i, '').toUpperCase()}`;
  }
  if (/^before\s*/i.test(s)) {
    return `BEF ${s.replace(/^before\s*/i, '').toUpperCase()}`;
  }
  return s.toUpperCase();
}

/**
 * Generates a valid standard GEDCOM 5.5.1 file content string from family tree members.
 * Compatible with FamilySearch, Ancestry, RootsFinder, Gramps, MyHeritage, and Solutions Gallery tools.
 */
export function generateGedcom(
  members: FamilyMemberRecord[],
  treeName = 'Family Archive Tree'
): string {
  const lines: string[] = [];

  // 1. Header (GEDCOM 5.5.1 Standard)
  lines.push('0 HEAD');
  lines.push('1 SOUR FamilyArchive');
  lines.push('2 VERS 1.0');
  lines.push(`2 NAME ${cleanLine(treeName)}`);
  lines.push('1 DEST FamilySearch');
  const now = new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  lines.push(`1 DATE ${dateStr}`);
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');
  lines.push('1 LANG English');

  // Track family connections: child -> parent family, spouse -> family
  // Map of parentId -> array of child member IDs
  const childrenByParent = new Map<string, string[]>();
  for (const m of members) {
    if (m.parentId) {
      const list = childrenByParent.get(m.parentId) || [];
      list.push(m.id);
      childrenByParent.set(m.parentId, list);
    }
  }

  // Set of member IDs to avoid duplicate INDI records
  const existingMemberIds = new Set(members.map((m) => m.id));

  // Map of family key -> family data
  interface FamEntry {
    famId: string;
    husbId?: string;
    wifeId?: string;
    marrDate?: string;
    marrPlace?: string;
    children: string[];
  }
  const families: FamEntry[] = [];
  const personFams = new Map<string, string[]>(); // personId -> famIds as spouse
  const personFamc = new Map<string, string>(); // personId -> famId as child

  // Extra synthetic spouses that are not standalone members in the list
  const extraSpouseIndis: Array<{
    id: string;
    name: string;
    gender: 'male' | 'female';
    birthDate?: string;
    birthPlace?: string;
    deathDate?: string;
    deathPlace?: string;
    heritage?: string;
    notes?: string;
  }> = [];

  // Build families for each member and their spouses
  let famCounter = 1;
  for (const m of members) {
    if (m.spouses && m.spouses.length > 0) {
      for (const sp of m.spouses) {
        const famId = cleanGedcomId(`FAM_${m.id}_${sp.id}`, 'F');
        const isMale = m.gender === 'male';
        const husbId = isMale ? cleanGedcomId(m.id) : cleanGedcomId(sp.id);
        const wifeId = isMale ? cleanGedcomId(sp.id) : cleanGedcomId(m.id);

        // Check if spouse exists as separate member; if not, create extra INDI
        if (!existingMemberIds.has(sp.id) && !extraSpouseIndis.some((e) => e.id === sp.id)) {
          extraSpouseIndis.push({
            id: sp.id,
            name: sp.name,
            gender: isMale ? 'female' : 'male',
            birthDate: sp.birthDate,
            birthPlace: sp.birthPlace,
            deathDate: sp.deathDate,
            deathPlace: sp.deathPlace,
            heritage: sp.heritage,
            notes: sp.notes,
          });
        }

        const famChildren = childrenByParent.get(m.id) || [];
        families.push({
          famId,
          husbId,
          wifeId,
          marrDate: sp.marriageDate,
          marrPlace: sp.marriagePlace,
          children: famChildren,
        });

        const listM = personFams.get(m.id) || [];
        listM.push(famId);
        personFams.set(m.id, listM);

        const listSp = personFams.get(sp.id) || [];
        listSp.push(famId);
        personFams.set(sp.id, listSp);

        for (const childId of famChildren) {
          if (!personFamc.has(childId)) {
            personFamc.set(childId, famId);
          }
        }
      }
    } else {
      // Member has children but no explicit spouse recorded
      const famChildren = childrenByParent.get(m.id);
      if (famChildren && famChildren.length > 0) {
        const famId = cleanGedcomId(`FAM_${m.id}_single_${famCounter++}`, 'F');
        const isMale = m.gender === 'male';
        families.push({
          famId,
          husbId: isMale ? cleanGedcomId(m.id) : undefined,
          wifeId: isMale ? undefined : cleanGedcomId(m.id),
          children: famChildren,
        });

        const listM = personFams.get(m.id) || [];
        listM.push(famId);
        personFams.set(m.id, listM);

        for (const childId of famChildren) {
          if (!personFamc.has(childId)) {
            personFamc.set(childId, famId);
          }
        }
      }
    }
  }

  // 2. Output INDI records for primary members
  for (const m of members) {
    const indiId = cleanGedcomId(m.id);
    lines.push(`0 ${indiId} INDI`);

    // Name
    const firstName = cleanLine(m.firstName || m.fullName);
    const lastName = cleanLine(m.lastName || '');
    if (lastName) {
      lines.push(`1 NAME ${firstName} /${lastName}/`);
      lines.push(`2 GIVN ${firstName}`);
      lines.push(`2 SURN ${lastName}`);
    } else {
      lines.push(`1 NAME ${cleanLine(m.fullName)}`);
    }

    // Gender
    const sex = m.gender === 'female' ? 'F' : m.gender === 'male' ? 'M' : 'U';
    lines.push(`1 SEX ${sex}`);

    // Birth
    if (m.birthDate || m.birthYear || m.birthPlace) {
      lines.push('1 BIRT');
      const bDate = formatGedcomDate(m.birthDate, m.birthYear);
      if (bDate) lines.push(`2 DATE ${bDate}`);
      if (m.birthPlace) lines.push(`2 PLAC ${cleanLine(m.birthPlace)}`);
    }

    // Death
    if (m.deathDate || m.deathYear || m.deathPlace) {
      lines.push('1 DEAT');
      const dDate = formatGedcomDate(m.deathDate, m.deathYear);
      if (dDate) lines.push(`2 DATE ${dDate}`);
      if (m.deathPlace) lines.push(`2 PLAC ${cleanLine(m.deathPlace)}`);
    }

    // Occupation
    if (m.occupation) {
      lines.push(`1 OCCU ${cleanLine(m.occupation)}`);
    }

    // Code & Generation
    if (m.code) {
      lines.push(`1 REFN ${cleanLine(m.code)}`);
      lines.push(`2 TYPE Parenteel_Code`);
    }

    // Bio / Notes
    if (m.bio) {
      lines.push(`1 NOTE ${cleanLine(m.bio)}`);
    }
    if (m.heritageTags && m.heritageTags.length > 0) {
      lines.push(`1 NOTE Heritage: ${cleanLine(m.heritageTags.join(', '))}`);
    }

    // Sources
    if (m.sources && m.sources.length > 0) {
      for (const s of m.sources) {
        lines.push(`1 SOUR ${cleanLine(s)}`);
      }
    }
    if (m.sourceUrl) {
      lines.push(`1 SOUR ${cleanLine(m.sourceUrl)}`);
    }

    // Family links
    const famc = personFamc.get(m.id);
    if (famc) {
      lines.push(`1 FAMC ${famc}`);
    }
    const famsList = personFams.get(m.id);
    if (famsList) {
      for (const famId of famsList) {
        lines.push(`1 FAMS ${famId}`);
      }
    }
  }

  // 3. Output INDI records for extra spouses
  for (const sp of extraSpouseIndis) {
    const indiId = cleanGedcomId(sp.id);
    lines.push(`0 ${indiId} INDI`);
    const parts = sp.name.trim().split(' ');
    const givn = parts.length > 1 ? parts.slice(0, -1).join(' ') : sp.name;
    const surn = parts.length > 1 ? parts[parts.length - 1] : '';
    if (surn) {
      lines.push(`1 NAME ${cleanLine(givn)} /${cleanLine(surn)}/`);
      lines.push(`2 GIVN ${cleanLine(givn)}`);
      lines.push(`2 SURN ${cleanLine(surn)}`);
    } else {
      lines.push(`1 NAME ${cleanLine(sp.name)}`);
    }
    lines.push(`1 SEX ${sp.gender === 'female' ? 'F' : 'M'}`);

    if (sp.birthDate || sp.birthPlace) {
      lines.push('1 BIRT');
      if (sp.birthDate) lines.push(`2 DATE ${formatGedcomDate(sp.birthDate)}`);
      if (sp.birthPlace) lines.push(`2 PLAC ${cleanLine(sp.birthPlace)}`);
    }
    if (sp.deathDate || sp.deathPlace) {
      lines.push('1 DEAT');
      if (sp.deathDate) lines.push(`2 DATE ${formatGedcomDate(sp.deathDate)}`);
      if (sp.deathPlace) lines.push(`2 PLAC ${cleanLine(sp.deathPlace)}`);
    }
    if (sp.notes) {
      lines.push(`1 NOTE ${cleanLine(sp.notes)}`);
    }
    if (sp.heritage) {
      lines.push(`1 NOTE Heritage: ${cleanLine(sp.heritage)}`);
    }

    const famsList = personFams.get(sp.id);
    if (famsList) {
      for (const famId of famsList) {
        lines.push(`1 FAMS ${famId}`);
      }
    }
  }

  // 4. Output FAM records
  for (const fam of families) {
    lines.push(`0 ${fam.famId} FAM`);
    if (fam.husbId) lines.push(`1 HUSB ${fam.husbId}`);
    if (fam.wifeId) lines.push(`1 WIFE ${fam.wifeId}`);

    if (fam.marrDate || fam.marrPlace) {
      lines.push('1 MARR');
      if (fam.marrDate) lines.push(`2 DATE ${formatGedcomDate(fam.marrDate)}`);
      if (fam.marrPlace) lines.push(`2 PLAC ${cleanLine(fam.marrPlace)}`);
    }

    for (const childId of fam.children) {
      lines.push(`1 CHIL ${cleanGedcomId(childId)}`);
    }
  }

  // 5. Trailer
  lines.push('0 TRLR');
  lines.push('');

  return lines.join('\n');
}

/**
 * Triggers a browser download of the tree as a standard .ged GEDCOM file.
 */
export function downloadGedcomFile(
  members: FamilyMemberRecord[],
  filename = 'family-tree-archive.ged',
  treeName = 'Family Archive'
): void {
  const content = generateGedcom(members, treeName);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ged') ? filename : `${filename}.ged`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
