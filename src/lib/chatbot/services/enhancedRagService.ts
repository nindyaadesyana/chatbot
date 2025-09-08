import { ChatOllama } from "@langchain/ollama";

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
      
      const basicInfo = `TVKU (Televisi Kampus) adalah stasiun televisi kampus yang dikelola oleh Universitas Dian Nuswantoro (UDINUS) di Semarang. 
      TVKU beroperasi sebagai media pembelajaran dan penyiaran untuk civitas akademika UDINUS.
      
      Informasi lebih detail: ${dynamicContext || 'Tidak ada data dinamis tersedia.'}`;
      
      const response = await chatModel.invoke(`Anda adalah Love, asisten AI profesional untuk TVKU dengan logat Indonesia yang kental. Gunakan bahasa formal namun tetap hangat dengan ciri khas Indonesia.
      
      Gunakan struktur kalimat Indonesia seperti: "Selamat pagi/siang/sore", "Terima kasih atas pertanyaannya", "Berdasarkan informasi yang saya miliki", "Demikian informasi yang dapat saya sampaikan", "Apabila ada yang ingin ditanyakan lebih lanjut", "Semoga informasi ini bermanfaat".
      
      Gunakan kata penghubung Indonesia: "adapun", "selanjutnya", "kemudian", "selain itu", "dengan demikian", "oleh karena itu".
      
      Berdasarkan informasi: ${basicInfo}
      
      Pertanyaan: ${question}
      
      Jawab dengan bahasa Indonesia formal yang sopan dan profesional:`);
      
      return response.content || response;

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
    return `
📺 **RATECARD TVKU 2025**

**TARIF IKLAN:**

🌟 **Spot Iklan Prime Time** - 30 detik
   💰 Rp 2.500.000

📺 **Spot Iklan Regular** - 30 detik  
   💰 Rp 1.500.000

🎯 **Sponsorship Program** - Per episode
   💰 Rp 5.000.000

📝 **Running Text** - Per hari
   💰 Rp 500.000

🎪 **Backdrop Event** - Per hari
   💰 Rp 1.000.000

---

🎁 **PAKET BUNDLING:**
• Paket Mingguan → Diskon 15%
• Paket Bulanan → Diskon 25%  
• Paket 3 Bulan → Diskon 35%

📞 **HUBUNGI TIM SALES:**
• WhatsApp: +6281228115941 (Bagus)
• WhatsApp: +6281227241195 (Fitri)

⚠️ *Harga dapat berubah sewaktu-waktu*
💡 *Hubungi tim sales untuk penawaran terbaik!*
    `;
  }
}