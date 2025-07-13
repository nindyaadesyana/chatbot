import { GREETING_KEYWORDS, GREETING_RESPONSE } from '../config/prompts';

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
}