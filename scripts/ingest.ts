// scripts/ingest.ts

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb"; // <-- Impor ChromaClient
import { join } from "path";

// --- KONFIGURASI ---
const OLLAMA_BASE_URL = "http://127.0.0.1:11434"; // <-- Port sudah diperbaiki
const PDF_PATH = join(process.cwd(), "public", "Company_Profile_TVKU_2025_web.pdf");
const JSON_PATH = join(process.cwd(), "public", "tentangTVKU.json");
const COLLECTION_NAME = "tvku_docs";
const CHROMA_URL = "http://localhost:8000";

async function run() {
  try {
    // 1. Memuat semua dokumen sumber
    console.log("1. Memuat dokumen dari PDF dan JSON...");
    const pdfLoader = new PDFLoader(PDF_PATH);
    const jsonLoader = new JSONLoader(JSON_PATH);
    const pdfDocs = await pdfLoader.load();
    const jsonDocs = await jsonLoader.load();
    const allDocs = [...pdfDocs, ...jsonDocs];

    if (pdfDocs.length === 0) {
      console.warn("   -> PERINGATAN: Tidak ada halaman yang termuat dari PDF. Pastikan file tidak kosong atau rusak.");
    } else {
      console.log(`   -> Berhasil memuat ${pdfDocs.length} halaman dari PDF.`);
    }
    console.log(`   -> Berhasil memuat data dari JSON.`);

    if (allDocs.length === 0) {
      throw new Error("Tidak ada dokumen yang berhasil dimuat. Proses dihentikan.");
    }

    // 2. Memecah dokumen menjadi potongan-potongan
    console.log("2. Memecah semua dokumen...");
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splits = await textSplitter.splitDocuments(allDocs);
    console.log(`   -> Total dokumen dipecah menjadi ${splits.length} potongan.`);

    // 3. Menghapus koleksi lama di ChromaDB (untuk memastikan data fresh)
    console.log("3. Menghubungkan ke ChromaDB untuk membersihkan data lama...");
    const client = new ChromaClient({ path: CHROMA_URL });
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log("   -> Koleksi lama berhasil dihapus.");
    } catch (e) {
      console.log("   -> Tidak ada koleksi lama untuk dihapus, melanjutkan...");
    }

    // 4. Menghasilkan embeddings dan menyimpan ke ChromaDB
    console.log("4. Menghasilkan embeddings dan menyimpan dokumen baru...");
    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: OLLAMA_BASE_URL,
    });

    // Gunakan metode standar fromDocuments, ini akan membuat koleksi baru
    await Chroma.fromDocuments(splits, embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
    });

    console.log("✅ Ingestion selesai! Pengetahuan TVKU sudah siap.");

  } catch (error) {
    console.error("Terjadi kesalahan saat proses ingestion:", error);
  }
}

run();