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

    if (this.prompt.includes("berita")) {
      fullPrompt += await DataService.getBerita();
    }

    if (this.prompt.includes("acara")) {
      fullPrompt += await DataService.getAcara();
    }

    if (this.prompt.includes("jadwal acara")) {
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

    return fullPrompt;
  }
}