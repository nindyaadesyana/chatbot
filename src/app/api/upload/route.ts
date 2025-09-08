import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { OCRService } from '@/lib/ocrService';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const path = join(process.cwd(), 'public/uploads', file.name);
    await writeFile(path, buffer);

    // Try normal PDF loading first
    const loader = new PDFLoader(path);
    let docs = await loader.load();

    // If no text found, create fallback document
    if (docs.length === 0) {
      console.log('PDF tidak terbaca, membuat fallback document...');
      docs = [new Document({
        pageContent: `Dokumen PDF: ${file.name}\nFile berhasil diupload. PDF ini mungkin berisi gambar atau scan yang tidak bisa diekstrak teksnya secara otomatis.`,
        metadata: { source: file.name, type: 'pdf_fallback' }
      })];
    }

    // Split and embed
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splits = await splitter.splitDocuments(docs);

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://127.0.0.1:11434",
    });

    await Chroma.fromDocuments(splits, embeddings, {
      collectionName: "tvku_docs",
      url: "http://localhost:8000",
    });

    return NextResponse.json({ 
      success: true, 
      message: `PDF berhasil diupload dan diproses (${docs.length} halaman)` 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Upload gagal' }, { status: 500 });
  }
}