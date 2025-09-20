import { ChatOllama } from "@langchain/ollama";
import tentangTVKU from '../../../../public/tentangTVKU.json';

const TVKU_OLLAMA_CHAT_URL = "http://127.0.0.1:11434";

const chatModel = new ChatOllama({
  baseUrl: TVKU_OLLAMA_CHAT_URL,
  model: "llama3"
});

export class EnhancedRAGService {
  static async processQuery(question: string): Promise<string> {
    try {
      console.log(`[Enhanced RAG] Processing: "${question}"`);

      const dynamicContext = await this.getDynamicContext(question);
      
      // Check for ratecard questions
      if (question.toLowerCase().includes('ratecard') || question.toLowerCase().includes('rate card') || question.toLowerCase().includes('tarif iklan')) {
        return this.getRatecardTable();
      }
      
      // Priority system: API -> RAG -> JSON
      let contextInfo = '';
      
      if (dynamicContext) {
        // 1. PRIORITY: API TVKU data available
        contextInfo = `Data real-time TVKU: ${dynamicContext}`;
      } else {
        // 2. FALLBACK: Try RAG (PDF documents)
        try {
          const { askWithRAG } = await import('./langchainService');
          const ragResult = await askWithRAG(question);
          if (ragResult && ragResult.length > 50 && !ragResult.includes('tidak menemukan informasi') && !ragResult.includes('kesalahan')) {
            return ragResult; // Return RAG result directly
          }
        } catch (error) {
          console.log('[Enhanced RAG] RAG fallback failed, using JSON fallback:', error.message);
        }
        
        // 3. LAST RESORT: JSON fallback for specific info
        const tentangTVKU = await import('../../../../public/tentangTVKU.json');
        const jsonData = tentangTVKU.default;
        
        if (question.toLowerCase().includes('target') || question.toLowerCase().includes('pemirsa')) {
          contextInfo = `Target Viewers: ${jsonData.targetViewers}`;
        } else if (question.toLowerCase().includes('visi')) {
          contextInfo = `Visi TVKU: ${jsonData.visi}`;
        } else if (question.toLowerCase().includes('misi')) {
          contextInfo = `Misi TVKU: ${jsonData.misi}`;
        } else if (question.toLowerCase().includes('kontak') || question.toLowerCase().includes('sales')) {
          contextInfo = `Kontak: ${JSON.stringify(jsonData.kontakKerjaSama)}`;
        } else {
          contextInfo = 'TVKU adalah stasiun televisi kampus Universitas Dian Nuswantoro di Semarang.';
        }
      }
      
      const response = await chatModel.invoke(`Anda adalah Dira, asisten AI profesional untuk TVKU dengan logat Indonesia yang kental. Gunakan bahasa formal namun tetap hangat dengan ciri khas Indonesia.
      
      Gunakan struktur kalimat Indonesia seperti: "Selamat pagi/siang/sore", "Terima kasih atas pertanyaannya", "Berdasarkan informasi yang saya miliki", "Demikian informasi yang dapat saya sampaikan", "Apabila ada yang ingin ditanyakan lebih lanjut", "Semoga informasi ini bermanfaat".
      
      Gunakan kata penghubung Indonesia: "adapun", "selanjutnya", "kemudian", "selain itu", "dengan demikian", "oleh karena itu".
      
      Berdasarkan informasi: ${contextInfo}
      
      Pertanyaan: ${question}
      
      Jawab dengan bahasa Indonesia formal yang sopan dan profesional:`);
      
      // Handle different response types from Ollama
      if (typeof response === 'string') {
        return response;
      }
      if (response && typeof response === 'object' && 'content' in response) {
        return String(response.content);
      }
      return String(response);

    } catch (error) {
      console.error("[Enhanced RAG] Error:", error);
      return "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.";
    }
  }

  private static async getDynamicContext(question: string): Promise<string | null> {
    const lowerQuestion = question.toLowerCase();
    
    try {
      if (lowerQuestion.includes('berita') || lowerQuestion.includes('news') || 
          lowerQuestion.includes('hari ini') || lowerQuestion.includes('terbaru') ||
          lowerQuestion.includes('terkini') || lowerQuestion.includes('update')) {
        const newsResponse = await fetch('https://apidev.tvku.tv/api/berita');
        const newsData = await newsResponse.json();
        
        if (newsData.data && Array.isArray(newsData.data) && newsData.data.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayNews = newsData.data.filter((news: any) => 
            news && news.created_at && typeof news.created_at === 'string' && news.created_at.startsWith(today)
          );
          
          if (todayNews.length > 0) {
            return `BERITA HARI INI:\n${JSON.stringify(todayNews.slice(0, 3), null, 2)}`;
          } else {
            return `BERITA TERAKHIR:\n${JSON.stringify(newsData.data.slice(0, 3), null, 2)}`;
          }
        }
        return 'BERITA: Tidak ada berita tersedia.';
      }

      if (lowerQuestion.includes('program') || lowerQuestion.includes('acara')) {
        const programResponse = await fetch('https://apidev.tvku.tv/api/program');
        const programData = await programResponse.json();
        return `PROGRAM TVKU:\n${JSON.stringify(programData.data?.slice(0, 3) || [], null, 2)}`;
      }

      if (lowerQuestion.includes('jadwal') || lowerQuestion.includes('schedule')) {
        const scheduleResponse = await fetch('https://apidev.tvku.tv/api/jadwal');
        const scheduleData = await scheduleResponse.json();
        return `JADWAL TVKU:\n${JSON.stringify(scheduleData.data?.slice(0, 5) || [], null, 2)}`;
      }

      return null;
    } catch (error) {
      console.error("[Enhanced RAG] Error getting dynamic context:", error);
      return null;
    }
  }

  private static getRatecardTable(): string {
    try {
      const data = tentangTVKU;
      
      if (!data.rateCard || !Array.isArray(data.rateCard)) {
        return 'Maaf, data ratecard tidak tersedia saat ini.';
      }

      let table = `
📺 **RATECARD TVKU RESMI**

| **Jenis Layanan** | **Durasi** | **Harga** |
|-------------------|------------|----------|
`;

      data.rateCard.forEach((item: any) => {
        table += `| ${item.acara} | ${item.durasi} | ${item.harga} |\n`;
      });

      table += `
📞 **HUBUNGI TIM SALES:**
`;
      
      if (data.kontakKerjaSama && Array.isArray(data.kontakKerjaSama)) {
        data.kontakKerjaSama.forEach((kontak: any) => {
          table += `• ${kontak.nama}: ${kontak.telepon}\n`;
        });
      }

      table += `
⚠️ *Harga dapat berubah sewaktu-waktu*
💡 *Hubungi tim sales untuk penawaran terbaik!*`;

      return table;
    } catch (error) {
      console.error('Error loading ratecard:', error);
      return 'Maaf, tidak dapat memuat data ratecard saat ini. Silakan hubungi tim sales langsung.';
    }
  }
}