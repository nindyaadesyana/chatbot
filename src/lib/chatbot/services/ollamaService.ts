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
      
      // Fallback responses: coba tampilkan data yang sudah ada di prompt
      const fallbackSections = [
        { label: 'Berita Terkini TVKU', regex: /### \[Berita Terkini TVKU\][\s\S]*?(?=###|$)/ },
        { label: 'Acara Terkini', regex: /### \[Acara Terkini\][\s\S]*?(?=###|$)/ },
        { label: 'Jadwal Acara Terkini', regex: /### \[Jadwal Acara Terkini\][\s\S]*?(?=###|$)/ },
        { label: 'Our Programs', regex: /### \[Our Programs\][\s\S]*?(?=###|$)/ },
        // Lebih fleksibel: cocokkan label program acara apapun
        { label: 'Program Acara', regex: /### \[Program Acara.*?\][\s\S]*?(?=###|$)/ },
        { label: 'Seputar Dinus', regex: /### \[Seputar Dinus\][\s\S]*?(?=###|$)/ },
        { label: 'Rate Card', regex: /### \[Rate Card\][\s\S]*?(?=###|$)/ },
      ];
      let foundSection = '';
      for (const section of fallbackSections) {
        const match = prompt.match(section.regex);
        if (match && match[0].trim().length > 0) {
          foundSection += `\n\n${match[0].replace(/###/g, '').trim()}`;
        }
      }
      if (foundSection) {
        return `Berikut data TVKU yang berhasil diambil:${foundSection}\n\nJika ingin bertanya lebih lanjut, silakan ketik pertanyaan lain.`;
      }
      // Jika tidak ada data sama sekali
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

  private static generateFallbackRateCardResponse(prompt: string): string {
    const rateCardSection = prompt.match(/### \[Rate Card\][\s\S]*?(?=###|$)/);
    if (rateCardSection) {
      return `Berikut adalah Rate Card TVKU:\n\n${rateCardSection[0].replace(/###|\[|\]/g, '')}\n\nUntuk informasi lebih lanjut atau konsultasi, silakan hubungi tim marketing TVKU. Ada yang ingin ditanyakan tentang layanan iklan kami?`;
    }
    return 'Maaf, sistem sedang mengalami gangguan. Silakan coba lagi nanti.';
  }
}