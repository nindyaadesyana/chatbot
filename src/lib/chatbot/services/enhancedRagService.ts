import { ChatOllama } from "@langchain/ollama";
import tentangTVKU from '../../../../public/tentangTVKU.json';
import { RAG_CONFIG, getTimeBasedGreeting } from '../config/ragConfig';

// Ultra-stable model configuration for maximum accuracy
const chatModel = new ChatOllama({
  baseUrl: RAG_CONFIG.ollama.baseUrl,
  model: RAG_CONFIG.ollama.chatModel,
  temperature: 0.3,      // Sedikit lebih tinggi untuk kualitas bahasa yang lebih baik
  topK: 10,             // Lebih banyak pilihan kosakata
  topP: 0.5,            // Pengambilan sampel yang lebih baik
  repeatPenalty: 1.2,   // Penalti lebih rendah untuk alur alami
  numCtx: 4096,
  stop: ['\n\n\n', 'Berdasarkan', 'Menurut', 'Saya rasa', 'Kemungkinan', 'Mungkin', 'Sepertinya']
});

export class EnhancedRAGService {
  static async processQuery(question: string): Promise<string> {
    try {
      console.log(`[Enhanced RAG] Processing: "${question}"`);

      // Check if question is about TVKU topics - MUST BE FIRST CHECK
      const isTVKUQuestion = this.isTVKURelated(question);
      console.log('[DEBUG] Question:', question);
      console.log('[DEBUG] Is TVKU related:', isTVKUQuestion);
      
      if (!isTVKUQuestion) {
        console.log('[DEBUG] RETURNING REJECTION MESSAGE');
        const rejectionMessage = `${getTimeBasedGreeting()}!\n\nMaaf, saya hanya bisa memberikan informasi seputar TVKU (Televisi Kampus Universitas Dian Nuswantoro).\n\nSaya dapat membantu dengan:\n• Berita TVKU\n• Program acara\n• Jadwal siaran\n• Struktur organisasi\n• Ratecard iklan\n• Kontak tim sales\n\nSemoga bermanfaat!`;
        console.log('[DEBUG] Rejection message:', rejectionMessage);
        return rejectionMessage;
      }
      
      console.log('[DEBUG] Proceeding with TVKU processing...');
      const dynamicContext = await this.getDynamicContext(question);
      
      // Check for ratecard questions (only for TVKU topics)
      const ratecardKeywords = RAG_CONFIG.keywords.ratecard;
      const matchedRatecardKeyword = ratecardKeywords.find(keyword => question.toLowerCase().includes(keyword));
      console.log('[DEBUG] Ratecard keywords:', ratecardKeywords);
      console.log('[DEBUG] Matched ratecard keyword:', matchedRatecardKeyword);
      
      if (matchedRatecardKeyword) {
        console.log('[DEBUG] Returning ratecard table for keyword:', matchedRatecardKeyword);
        return this.getRatecardTable();
      }
      
      // Direct JSON responses
      const lowerQ = question.toLowerCase();
      
      if (lowerQ.includes('motto')) {
        return `${getTimeBasedGreeting()}!\n\nMotto TVKU adalah "${tentangTVKU.motto}".\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('visi') && lowerQ.includes('misi')) {
        return `${getTimeBasedGreeting()}!\n\n**Visi TVKU:**\n"${tentangTVKU.visi}"\n\n**Misi TVKU:**\n"${tentangTVKU.misi}"\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('visi')) {
        return `${getTimeBasedGreeting()}!\n\nVisi TVKU adalah "${tentangTVKU.visi}".\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('misi')) {
        return `${getTimeBasedGreeting()}!\n\nMisi TVKU adalah "${tentangTVKU.misi}".\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('kontak') || lowerQ.includes('sales')) {
        const kontakList = tentangTVKU.kontakKerjaSama.map(k => `• ${k.nama}: ${k.telepon}`).join('\n');
        return `${getTimeBasedGreeting()}!\n\nKontak Tim Sales TVKU:\n${kontakList}\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('program')) {
        return await this.getAllPrograms();
      }
      
      if (lowerQ.includes('direktur utama')) {
        return `${getTimeBasedGreeting()}!\n\nDirektur Utama TVKU adalah Dr. Guruh Fajar Shidik, M.Cs.\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('direktur operasional')) {
        return `${getTimeBasedGreeting()}!\n\nDirektur Operasional TVKU adalah Dr. Hery Pamungkas, S.S., M.I.Kom.\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('direktur hrd') || lowerQ.includes('direktur keuangan')) {
        return `${getTimeBasedGreeting()}!\n\nDirektur HRD & Keuangan TVKU adalah Rinowati N.\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('kepala produksi')) {
        return `${getTimeBasedGreeting()}!\n\nKepala Produksi TVKU adalah Trias.\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('kepala news')) {
        return `${getTimeBasedGreeting()}!\n\nKepala News TVKU adalah Tutuk Toto Carito.\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('manager humas') || lowerQ.includes('manager marketing')) {
        return `${getTimeBasedGreeting()}!\n\nManager Humas & Marketing TVKU adalah Deka Sukma Artayoga.\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('direktur') || lowerQ.includes('struktur') || lowerQ.includes('organisasi')) {
        return `${getTimeBasedGreeting()}!\n\nStruktur Organisasi TVKU:\n\n👨💼 **DIREKTUR UTAMA**\nDr. Guruh Fajar Shidik, M.Cs\n\n👨💼 **DIREKTUR OPERASIONAL**\nDr. Hery Pamungkas, S.S., M.I.Kom\n\n👩💼 **DIREKTUR HRD & KEUANGAN**\nRinowati N\n\n📺 **KEPALA PRODUKSI**\nTrias\n\n📰 **KEPALA NEWS**\nTutuk Toto Carito\n\n🎬 **MANAGER HUMAS & MARKETING**\nDeka Sukma Artayoga\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('sosmed') || lowerQ.includes('social media') || lowerQ.includes('instagram') || lowerQ.includes('youtube') || lowerQ.includes('tiktok') || lowerQ.includes('media sosial')) {
        const sosmed = tentangTVKU.mediaSosial;
        return `${getTimeBasedGreeting()}!\n\nAkun Media Sosial TVKU:\n\n📱 Instagram: @${sosmed.instagram}\n🎥 YouTube: ${sosmed.youtube}\n🎵 TikTok: @${sosmed.tiktok}\n🌐 Website: ${sosmed.website}\n\nSemoga bermanfaat!`;
      }
      
      if (lowerQ.includes('alamat') || lowerQ.includes('lokasi')) {
        return `${getTimeBasedGreeting()}!\n\nAlamat TVKU:\n📍 **Kompleks Udinus Gedung E, Jl. Nakula 1 No.5-11 Lt.2, Pendrikan Kidul, Semarang Tengah, Semarang City, Central Java 50131**\n\nSemoga bermanfaat!`;
      }
      
      // Advanced RAG: API + Vector Search + Anti-Hallucination
      if (dynamicContext) {
        const greeting = getTimeBasedGreeting();
        const prompt = `SISTEM: Asisten TVKU profesional.\n\nDATA: ${dynamicContext}\nPERTANYAAN: ${question}\n\nATURAN:\n- Jawab dengan ejaan yang benar\n- Gunakan bahasa Indonesia yang baik\n- Jangan gunakan emoji atau simbol\n- Format: ${greeting} + jawaban + "Semoga bermanfaat"\n\nJAWABAN:`;
        const response = await chatModel.invoke(prompt);
        const answer = typeof response === 'string' ? response : String(response.content || response);
        return this.validateResponse(answer, dynamicContext, question);
      }
      
      // Advanced RAG fallback with vector search + validation
      const vectorContext = await this.getVectorContext(question);
      if (vectorContext) {
        const greeting = getTimeBasedGreeting();
        const prompt = `SISTEM: Asisten TVKU.\n\nKONTEKS: ${vectorContext}\nPERTANYAAN: ${question}\n\nATURAN:\n- Jawab langsung dari konteks\n- Jangan gunakan emoji atau simbol\n- Jangan tambah penjelasan dalam kurung\n- Format: ${greeting} + jawaban + "Semoga bermanfaat"\n\nJAWABAN:`;
        const response = await chatModel.invoke(prompt);
        const answer = typeof response === 'string' ? response : String(response.content || response);
        return this.validateResponse(answer, vectorContext, question);
      }
      
      // Final fallback
      const greeting = getTimeBasedGreeting();
      return `${greeting}!\n\nSaya dapat membantu dengan informasi TVKU seperti:\n• Berita terbaru\n• Program acara\n• Jadwal siaran\n• Ratecard iklan\n• Kontak tim sales\n\nSilakan tanyakan hal terkait TVKU!\n\nSemoga bermanfaat!`;

    } catch (error: any) {
      console.error("[Enhanced RAG] Error:", error);
      return "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.";
    }
  }

  private static async getDynamicContext(question: string): Promise<string | null> {
    const lowerQuestion = question.toLowerCase();
    
    try {
      // Check for news keywords
      if (RAG_CONFIG.keywords.news.some(keyword => lowerQuestion.includes(keyword))) {
        const response = await fetch('https://apidev.tvku.tv/api/berita');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.length > 0) {
            const news = data.data[0];
            return `BERITA TERBARU TVKU:\n\n${news.judul}\nKategori: ${news.kategori?.nama || 'Umum'}\nWaktu: ${new Date(news.waktu_publish).toLocaleDateString('id-ID')}`;
          }
        }
        return null;
      }

      // Check for program keywords
      if (RAG_CONFIG.keywords.programs.some(keyword => lowerQuestion.includes(keyword))) {
        const response = await fetch('https://apidev.tvku.tv/api/program');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.length > 0) {
            const programs = data.data.slice(0, 5).map((p: any) => `• ${p.program}`).join('\n');
            return `PROGRAM TVKU TERBARU:\n\n${programs}`;
          }
        }
        return null;
      }

      // Check for schedule keywords
      if (RAG_CONFIG.keywords.schedule.some(keyword => lowerQuestion.includes(keyword))) {
        const response = await fetch('https://apidev.tvku.tv/api/jadwal');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.length > 0) {
            const schedule = data.data.slice(0, 3).map((s: any) => `• ${s.program || s.acara}`).join('\n');
            return `JADWAL TVKU:\n\n${schedule}`;
          }
        }
        return null;
      }

      return null;
    } catch (error: any) {
      console.error("[Enhanced RAG] API error:", error);
      return null;
    }
  }

  private static async getAllPrograms(): Promise<string> {
    const greeting = getTimeBasedGreeting();
    
    try {
      const response = await fetch('https://apidev.tvku.tv/api/program');
      if (response.ok) {
        const data = await response.json();
        if (data.data?.length > 0) {
          const programs = data.data.map((item: any, i: number) => `${i + 1}. ${item.program}`).join('\n');
          return `${greeting}!\n\n📺 **PROGRAM ACARA TVKU:**\n${programs}\n\n📞 **Info lebih lanjut:** Hubungi tim TVKU\n\nSemoga bermanfaat!`;
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
    
    return `${greeting}!\n\nMaaf, data program tidak tersedia saat ini. Hubungi tim TVKU untuk info lebih lanjut.\n\nSemoga bermanfaat!`;
  }

  private static async getVectorContext(question: string): Promise<string | null> {
    try {
      const { ChromaClient } = await import('chromadb');
      const { OllamaEmbeddings } = await import('@langchain/ollama');
      
      const client = new ChromaClient({ 
        host: RAG_CONFIG.chroma.host, 
        port: RAG_CONFIG.chroma.port 
      });
      
      const collection = await client.getCollection({ 
        name: RAG_CONFIG.chroma.collectionName 
      });
      
      const embeddings = new OllamaEmbeddings({
        model: RAG_CONFIG.ollama.embeddingModel,
        baseUrl: RAG_CONFIG.ollama.baseUrl,
      });
      
      // Query expansion for better retrieval
      const expandedQueries = this.expandQuery(question);
      const allResults: any[] = [];
      
      for (const query of expandedQueries) {
        const queryEmb = await embeddings.embedQuery(query);
        const results = await collection.query({
          queryEmbeddings: [queryEmb],
          nResults: 5,
          include: ['documents', 'metadatas', 'distances']
        });
        
        if (results.documents?.[0]) {
          allResults.push(...results.documents[0].map((doc, i) => ({
            content: doc,
            distance: results.distances?.[0]?.[i] || 1,
            metadata: results.metadatas?.[0]?.[i] || {}
          })));
        }
      }
      
      // Intelligence: Advanced filtering and reranking
      const relevantDocs = allResults
        .filter(doc => doc.distance < 0.6)  // Stricter threshold for stability
        .map(doc => ({
          ...doc,
          // Intelligence: Multi-factor scoring
          intelligenceScore: this.calculateIntelligenceScore(doc, question)
        }))
        .sort((a, b) => b.intelligenceScore - a.intelligenceScore)  // Sort by intelligence score
        .slice(0, 3);
      
      if (relevantDocs.length > 0) {
        return relevantDocs.map(doc => doc.content).join('\n\n');
      }
      
      return null;
    } catch (error) {
      console.error('[Vector Search] Error:', error);
      return null;
    }
  }
  
  private static expandQuery(query: string): string[] {
    const synonyms = {
      'program': ['program', 'acara', 'tayangan', 'siaran'],
      'berita': ['berita', 'news', 'informasi', 'kabar'],
      'direktur': ['direktur', 'pimpinan', 'kepala', 'manajer'],
      'visi': ['visi', 'tujuan', 'cita-cita'],
      'misi': ['misi', 'tugas', 'fungsi']
    };
    
    const expanded = [query];
    const words = query.toLowerCase().split(' ');
    
    for (const [key, values] of Object.entries(synonyms)) {
      if (words.some(word => word.includes(key))) {
        values.forEach(synonym => {
          if (!query.toLowerCase().includes(synonym)) {
            expanded.push(query.replace(new RegExp(key, 'gi'), synonym));
          }
        });
      }
    }
    
    return expanded.slice(0, 3);
  }

  private static validateResponse(answer: string, context: string, question: string): string {
    // Comprehensive cleanup and spell correction
    let cleanAnswer = answer
      .replace(/\([^)]*\)/g, '')  // Remove parentheses
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')  // Remove emojis
      .replace(/[^\w\s\.,!?\-:;"'\n]/g, '')  // Remove special characters
      .replace(/\s+/g, ' ')  // Normalize spaces
      .trim();
    
    // Fix common typos
    cleanAnswer = this.fixTypos(cleanAnswer);
    
    // Skip validation for API responses
    if (context.includes('BERITA TERBARU TVKU') || context.includes('PROGRAM TVKU') || context.includes('JADWAL TVKU')) {
      return cleanAnswer;
    }
    
    // Anti-hallucination keywords detection for non-API responses
    const hallucinationKeywords = [
      'menurut saya', 'saya rasa', 'kemungkinan', 'mungkin saja',
      'berdasarkan pengetahuan', 'secara umum', 'biasanya',
      'sepertinya', 'tampaknya', 'seharusnya'
    ];
    
    const hasHallucination = hallucinationKeywords.some(keyword => 
      answer.toLowerCase().includes(keyword)
    );
    
    if (hasHallucination) {
      return `${getTimeBasedGreeting()}!\n\nMaaf, informasi yang Anda tanyakan belum tersedia dalam database saya saat ini.\n\nSemoga bermanfaat!`;
    }
    
    const isFactuallyAccurate = this.checkFactualAccuracy(cleanAnswer, context);
    if (!isFactuallyAccurate) {
      return `${getTimeBasedGreeting()}!\n\nMaaf, saya tidak dapat memberikan informasi yang akurat untuk pertanyaan tersebut saat ini.\n\nSemoga bermanfaat!`;
    }
    
    return cleanAnswer;
  }
  
  private static checkFactualAccuracy(answer: string, context: string): boolean {
    // Intelligence: Multi-layer accuracy validation
    
    // 1. Extract key facts from answer
    const answerWords = answer.toLowerCase().split(/\s+/);
    const contextWords = context.toLowerCase().split(/\s+/);
    
    // 2. Filter meaningful terms (Intelligence)
    const keyTerms = answerWords.filter(word => 
      word.length > 3 && 
      !['yang', 'adalah', 'dengan', 'untuk', 'dari', 'pada', 'dalam', 'akan', 
        'dapat', 'juga', 'atau', 'dan', 'ini', 'itu', 'ada', 'tidak', 'sudah', 'belum', 'semoga', 'bermanfaat', 'informasi', 'tvku', 'selamat', 'pagi', 'siang', 'sore', 'malam'].includes(word)
    );
    
    // 3. Advanced matching with fuzzy logic (Intelligence)
    const matchedTerms = keyTerms.filter(term => 
      contextWords.some(contextWord => {
        // Exact match
        if (contextWord.includes(term) || term.includes(contextWord)) return true;
        // Fuzzy match for similar words
        if (this.calculateSimilarity(term, contextWord) > 0.8) return true;
        return false;
      })
    );
    
    // 4. Relaxed accuracy threshold for better usability (60%)
    const accuracy = keyTerms.length > 0 ? matchedTerms.length / keyTerms.length : 1;
    const isAccurate = accuracy >= 0.6;
    
    return isAccurate;
  }
  
  private static calculateSimilarity(str1: string, str2: string): number {
    // Intelligence: Levenshtein distance for fuzzy matching
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  private static calculateIntelligenceScore(doc: any, question: string): number {
    // Intelligence: Multi-factor document scoring
    const baseScore = 1 - doc.distance;  // Base relevance
    
    // Factor 1: Content length (longer = more informative)
    const lengthScore = Math.min(doc.content.length / 500, 1) * 0.2;
    
    // Factor 2: Keyword density
    const questionWords = question.toLowerCase().split(' ').filter(w => w.length > 2);
    const contentWords = doc.content.toLowerCase().split(' ');
    const keywordMatches = questionWords.filter((qw: string) => 
      contentWords.some((contentWord: string) => contentWord.includes(qw) || qw.includes(contentWord))
    ).length;
    const keywordScore = (keywordMatches / questionWords.length) * 0.3;
    
    // Factor 3: Metadata quality (if available)
    const metadataScore = doc.metadata?.type === 'pdf' ? 0.1 : 0.05;
    
    // Factor 4: Recency boost
    const recencyScore = doc.metadata?.uploaded_at ? 0.1 : 0;
    
    return baseScore + lengthScore + keywordScore + metadataScore + recencyScore;
  }

  private static fixTypos(text: string): string {
    const typoMap: { [key: string]: string } = {
      'selamt': 'selamat',
      'malammu': 'malam',
      'semuga': 'semoga',
      'bermenfat': 'bermanfaat',
      'bermanfat': 'bermanfaat',
      'bermenafet': 'bermanfaat',
      'beritanya': 'berita',
      'jalanan': 'Jalan',
      'jalan': 'Jalan',
      'hari ini adalah berita': 'terbaru TVKU adalah'
    };
    
    let corrected = text;
    for (const [typo, correct] of Object.entries(typoMap)) {
      const regex = new RegExp(typo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      corrected = corrected.replace(regex, correct);
    }
    
    return corrected;
  }

  private static isTVKURelated(question: string): boolean {
    const lowerQ = question.toLowerCase();
    console.log('[DEBUG] Checking question:', lowerQ);
    
    // Non-TVKU topics (should be rejected immediately)
    const nonTVKUKeywords = [
      'resep', 'masak', 'makanan', 'nasi goreng', 'ayam', 'sayur',
      'cuaca', 'weather', 'politik', 'ekonomi', 'sepak bola', 'musik',
      'film', 'game', 'teknologi umum', 'kesehatan', 'obat', 'dokter',
      'sekolah lain', 'universitas lain', 'kampus lain'
    ];
    
    // Check for non-TVKU topics first
    const hasNonTVKU = nonTVKUKeywords.some(keyword => lowerQ.includes(keyword));
    console.log('[DEBUG] Has non-TVKU keywords:', hasNonTVKU);
    
    if (hasNonTVKU) {
      console.log('[DEBUG] Rejecting non-TVKU topic');
      return false;
    }
    
    // TVKU-related keywords
    const tvkuKeywords = [
      'tvku', 'televisi kampus', 'udinus', 'universitas dian nuswantoro',
      'berita', 'program', 'acara', 'siaran', 'jadwal', 'schedule',
      'direktur', 'kepala', 'manajer', 'struktur', 'organisasi',
      'visi', 'misi', 'motto', 'alamat', 'lokasi', 'kontak', 'sales',
      'ratecard', 'tarif', 'iklan', 'harga', 'sosmed', 'instagram',
      'youtube', 'tiktok', 'media sosial', 'website'
    ];
    
    const hasTVKU = tvkuKeywords.some(keyword => lowerQ.includes(keyword));
    console.log('[DEBUG] Has TVKU keywords:', hasTVKU);
    
    return hasTVKU;
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
    } catch (error: any) {
      console.error('Error loading ratecard:', error);
      return 'Maaf, tidak dapat memuat data ratecard saat ini. Silakan hubungi tim sales langsung.';
    }
  }
}