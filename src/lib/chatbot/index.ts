import { ResponseHandler } from './utils/responseHandler';
import { EnhancedRAGService } from './services/enhancedRagService';

export class ChatbotService {
  static async processMessage(prompt: string): Promise<string> {
    // 1. Validasi input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt tidak valid');
    }

    // 2. Handle greetings and thanks
    if (ResponseHandler.isGreeting(prompt)) {
      return ResponseHandler.getGreetingResponse();
    }
    if (ResponseHandler.isThankYou(prompt)) {
      return ResponseHandler.getThankYouResponse();
    }

    // 3. Use Enhanced RAG for all queries
    console.log("-> Menggunakan Enhanced RAG Service");
    return await EnhancedRAGService.processQuery(prompt);
  }
}

export * from './services/dataService';
export * from './services/tvkuService';
export * from './services/enhancedRagService';
export * from './utils/responseHandler';
export * from './types';