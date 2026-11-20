import { NextRequest, NextResponse } from 'next/server';
import {
  parseBrouwerTreeHtml,
  parseGedcomString,
  parseJsonString,
  parseSpreadsheetBuffer,
} from '@/lib/import/tree-parser';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Case 1: Multipart file upload (.xlsx, .xls, .csv, .json, .ged, .gedcom)
    if (contentType.includes('multipart/form-data')) {
      const fd = await request.formData();
      const file = fd.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.ged') || lowerName.endsWith('.gedcom')) {
        const result = parseGedcomString(bytes.toString('utf8'), file.name);
        return NextResponse.json(result);
      }

      if (lowerName.endsWith('.json')) {
        const result = parseJsonString(bytes.toString('utf8'), file.name);
        return NextResponse.json(result);
      }

      if (
        lowerName.endsWith('.xlsx') ||
        lowerName.endsWith('.xls') ||
        lowerName.endsWith('.csv')
      ) {
        const result = parseSpreadsheetBuffer(bytes, file.name);
        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .xlsx, .xls, .csv, .json, or .ged (GEDCOM).' },
        { status: 400 }
      );
    }

    // Case 2: External API or URL fetch + parse
    const body = (await request.json()) as { url?: string };
    const rawUrl = body.url?.trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      return NextResponse.json(
        { error: 'Please provide a valid http:// or https:// URL' },
        { status: 400 }
      );
    }

    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'FamilyArchiveParser/1.0',
        Accept: 'application/json, text/html, text/csv, */*',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Source URL returned HTTP ${res.status}` },
        { status: 400 }
      );
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase();

    if (
      ct.includes('gedcom') ||
      rawUrl.toLowerCase().endsWith('.ged') ||
      rawUrl.toLowerCase().endsWith('.gedcom')
    ) {
      const text = await res.text();
      return NextResponse.json(parseGedcomString(text, rawUrl));
    }

    if (ct.includes('json') || rawUrl.toLowerCase().includes('.json')) {
      const text = await res.text();
      return NextResponse.json(parseJsonString(text, rawUrl));
    }

    if (ct.includes('csv') || rawUrl.toLowerCase().endsWith('.csv')) {
      const buf = Buffer.from(await res.arrayBuffer());
      return NextResponse.json(parseSpreadsheetBuffer(buf, 'remote-import.csv'));
    }

    if (ct.includes('spreadsheet') || rawUrl.toLowerCase().endsWith('.xlsx')) {
      const buf = Buffer.from(await res.arrayBuffer());
      return NextResponse.json(parseSpreadsheetBuffer(buf, 'remote-import.xlsx'));
    }

    // HTML page (e.g. BrouwerTree genealogy page)
    const buf = Buffer.from(await res.arrayBuffer());
    const html = buf.toString('latin1');
    const result = parseBrouwerTreeHtml(html, rawUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/trees/parse-source error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to parse external source',
      },
      { status: 500 }
    );
  }
}
