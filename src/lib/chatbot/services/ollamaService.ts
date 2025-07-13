import { OLLAMA_CONFIG } from '../config/api';

export class OllamaService {
  static async generateResponse(prompt: string): Promise<string> {
    try {
      // Add timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(OLLAMA_CONFIG.URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.MODEL,
          prompt: prompt,
          stream: false,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      
      // Fallback responses
      if (prompt.includes('Berita Terkini TVKU')) {
        return this.generateFallbackNewsResponse(prompt);
      }
      
      // General fallback
      return 'Maaf, sistem AI sedang mengalami gangguan. Tapi saya tetap bisa membantu dengan informasi TVKU. Silakan tanya tentang berita, jadwal acara, atau informasi lainnya.';
    }
  }

  private static generateFallbackNewsResponse(prompt: string): string {
    const newsSection = prompt.match(/### \[Berita Terkini TVKU\][\s\S]*/);
    if (newsSection) {
      return `Halo! Berikut adalah berita terkini dari TVKU. ${newsSection[0].replace(/###|\*\*/g, '')} Ada yang ingin ditanyakan lebih lanjut tentang berita-berita ini?`;
    }
    return 'Maaf, sistem sedang mengalami gangguan. Silakan coba lagi nanti.';
  }
}