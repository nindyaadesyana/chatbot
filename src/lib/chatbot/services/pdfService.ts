// src/lib/chatbot/services/pdfService.ts
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

let pdfContentCache: string | null = null;

export class PDFService {
  static async getPDFContent(): Promise<string> {
    if (pdfContentCache) {
      return pdfContentCache;
    }

    try {
      const pdfPath = path.join(process.cwd(), 'public', 'Company_Profile_TVKU_2025_web.pdf');
      
      // ✅ LANGKAH VERIFIKASI: Kita akan log path ini ke terminal
      console.log("--- MEMBACA PDF DARI PATH:", pdfPath, "---");
      
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdf(dataBuffer);
      
      pdfContentCache = `\n\n### [Informasi dari Company Profile PDF]\n${data.text}`;
      
      return pdfContentCache;
    } catch (error) {
      console.error('Gagal membaca atau parsing file PDF:', error);
      return ''; 
    }
  }
}