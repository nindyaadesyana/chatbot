import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
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

    // 1. Load static documents
    console.log("1. Memuat dokumen statis...");
    const pdfLoader = new PDFLoader(PDF_PATH);
    const jsonLoader = new JSONLoader(JSON_PATH);
    
    const [pdfDocs, jsonDocs] = await Promise.all([
      pdfLoader.load(),
      jsonLoader.load()
    ]);

    console.log(`   -> PDF: ${pdfDocs.length} halaman`);
    console.log(`   -> JSON: ${jsonDocs.length} dokumen`);

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