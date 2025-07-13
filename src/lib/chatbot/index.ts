import { ResponseHandler } from './utils/responseHandler';
import { PromptBuilder } from './utils/promptBuilder';
import { OllamaService } from './services/ollamaService';

export class ChatbotService {
  static async processMessage(prompt: string): Promise<string> {
    // Validasi input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt tidak valid');
    }

    // Cek apakah greeting
    if (ResponseHandler.isGreeting(prompt)) {
      return ResponseHandler.getGreetingResponse();
    }

    // Build prompt dengan data yang relevan
    const promptBuilder = new PromptBuilder(prompt);
    const fullPrompt = await promptBuilder.build();

    // Debug log untuk development
    if (process.env.NODE_ENV === 'development') {
      console.log("Full Prompt:\n", fullPrompt);
    }

    // Generate response dari Ollama
    return await OllamaService.generateResponse(fullPrompt);
  }
}

// Export semua service untuk fleksibilitas
export * from './services/dataService';
export * from './services/tvkuService';
export * from './services/ollamaService';
export * from './utils/promptBuilder';
export * from './utils/responseHandler';
export * from './types';
export * from './config/api';
export * from './config/prompts';