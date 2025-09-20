import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { readFileSync } from "fs";
import { Document } from "@langchain/core/documents";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { Document } from "@langchain/core/documents";
import { join } from "path";
import { DataService } from "../src/lib/chatbot/services/dataService";


const OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const PDF_PATH = join(process.cwd(), "public", "uploads", "Company_Profile_TVKU_2025_web.pdf");
console.log('PDF Path:', PDF_PATH);
const JSON_PATH = join(process.cwd(), "public", "tentangTVKU.json");
const COLLECTION_NAME = "tvku_docs";
const CHROMA_URL = "http://localhost:8000";


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

async function run() {
  try {
    console.log("🚀 Memulai Enhanced Ingestion Process...\n");

    // 1. Load static documents (prioritize PDF)
    console.log("1. Memuat dokumen statis...");
    const pdfLoader = new PDFLoader(PDF_PATH);
    
    let pdfDocs = [];
    try {
      // Try multiple PDF loading methods
      console.log('   -> Trying PDFLoader...');
      pdfDocs = await pdfLoader.load();
      
      if (pdfDocs.length === 0) {
        console.log('   -> PDFLoader failed, trying pdf-parse...');
        try {
          const pdfParse = require('pdf-parse');
          const pdfBuffer = readFileSync(PDF_PATH);
          const pdfData = await pdfParse(pdfBuffer);
          
          if (pdfData.text && pdfData.text.trim()) {
            pdfDocs = [new Document({
              pageContent: pdfData.text,
              metadata: { source: PDF_PATH, type: 'pdf', pages: pdfData.numpages }
            })];
            console.log(`   -> pdf-parse success: ${pdfData.numpages} pages, ${pdfData.text.length} chars`);
          } else {
            console.log('   -> pdf-parse returned empty text');
          }
        } catch (parseError) {
          console.error('   -> pdf-parse also failed:', parseError.message);
          
          // Last resort: OCR for image-based PDFs
          console.log('   -> PDF is image-based, using OCR extraction...');
          try {
            // Use existing OCR service from the project
            const { processUploadedFile } = await import('../src/lib/chatbot/services/pdfService');
            const ocrResult = await processUploadedFile(PDF_PATH);
            
            if (ocrResult && ocrResult.text && ocrResult.text.trim()) {
              pdfDocs = [new Document({
                pageContent: ocrResult.text.trim(),
                metadata: { 
                  source: PDF_PATH, 
                  type: 'pdf_ocr', 
                  pages: ocrResult.pages || 'unknown',
                  filename: 'Company_Profile_TVKU_2025_web.pdf'
                }
              })];
              console.log(`   -> OCR success: ${ocrResult.text.length} chars extracted`);
            } else {
              console.log('   -> OCR returned empty result');
            }
            
          } catch (ocrError) {
            console.error('   -> OCR failed:', ocrError.message);
          }
        }
      }
      
      if (pdfDocs.length > 0) {
        console.log(`   -> PDF content preview: ${pdfDocs[0].pageContent.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error(`   -> All PDF loading methods failed:`, error.message);
    }
    console.log(`   -> PDF: ${pdfDocs.length} dokumen`);
    
    // Only load JSON for specific info not in PDF (ratecard, contacts, etc)
    const jsonLoader = new JSONLoader(JSON_PATH, ["/rateCard", "/kontakKerjaSama", "/mediaSosial", "/fasilitas"]);
    const jsonDocs = await jsonLoader.load();
    console.log(`   -> JSON (limited): ${jsonDocs.length} dokumen`);

    // 2. Load dynamic documents
    console.log("2. Memuat dokumen dinamis...");
    const dynamicDocs = await createDynamicDocuments();
    console.log(`   -> Dinamis: ${dynamicDocs.length} dokumen`);

    // 3. Combine all documents
    const allDocs = [...pdfDocs, ...jsonDocs, ...dynamicDocs];
    console.log(`\n📄 Total dokumen: ${allDocs.length}`);

    if (allDocs.length === 0) {
      throw new Error("Tidak ada dokumen yang berhasil dimuat!");
    }

    // 4. Split documents
    console.log("\n3. Memecah dokumen...");
    const textSplitter = new RecursiveCharacterTextSplitter({ 
      chunkSize: 1000, 
      chunkOverlap: 200 
    });
    const splits = await textSplitter.splitDocuments(allDocs);
    console.log(`   -> ${splits.length} potongan dokumen`);

    // 5. Clean old collection
    console.log("\n4. Membersihkan koleksi lama...");
    const client = new ChromaClient({ 
      host: "localhost",
      port: 8000
    });
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log("   -> Koleksi lama dihapus");
    } catch (e) {
      console.log("   -> Tidak ada koleksi lama");
    }

    // 6. Create embeddings and store
    console.log("\n5. Membuat embeddings dan menyimpan...");
    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: OLLAMA_BASE_URL,
    });

    await Chroma.fromDocuments(splits, embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
    });

    console.log("\n✅ Enhanced Ingestion selesai!");
    console.log("📊 Data yang tersedia:");
    console.log("   - Company Profile PDF");
    console.log("   - Informasi TVKU (JSON)");
    console.log("   - Berita terbaru");
    console.log("   - Program TV");
    console.log("   - Jadwal acara");

  } catch (error) {
    console.error("\n❌ Error during ingestion:", error);
    process.exit(1);
  }
}

run();