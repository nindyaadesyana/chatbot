import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
// import { OCRService } from '@/lib/ocrService';

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

    // If no text found, try OCR or create fallback
    if (docs.length === 0 || (docs.length > 0 && docs[0].pageContent.trim().length < 100)) {
      console.log('PDF tidak terbaca atau teks minimal, mencoba OCR...');
      
      try {
        // Try pdf-parse for image-based PDFs
        const pdfParse = require('pdf-parse');
        const fs = require('fs');
        const pdfBuffer = fs.readFileSync(path);
        const pdfData = await pdfParse(pdfBuffer);
        
        if (pdfData.text && pdfData.text.trim().length > 100) {
          docs = [new Document({
            pageContent: pdfData.text.trim(),
            metadata: { 
              source: file.name, 
              type: 'pdf_parsed', 
              pages: pdfData.numpages || 0
            }
          })];
          console.log(`OCR berhasil: ${pdfData.numpages} halaman, ${pdfData.text.length} karakter`);
        } else {
          // Create fallback document
          docs = [new Document({
            pageContent: `Dokumen PDF: ${file.name}\nFile berhasil diupload. PDF ini berisi ${pdfData.numpages || 0} halaman. Konten mungkin berupa gambar atau scan yang memerlukan OCR khusus.`,
            metadata: { 
              source: file.name, 
              type: 'pdf_fallback', 
              pages: pdfData.numpages || 0
            }
          })];
        }
      } catch (ocrError) {
        console.error('OCR gagal:', ocrError);
        docs = [new Document({
          pageContent: `Dokumen PDF: ${file.name}\nFile berhasil diupload namun tidak dapat diekstrak teksnya.`,
          metadata: { 
            source: file.name, 
            type: 'pdf_error',
            pages: 0
          }
        })];
      }
    }

    // Split and embed
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splits = await splitter.splitDocuments(docs);

    // Clean metadata for ChromaDB compatibility
    const cleanedSplits = splits.map(doc => new Document({
      pageContent: doc.pageContent,
      metadata: {
        source: String(doc.metadata.source || file.name),
        type: String(doc.metadata.type || 'pdf'),
        filename: String(file.name)
      }
    }));

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://127.0.0.1:11434",
    });

    await Chroma.fromDocuments(cleanedSplits, embeddings, {
      collectionName: "tvku_docs",
      url: "http://localhost:8000",
    });

    return NextResponse.json({ 
      success: true, 
      message: `PDF berhasil diupload dan diproses (${docs.length} halaman)` 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload gagal', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}