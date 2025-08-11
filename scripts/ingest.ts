import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json"; // <-- TAMBAHKAN INI
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma"; 
import { join } from "path";

// --- URL OLLAMA TVKU ---
const TVKU_OLLAMA_BASE_URL = "https://www.tvku.tv/chat/"; 

// --- SUMBER DATA ---
const PDF_PATH = join(process.cwd(), "public", "Company_Profile_TVKU_2025_web.pdf");
const JSON_PATH = join(process.cwd(), "public", "tentangTVKU.json"); // <-- TAMBAHKAN INI
const COLLECTION_NAME = "tvku_docs";

async function run() {
  try {
    console.log("1. Memuat dokumen dari PDF dan JSON...");
    const pdfLoader = new PDFLoader(PDF_PATH);
    const jsonLoader = new JSONLoader(JSON_PATH); // <-- TAMBAHKAN INI

    const pdfDocs = await pdfLoader.load();
    const jsonDocs = await jsonLoader.load(); // <-- TAMBAHKAN INI

    // Gabungkan dokumen dari kedua sumber
    const allDocs = [...pdfDocs, ...jsonDocs]; // <-- GANTI INI (dari 'docs' menjadi 'allDocs')

    console.log(`   -> Berhasil memuat ${pdfDocs.length} halaman dari PDF.`);
    console.log(`   -> Berhasil memuat data dari JSON.`);

    console.log("2. Memecah semua dokumen...");
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splits = await textSplitter.splitDocuments(allDocs); // <-- GANTI INI (dari 'docs' menjadi 'allDocs')
    console.log(`   -> Total dokumen dipecah menjadi ${splits.length} potongan.`);

    console.log("3. Menghasilkan embeddings dan menyimpan ke ChromaDB...");
    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text", // Pastikan model ini ada di Ollama TVKU
      baseUrl: TVKU_OLLAMA_BASE_URL,
    });

    await Chroma.fromDocuments(splits, embeddings, { // <-- GANTI INI (dari 'splits' hasil 'docs' menjadi 'splits' hasil 'allDocs')
      collectionName: COLLECTION_NAME,
      url: "http://localhost:8000",
    });

    console.log("✅ Ingestion selesai! Pengetahuan dari PDF dan JSON sudah siap.");

  } catch (error) {
    console.error("Terjadi kesalahan saat proses ingestion:", error);
  }
}

run();