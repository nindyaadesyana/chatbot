import fs from 'fs/promises';
import path from 'path';
import { ITentangTVKU, IRateCard } from '../types';

export class TVKUService {
  private static readonly SOCIAL_MEDIA_MAP: Record<string, string> = {
    tvku_ig: "https://www.instagram.com/tvku_smg",
    tvku_yt: "https://www.youtube.com/@TVKU_udinus",
    tvku_tt: "https://www.tiktok.com/@tvku_smg"
  };

  static async getTentangTVKU(): Promise<string> {
    try {
      const filePath = path.join(process.cwd(), 'public', 'tentangTVKU.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: ITentangTVKU = JSON.parse(fileContent);
      
      let formattedData = `### [Tentang TVKU]\n${data.kataPengantar}\n\n`;
      formattedData += `### [Visi dan Misi]\n**Visi:** ${data.visi}\n**Misi:** ${data.misi}\n\n`;

      if (data.rateCard && data.rateCard.length > 0) {
        formattedData += `### [Rate Card]\n`;
        const rateCards: IRateCard[] = data.rateCard; 
        rateCards.forEach((item: IRateCard) => {
          formattedData += `- ${item.acara}: ${item.durasi} (${item.harga})\n`;
        });
        formattedData += '\n';
      }

      if (data.mediaSosial) {
        formattedData += `### [Media Sosial]\n`;
        for (const [platform, code] of Object.entries(data.mediaSosial)) {
          const url = this.SOCIAL_MEDIA_MAP[code as keyof typeof this.SOCIAL_MEDIA_MAP];
          formattedData += `- [${platform}: ${code}](${url})\n`; 
        }
      }

      return formattedData;
    } catch (error) {
      console.error('Gagal membaca tentangTVKU.json:', error);
      return '';
    }
  }
}