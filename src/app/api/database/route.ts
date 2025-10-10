import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

export async function GET() {
  try {
    const files = await readdir(UPLOADS_DIR);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = join(UPLOADS_DIR, file);
        const stats = await stat(filePath);
        return {
          name: file,
          size: stats.size,
          uploadDate: stats.mtime.toLocaleDateString('id-ID'),
          type: file.split('.').pop() || 'unknown'
        };
      })
    );

    return NextResponse.json({ files: fileDetails });
  } catch (error) {
    return NextResponse.json({ files: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json();
    const filePath = join(UPLOADS_DIR, filename);
    
    await unlink(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}