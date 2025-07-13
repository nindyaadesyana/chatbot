import { GREETING_KEYWORDS, GREETING_RESPONSE, THANK_YOU_KEYWORDS, THANK_YOU_RESPONSE } from '../config/prompts';

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

  static formatForTTS(response: string): string {
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