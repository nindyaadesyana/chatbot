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
    const rateCardKeywords = ['rate card', 'ratecard', 'harga', 'tarif', 'biaya', 'iklan', 'price'];
    const programKeywords = ['program', 'program acara', 'program tvku', 'our programs'];
    
    if (newsKeywords.some(keyword => this.prompt.includes(keyword))) {
      console.log('Fetching berita...');
      const beritaData = await DataService.getBerita();
      console.log('Berita data:', beritaData);
      fullPrompt += beritaData;
    }

    if (scheduleKeywords.some(keyword => this.prompt.includes(keyword))) {
      fullPrompt += await DataService.getJadwalAcara();
    }

    if (programKeywords.some(keyword => this.prompt.includes(keyword))) {
      fullPrompt += await DataService.getProgramAcara();
    }

    if (this.prompt.includes("seputar dinus")) {
      fullPrompt += await DataService.getSeputarDinus();
    }

    // Rate card section hanya akan ditambahkan jika memang diminta user
    if (
      rateCardKeywords.some(keyword => this.prompt.includes(keyword)) &&
      !programKeywords.some(keyword => this.prompt.includes(keyword)) &&
      !/program(\s|\b)/.test(this.prompt)
    ) {
      // Ambil ulang tentangTVKU.json hanya untuk rate card
      try {
        const filePath = require('path').join(process.cwd(), 'public', 'tentangTVKU.json');
        const fileContent = require('fs').readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (data.rateCard && data.rateCard.length > 0) {
          let rateCardSection = `\n\n### [Rate Card]\n`;
          // Tampilkan dalam bentuk tabel markdown
          rateCardSection += `| Acara | Durasi | Harga |\n|-------|--------|--------|\n`;
          data.rateCard.forEach((item: any) => {
            rateCardSection += `| ${item.acara} | ${item.durasi} | ${item.harga} |\n`;
          });
          fullPrompt += rateCardSection + '\n';
        }
      } catch (e) {
        console.error('Gagal mengambil rate card:', e);
      }
    }

    console.log('Full prompt length:', fullPrompt.length);
    return fullPrompt;
  }
}