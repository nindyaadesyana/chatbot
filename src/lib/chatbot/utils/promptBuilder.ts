import { SYSTEM_PROMPT } from '../config/prompts';
import { DataService } from '../services/dataService';
import { TVKUService } from '../services/tvkuService';

export class PromptBuilder {
  private prompt: string = '';
  private systemPrompt: string = SYSTEM_PROMPT;

  constructor(userPrompt: string) {
    this.prompt = userPrompt.toLowerCase().trim();
  }

  async build(): Promise<string> {
    let fullPrompt = `${this.systemPrompt}\n\n${await TVKUService.getTentangTVKU()}\n\nPertanyaan: ${this.prompt}`;

    console.log('User prompt:', this.prompt);

    // Improved keyword detection
    const newsKeywords = ['berita', 'news', 'kabar', 'informasi', 'terbaru', 'hari ini'];
    const eventKeywords = ['acara', 'event', 'kegiatan'];
    const scheduleKeywords = ['jadwal', 'schedule', 'jam'];
    
    if (newsKeywords.some(keyword => this.prompt.includes(keyword))) {
      console.log('Fetching berita...');
      const beritaData = await DataService.getBerita();
      console.log('Berita data:', beritaData);
      fullPrompt += beritaData;
    }

    if (eventKeywords.some(keyword => this.prompt.includes(keyword))) {
      fullPrompt += await DataService.getAcara();
    }

    if (scheduleKeywords.some(keyword => this.prompt.includes(keyword))) {
      fullPrompt += await DataService.getJadwalAcara();
    }

    if (this.prompt.includes("our programs")) {
      fullPrompt += await DataService.getOurPrograms();
    }

    if (this.prompt.includes("program acara")) {
      fullPrompt += await DataService.getProgramAcara();
    }

    if (this.prompt.includes("seputar dinus")) {
      fullPrompt += await DataService.getSeputarDinus();
    }

    console.log('Full prompt length:', fullPrompt.length);
    return fullPrompt;
  }
}