import { GREETING_KEYWORDS, GREETING_RESPONSE, THANK_YOU_KEYWORDS, THANK_YOU_RESPONSE, OFF_TOPIC_RESPONSE } from '../config/prompts';

export class ResponseHandler {
  static isGreeting(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase().trim();
    return GREETING_KEYWORDS.some(word =>
      lowerPrompt === word || lowerPrompt.includes(word)
    );
  }

  static getGreetingResponse(): string {
    return GREETING_RESPONSE;
  }

  static isThankYou(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase().trim();
    return THANK_YOU_KEYWORDS.some(word => 
      lowerPrompt === word || lowerPrompt.includes(word)
    );
  }

  static getThankYouResponse(): string {
    return THANK_YOU_RESPONSE;
  }

  static isOffTopic(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    // TVKU related keywords
    const tvkuKeywords = [
      'tvku', 'tiviku', 'tv kampus', 'televisi kampus',
      'udinus', 'dian nuswantoro', 'universitas dian nuswantoro',
      'berita', 'news', 'program', 'acara', 'jadwal', 'schedule',
      'ratecard', 'tarif', 'iklan', 'advertising',
      'kerjasama', 'partnership', 'media sosial',
      'instagram', 'youtube', 'tiktok', 'website'
    ];
    
    // Check if prompt contains TVKU-related keywords
    const hasTVKUKeywords = tvkuKeywords.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    
    // Off-topic indicators
    const offTopicKeywords = [
      'cuaca', 'weather', 'resep', 'recipe', 'masak',
      'politik luar', 'olahraga internasional', 'film hollywood',
      'musik luar negeri', 'teknologi apple', 'teknologi google',
      'cara membuat', 'tutorial', 'belajar bahasa',
      'kesehatan umum', 'tips diet', 'fashion',
      'travel luar negeri', 'wisata luar negeri'
    ];
    
    const hasOffTopicKeywords = offTopicKeywords.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    
    // Return true if clearly off-topic and no TVKU keywords
    return hasOffTopicKeywords && !hasTVKUKeywords;
  }

  static getOffTopicResponse(): string {
    return OFF_TOPIC_RESPONSE;
  }

  static formatForTTS(response: string): string {
    // If it's off-topic response
    if (response === OFF_TOPIC_RESPONSE) {
      return response.replace(/TVKU/g, 'Tiviku');
    }
    
    // If it's news response, make it shorter
    if (response.includes('Berita Terkini')) {
      const newsCount = (response.match(/\d+\./g) || []).length;
      return `Berikut ${newsCount} berita terkini Tiviku. ${response.includes('Politik') ? 'Ada berita politik, ' : ''}${response.includes('Kriminal') ? 'berita kriminal, ' : ''}${response.includes('Peristiwa') ? 'berita peristiwa, ' : ''}dan berita lainnya. Silakan baca detail di layar atau tanya lebih lanjut.`;
    }
    
    return response
      .replace(/TVKU/g, 'Tiviku') // Fix pronunciation
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  static formatResponse(response: string): { display: string; speech: string } {
    return {
      display: response,
      speech: this.formatForTTS(response)
    };
  }
}