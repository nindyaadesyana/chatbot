import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { RAG_CONFIG } from '@/lib/chatbot/config/ragConfig';

export async function POST(request: NextRequest) {
  try {
    // Check if uploads directory exists
    const uploadsDir = join(process.cwd(), 'public/uploads');
    try {
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('Directory creation error:', dirError);
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const path = join(process.cwd(), 'public/uploads', file.name);
    await writeFile(path, buffer);

    // Try normal PDF loading first
    let docs: Document[] = [];
    try {
      const loader = new PDFLoader(path);
      docs = await loader.load();
    } catch (pdfError) {
      console.error('PDF loading error:', pdfError);
      docs = [];
    }

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

    // Split with optimized config
    const splitter = new RecursiveCharacterTextSplitter(RAG_CONFIG.textSplitting);
    const splits = await splitter.splitDocuments(docs);

    // Clean metadata with priority
    const cleanedSplits = splits.map((doc, idx) => new Document({
      pageContent: doc.pageContent,
      metadata: {
        source: String(doc.metadata.source || file.name),
        type: 'pdf',
        filename: String(file.name),
        chunk_id: `pdf_upload_${idx}`,
        priority: 'high',
        uploaded_at: new Date().toISOString()
      }
    }));

    const embeddings = new OllamaEmbeddings({
      model: RAG_CONFIG.ollama.embeddingModel,
      baseUrl: RAG_CONFIG.ollama.baseUrl,
      requestOptions: RAG_CONFIG.ollama.embeddingParams
    });

    // Add to existing collection with error handling
    try {
      const vectorStore = await Chroma.fromExistingCollection(embeddings, {
        collectionName: RAG_CONFIG.chroma.collectionName,
        url: RAG_CONFIG.chroma.url,
      });
      
      await vectorStore.addDocuments(cleanedSplits);
    } catch (chromaError) {
      console.error('ChromaDB error:', chromaError);
      // Still return success for file upload, but note the embedding issue
      return NextResponse.json({ 
        success: true, 
        message: `PDF berhasil diupload (${docs.length} halaman) tapi belum diproses ke database. Pastikan ChromaDB running.`,
        warning: 'ChromaDB tidak tersedia'
      });
    }

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