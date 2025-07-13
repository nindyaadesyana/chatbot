import { OLLAMA_CONFIG } from '../config/api';

export class OllamaService {
  static async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await fetch(OLLAMA_CONFIG.URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.MODEL,
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      throw new Error('Gagal menghubungi API Ollama atau memproses data');
    }
  }
}