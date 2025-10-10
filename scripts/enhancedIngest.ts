import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { readFileSync } from "fs";
import { Document } from "@langchain/core/documents";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { join } from "path";
import { DataService } from "../src/lib/chatbot/services/dataService";
import { RAG_CONFIG } from "../src/lib/chatbot/config/ragConfig";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
console.log('Uploads Dir:', UPLOADS_DIR);
const JSON_PATH = join(process.cwd(), "public", "tentangTVKU.json");

async function createDynamicDocuments(): Promise<Document[]> {
  const documents: Document[] = [];
  
  try {
    // Add news data
    console.log("   -> Mengambil data berita...");
    const newsData = await DataService.getBerita();
    if (newsData && newsData.trim()) {
      const newsDoc = new Document({
        pageContent: `BERITA TVKU:${newsData}`,
        metadata: { source: "dynamic_news", type: "news" }
      });
      documents.push(newsDoc);
    }

    // Add program data
    console.log("   -> Mengambil data program...");
    const programData = await DataService.getProgramAcara();
    if (programData && programData.trim()) {
      const programDoc = new Document({
        pageContent: `PROGRAM TVKU:${programData}`,
        metadata: { source: "dynamic_programs", type: "programs" }
      });
      documents.push(programDoc);
    }

    // Add schedule data
    console.log("   -> Mengambil data jadwal...");
    const scheduleData = await DataService.getJadwalAcara();
    if (scheduleData && scheduleData.trim()) {
      const scheduleDoc = new Document({
        pageContent: `JADWAL TVKU:${scheduleData}`,
        metadata: { source: "dynamic_schedule", type: "schedule" }
      });
      documents.push(scheduleDoc);
    }

  } catch (error) {
    console.warn("   -> Gagal mengambil beberapa data dinamis:", error);
  }

  return documents;
}

async function validateIngestion(collectionName: string, expectedCount: number): Promise<boolean> {
  try {
    const client = new ChromaClient({ 
      host: RAG_CONFIG.chroma.host,
      port: RAG_CONFIG.chroma.port
    });
    
    const collection = await client.getCollection({ name: collectionName });
    const count = await collection.count();
    
    console.log(`📊 Validation: Expected ${expectedCount}, Found ${count}`);
    
    if (count === expectedCount) {
      console.log("   ✅ Ingestion validated successfully");
      return true;
    } else {
      console.log(`   ❌ Validation failed: Missing ${expectedCount - count} documents`);
      return false;
    }
  } catch (error) {
    console.error("   ❌ Validation error:", error.message);
    return false;
  }
}

async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`   ⚠️  Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Retry operation failed unexpectedly');
}

async function run() {
  let totalExpectedDocs = 0;
  
  try {
    console.log("🚀 Memulai Enhanced Ingestion Process...\n");
    
    console.log("⚠️  Skipping health check, proceeding with ingest...\n");

    // 1. Load static documents (all PDFs)
    console.log("1. Memuat dokumen statis...");
    
    let pdfDocs = [];
    try {
      const fs = require('fs');
      const pdfFiles = fs.readdirSync(UPLOADS_DIR).filter(f => f.endsWith('.pdf'));
      console.log(`   -> Found ${pdfFiles.length} PDF files:`, pdfFiles);
      
      for (const pdfFile of pdfFiles) {
        const pdfPath = join(UPLOADS_DIR, pdfFile);
        console.log(`   -> Processing ${pdfFile}...`);
        
        let extractedText = '';
        let pageCount = 0;
        let method = '';
        
        // Method 1: pdf-parse (most effective)
        try {
          const pdfParse = require('pdf-parse');
          const pdfBuffer = fs.readFileSync(pdfPath);
          const pdfData = await pdfParse(pdfBuffer, {
            max: 0,
            normalizeWhitespace: false,
            disableCombineTextItems: false
          });
          
          if (pdfData.text && pdfData.text.trim().length > 20) {
            extractedText = pdfData.text.trim();
            pageCount = pdfData.numpages;
            method = 'pdf-parse';
          }
        } catch (e) {
          console.log(`   -> pdf-parse failed for ${pdfFile}`);
        }
        
        // Method 2: PDFLoader fallback
        if (!extractedText || extractedText.length < 100) {
          try {
            const pdfLoader = new PDFLoader(pdfPath);
            const docs = await pdfLoader.load();
            
            if (docs.length > 0) {
              const allText = docs.map(doc => doc.pageContent).join('\n\n');
              if (allText.trim().length > extractedText.length) {
                extractedText = allText;
                pageCount = docs.length;
                method = 'PDFLoader';
              }
            }
          } catch (e) {
            console.log(`   -> PDFLoader failed for ${pdfFile}`);
          }
        }
        
        // Store and clean the result
        if (extractedText && extractedText.length > 10) {
          // Simple text cleaning
          let cleanText = extractedText
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s\.,!?;:()\-"'\n]/g, '') // Remove special chars
            .trim();
            
          pdfDocs.push(new Document({
            pageContent: cleanText,
            metadata: { 
              source: pdfPath, 
              type: 'pdf', 
              filename: pdfFile,
              pages: pageCount,
              extraction_method: method,
              processed_at: new Date().toISOString()
            }
          }));
          
          console.log(`   -> ${pdfFile}: ${pageCount} pages, ${cleanText.length} chars via ${method}`);
        } else {
          console.log(`   -> ${pdfFile}: ⚠️  Failed to extract readable text`);
        }
      }
    } catch (error) {
      console.error(`   -> PDF processing failed:`, error.message);
    }
    console.log(`   -> PDF: ${pdfDocs.length} dokumen`);
    
    // Only load JSON for specific info not in PDF (ratecard, contacts, etc)
    const jsonLoader = new JSONLoader(JSON_PATH, ["/rateCard", "/kontakKerjaSama", "/mediaSosial", "/fasilitas"]);
    const jsonDocs = await jsonLoader.load();
    console.log(`   -> JSON (limited): ${jsonDocs.length} dokumen`);

    // 2. Load dynamic documents with retry
    console.log("2. Memuat dokumen dinamis...");
    const dynamicDocs = await retryOperation(async () => {
      const docs = await createDynamicDocuments();
      if (docs.length === 0) {
        throw new Error("No dynamic documents loaded");
      }
      return docs;
    }, 2, 2000);
    console.log(`   -> Dinamis: ${dynamicDocs.length} dokumen`);

    // 3. Combine all documents
    const allDocs = [...pdfDocs, ...jsonDocs, ...dynamicDocs];
    console.log(`\n📄 Total dokumen: ${allDocs.length}`);

    if (allDocs.length === 0) {
      throw new Error("❌ Tidak ada dokumen yang berhasil dimuat!");
    }
    
    // Store expected count for validation
    totalExpectedDocs = allDocs.length;

    // 4. Split documents with optimized parameters from config
    console.log("\n3. Memecah dokumen...");
    const textSplitter = new RecursiveCharacterTextSplitter(RAG_CONFIG.textSplitting);
    
    // Split different document types with different strategies
    const pdfSplits = [];
    const jsonSplits = [];
    const dynamicSplits = [];
    
    for (const doc of allDocs) {
      const docSplits = await textSplitter.splitDocuments([doc]);
      
      if (doc.metadata.type === 'pdf' || doc.metadata.type === 'pdf_ocr') {
        // Add enhanced metadata for PDF chunks
        docSplits.forEach((split, idx) => {
          split.metadata = {
            source: split.metadata.source,
            type: 'pdf',
            chunk_id: `pdf_${idx}`,
            priority: 'high',
            content_type: 'company_profile'
          };
        });
        pdfSplits.push(...docSplits);
      } else if (doc.metadata.source?.includes('dynamic')) {
        // Dynamic content (news, programs, schedule)
        docSplits.forEach((split, idx) => {
          split.metadata = {
            source: split.metadata.source || doc.metadata.source,
            type: doc.metadata.type || 'dynamic',
            chunk_id: `dynamic_${doc.metadata.type}_${idx}`,
            priority: 'medium',
            freshness: new Date().toISOString()
          };
        });
        dynamicSplits.push(...docSplits);
      } else {
        // JSON static content
        docSplits.forEach((split, idx) => {
          split.metadata = {
            source: split.metadata.source || JSON_PATH,
            type: 'json',
            chunk_id: `json_${idx}`,
            priority: 'low'
          };
        });
        jsonSplits.push(...docSplits);
      }
    }
    
    const splits = [...pdfSplits, ...dynamicSplits, ...jsonSplits];
    console.log(`   -> ${splits.length} potongan dokumen (PDF: ${pdfSplits.length}, Dynamic: ${dynamicSplits.length}, JSON: ${jsonSplits.length})`);

    // 5. Clean old collection with retry
    console.log("\n4. Membersihkan koleksi lama...");
    const client = new ChromaClient({ 
      host: RAG_CONFIG.chroma.host,
      port: RAG_CONFIG.chroma.port
    });
    
    await retryOperation(async () => {
      try {
        await client.deleteCollection({ name: RAG_CONFIG.chroma.collectionName });
        console.log("   -> Koleksi lama dihapus");
      } catch (e) {
        console.log("   -> Tidak ada koleksi lama");
      }
    }, 2, 1000);

    // 6. Create embeddings and store with robust error handling
    console.log("\n5. Membuat embeddings dan menyimpan...");
    const embeddings = new OllamaEmbeddings({
      model: RAG_CONFIG.ollama.embeddingModel,
      baseUrl: RAG_CONFIG.ollama.baseUrl,
      requestOptions: RAG_CONFIG.ollama.embeddingParams
    });

    // Process in batches to avoid memory issues
    const batchSize = RAG_CONFIG.textSplitting.batchSize;
    const batches = [];
    for (let i = 0; i < splits.length; i += batchSize) {
      batches.push(splits.slice(i, i + batchSize));
    }
    
    console.log(`   -> Processing ${batches.length} batches of ${batchSize} documents each...`);
    
    // Create collection with first batch (with retry)
    if (batches.length > 0) {
      await retryOperation(async () => {
        await Chroma.fromDocuments(batches[0], embeddings, {
          collectionName: RAG_CONFIG.chroma.collectionName,
          url: RAG_CONFIG.chroma.url,
        });
        console.log(`   -> ✅ Batch 1/${batches.length} completed`);
      }, 3, 2000);
      
      // Add remaining batches with retry
      if (batches.length > 1) {
        const vectorStore = await Chroma.fromExistingCollection(embeddings, {
          collectionName: RAG_CONFIG.chroma.collectionName,
          url: RAG_CONFIG.chroma.url,
        });
        
        for (let i = 1; i < batches.length; i++) {
          await retryOperation(async () => {
            await vectorStore.addDocuments(batches[i]);
            console.log(`   -> ✅ Batch ${i + 1}/${batches.length} completed`);
          }, 3, 2000);
        }
      }
    }

    // 7. Validate ingestion
    console.log("\n6. Validating ingestion...");
    const isValid = await validateIngestion(RAG_CONFIG.chroma.collectionName, splits.length);
    
    if (!isValid) {
      throw new Error("❌ Ingestion validation failed! Data may be incomplete.");
    }

    console.log("\n✅ Enhanced Ingestion selesai dan tervalidasi!");
    console.log("📊 Data yang tersedia:");
    console.log(`   - ${pdfDocs.length} PDF documents`);
    console.log(`   - ${jsonDocs.length} JSON documents`);
    console.log(`   - ${dynamicDocs.length} Dynamic documents`);
    console.log(`   - Total: ${splits.length} chunks in ChromaDB`);
    console.log("\n🎯 Chatbot siap digunakan!");

  } catch (error) {
    console.error("\n❌ Error during ingestion:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Pastikan Ollama running: ollama serve");
    console.error("   2. Pastikan ChromaDB running: docker run -d -p 8000:8000 chromadb/chroma");
    console.error("   3. Cek koneksi internet untuk API calls");
    process.exit(1);
  }
}

run();