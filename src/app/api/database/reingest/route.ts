import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    await execAsync('npm run ingest:enhanced', { cwd: process.cwd() });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Re-ingestion failed' }, { status: 500 });
  }
}