// src/lib/chatbot/index.ts

// Impor semua yang kita butuhkan
import { ResponseHandler } from './utils/responseHandler';
import { PromptBuilder } from './utils/promptBuilder';
import { OllamaService } from './services/ollamaService';
import { askWithRAG } from './services/langchainService'; // <-- Impor layanan RAG kita

export class ChatbotService {
  static async processMessage(prompt: string): Promise<string> {
    // 1. Validasi input dan sapaan (tetap sama)
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt tidak valid');
    }
    if (ResponseHandler.isGreeting(prompt)) {
      return ResponseHandler.getGreetingResponse();
    }
    if (ResponseHandler.isThankYou(prompt)) {
      return ResponseHandler.getThankYouResponse();
    }

    // 2. Logika Pengatur Lalu Lintas
    const isAskingForDynamicData = /berita|news|jadwal|acara|program/i.test(prompt);

    if (isAskingForDynamicData) {
      // --- JALUR LAMA (NON-RAG) ---
      // Untuk pertanyaan yang bisa dijawab oleh API dinamis
      console.log("-> Menggunakan alur PromptBuilder untuk data dinamis.");

      const promptBuilder = new PromptBuilder(prompt);
      const fullPrompt = await promptBuilder.build();

      if (process.env.NODE_ENV === 'development') {
        console.log("Full Prompt (Non-RAG):\n", fullPrompt);
      }

      return await OllamaService.generateResponse(fullPrompt);
    } 
    
    else {
      // --- JALUR BARU (RAG) ---
      // Untuk semua pertanyaan umum lainnya, gunakan RAG dari PDF.
      console.log("-> Menggunakan alur RAG untuk pertanyaan umum.");
      
      // Langsung panggil layanan RAG.
      // Fungsi askWithRAG sudah mencakup proses mencari dokumen DAN bertanya ke Ollama.
      return await askWithRAG(prompt);
    }
  }
}

// Ekspor semua service lain jika masih diperlukan di tempat lain
export * from './services/dataService';
export * from './services/tvkuService';
export * from './services/ollamaService';
export * from './utils/promptBuilder';
export * from './utils/responseHandler';
export * from './types';
export * from './config/api';
export * from './config/prompts';