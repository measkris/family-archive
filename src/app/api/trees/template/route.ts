import { NextResponse } from 'next/server';
import { generateExcelTemplateBuffer } from '@/lib/import/tree-parser';

export async function GET() {
  const buf = generateExcelTemplateBuffer();
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="family-archive-import-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
