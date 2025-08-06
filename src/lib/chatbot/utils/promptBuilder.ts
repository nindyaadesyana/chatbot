// src/lib/chatbot/utils/promptBuilder.ts
import { SYSTEM_PROMPT } from '../config/prompts';
import { DataService } from '../services/dataService';
import { TVKUService } from '../services/tvkuService';
// import { PDFService } from '../services/pdfService'; // <-- PDF Service dimatikan sementara

export class PromptBuilder {
  private prompt: string = '';
  private systemPrompt: string = SYSTEM_PROMPT;

  constructor(userPrompt: string) {
    this.prompt = userPrompt.toLowerCase().trim();
  }

  async build(): Promise<string> {
    // --- BAGIAN PDF DIMATIKAN SEMENTARA UNTUK PENGUJIAN ---
    // const [tentangTVKU, pdfContent] = await Promise.all([
    //   TVKUService.getTentangTVKU(),
    //   PDFService.getPDFContent()
    // ]);
    const tentangTVKU = await TVKUService.getTentangTVKU(); // Hanya mengambil data dari JSON

    // let fullPrompt = `${this.systemPrompt}\n\n${tentangTVKU}\n${pdfContent}\n\nPertanyaan: ${this.prompt}`;
    let fullPrompt = `${this.systemPrompt}\n\n${tentangTVKU}\n\nPertanyaan: ${this.prompt}`; // Prompt tanpa data PDF
    // --- AKHIR BAGIAN PENGUJIAN ---

    console.log('User prompt:', this.prompt);

    const newsKeywords = ['berita', 'news', 'kabar', 'informasi', 'terbaru', 'hari ini'];
    const scheduleKeywords = ['jadwal', 'schedule', 'jam'];
    const programKeywords = ['program', 'program acara', 'program tvku', 'our programs'];
    const rateCardKeywords = ['rate card', 'ratecard', 'harga', 'tarif', 'biaya', 'iklan', 'price'];

    if (newsKeywords.some(keyword => this.prompt.includes(keyword))) {
      console.log('Fetching berita...');
      fullPrompt += await DataService.getBerita();
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

    if (
      rateCardKeywords.some(keyword => this.prompt.includes(keyword)) &&
      !programKeywords.some(keyword => this.prompt.includes(keyword))
    ) {
      try {
        const filePath = require('path').join(process.cwd(), 'public', 'tentangTVKU.json');
        const fileContent = require('fs').readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (data.rateCard && data.rateCard.length > 0) {
          let rateCardSection = `\n\n### [Rate Card]\n`;
          rateCardSection += `| Acara | Durasi | Harga |\n|-------|--------|--------|\n`;
          data.rateCard.forEach((item: any) => {
            rateCardSection += `| ${item.acara} | ${item.durasi} | ${item.harga} |\n`;
          });
          fullPrompt += rateCardSection;
        }
      } catch (e) {
        console.error('Gagal mengambil data rate card secara eksplisit:', e);
      }
    }

    console.log('Final prompt length:', fullPrompt.length);
    return fullPrompt;
  }
}