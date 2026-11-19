import { NextResponse } from 'next/server';
import { getDatabase, getDatabaseStatus } from '@/lib/db';

export async function GET() {
  try {
    const [status, archives] = await Promise.all([
      getDatabaseStatus(),
      getDatabase().getArchivalRecords(),
    ]);
    return NextResponse.json({ status, archives });
  } catch (error) {
    console.error('GET /api/status error:', error);
    return NextResponse.json({ error: 'Failed to inspect database status' }, { status: 500 });
  }
}
