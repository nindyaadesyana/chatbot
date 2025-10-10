import { ChatOllama } from "@langchain/ollama";
import tentangTVKU from '../../../../public/tentangTVKU.json';
import { RAG_CONFIG, getTimeBasedGreeting, DOCUMENT_PRIORITIES } from '../config/ragConfig';
import { PerformanceMonitor, ResponseQualityAnalyzer } from '../utils/performanceMonitor';

// Anti-hallucination chat model with strict parameters
const chatModel = new ChatOllama({
  baseUrl: RAG_CONFIG.ollama.baseUrl,
  model: RAG_CONFIG.ollama.chatModel,
  temperature: 0.1,      // VERY low temperature
  topK: 10,             // Severely limit vocabulary
  topP: 0.5,            // Strict nucleus sampling
  repeatPenalty: 1.3,   // High repeat penalty
  numCtx: 2048,         // Smaller context
  stop: ['\n\n\n', 'Berdasarkan pengetahuan', 'Menurut saya', 'Saya rasa'] // Stop hallucination phrases
});

export class EnhancedRAGService {
  static async processQuery(question: string): Promise<string> {
    const endTimer = PerformanceMonitor.startTimer('total_query_processing');
    
    try {
      console.log(`[Enhanced RAG] Processing: "${question}"`);

      const dynamicTimer = PerformanceMonitor.startTimer('dynamic_context_retrieval');
      const dynamicContext = await this.getDynamicContext(question);
      dynamicTimer();
      
      // Check for ratecard questions using configured keywords
      if (RAG_CONFIG.keywords.ratecard.some(keyword => question.toLowerCase().includes(keyword))) {
        return this.getRatecardTable();
      }
      
      // Direct JSON fallbacks to prevent hallucination
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
      
      // Specific organizational questions - give concise answers
      if (lowerQ.includes('direktur utama')) {
        return `${getTimeBasedGreeting()}!\n\nDirektur Utama TVKU adalah Dr. Guruh Fajar Shidik, M.Cs.\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('kepala produksi')) {
        return `${getTimeBasedGreeting()}!\n\nKepala Produksi TVKU adalah Trias.\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('sosmed') || lowerQ.includes('social media') || lowerQ.includes('instagram') || lowerQ.includes('youtube')) {
        const sosmed = tentangTVKU.mediaSosial;
        return `${getTimeBasedGreeting()}!\n\nAkun media sosial TVKU:\n\nInstagram: @${sosmed.instagram}\nYouTube: ${sosmed.youtube}\nTikTok: @${sosmed.tiktok}\nWebsite: ${sosmed.website}\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('direktur') || lowerQ.includes('struktur') || lowerQ.includes('organisasi')) {
        return `${getTimeBasedGreeting()}!\n\nStruktur Organisasi TVKU:\n\n👨‍💼 **DIREKTUR UTAMA**\nDr. Guruh Fajar Shidik, M.Cs\n\n👨‍💼 **DIREKTUR OPERASIONAL**\nDr. Hery Pamungkas, S.S., M.I.Kom\n\n👩‍💼 **DIREKTUR HRD & KEUANGAN**\nRinowati N\n\n📺 **KEPALA PRODUKSI**\nTrias\n\n📰 **KEPALA NEWS**\nTutuk Toto Carito\n\n🎬 **MANAGER HUMAS & MARKETING**\nDeka Sukma Artayoga\n\nSemoga informasi ini bermanfaat!`;
      }
      
      if (lowerQ.includes('alamat') || lowerQ.includes('lokasi') || lowerQ.includes('address')) {
        return `${getTimeBasedGreeting()}!\n\nAlamat TVKU:\n📍 **Kompleks Udinus Gedung E, Jl. Nakula 1 No.5-11 Lt.2, Pendrikan Kidul, Semarang Tengah, Semarang City, Central Java 50131**\n\nUntuk informasi lebih lanjut, silakan hubungi:\n• Tim Sales: Deka (081390245687)\n• Official Digital Marketing: 085156471303\n\nSemoga informasi ini bermanfaat!`;
      }
      
      // Handle specific organizational structure questions
      if (lowerQ.includes('kepala produksi')) {
        // Force RAG search for organizational data only
        const orgQuery = 'kepala produksi struktur organisasi TVKU';
        // Continue to RAG processing with modified query
        question = orgQuery;
      }
      
      // Priority system: API -> RAG -> JSON
      let contextInfo = '';
      
      if (dynamicContext) {
        // 1. PRIORITY: API TVKU data available
        contextInfo = `Data real-time TVKU: ${dynamicContext}`;
      } else {
        // 2. PRIORITY: Try RAG (PDF documents)
        try {
          // Use direct ChromaDB query instead of langchain wrapper
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
            requestOptions: RAG_CONFIG.ollama.embeddingParams
          });
          
          // Enhance query for better matching
          let enhancedQuery = question;
          if (question.toLowerCase().includes('motto')) {
            enhancedQuery = `motto TVKU menumbuhkan ilmu visi misi ${question}`;
          }
          
          const queryEmbedding = await embeddings.embedQuery(enhancedQuery);
          console.log(`[DEBUG] Enhanced query: "${enhancedQuery}"`);
          // Enhanced retrieval with configurable parameters
          const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: 15, // Increase to get more candidates
            include: ['documents', 'metadatas', 'distances']
          });
          
          console.log(`[DEBUG] Retrieved ${results.documents?.[0]?.length || 0} documents from ChromaDB`);
          
          // Filter results by relevance threshold
          const relevantDocs: any[] = [];
          if (results.documents && results.documents[0] && results.distances && results.distances[0]) {
            for (let i = 0; i < results.documents[0].length; i++) {
              const distance = results.distances[0][i];
              const metadata = results.metadatas?.[0]?.[i] || {};
              
              // Apply relevance threshold
              if (distance && distance < RAG_CONFIG.retrieval.relevanceThreshold) {
                // Calculate priority score
                const docType = metadata.type || 'unknown';
                const priorityWeight = DOCUMENT_PRIORITIES[docType as keyof typeof DOCUMENT_PRIORITIES] || 0.5;
                const relevanceScore = (1 - distance) * priorityWeight;
                
                relevantDocs.push({
                  content: results.documents[0][i] || '',
                  metadata: metadata,
                  distance: distance,
                  relevanceScore: relevanceScore
                });
              }
            }
          }
          
          if (relevantDocs.length > 0) {
            // Sort by combined relevance score
            const sortedDocs = relevantDocs.sort((a, b) => {
              return b.relevanceScore - a.relevanceScore;
            });
            
            // Take top documents based on configuration
            const topDocs = sortedDocs.slice(0, RAG_CONFIG.retrieval.topDocuments);
            const context = topDocs.map(doc => doc.content || '').join('\n\n');
            
            // DEBUG: Log actual context being sent to LLM
            console.log(`[DEBUG] Context being sent to LLM:`);
            console.log(`[DEBUG] Context length: ${context.length} chars`);
            console.log(`[DEBUG] Context preview: ${context.substring(0, 500)}...`);
            if (question.toLowerCase().includes('motto')) {
              console.log(`[DEBUG] Full context for motto query:`, context);
            }
            
            console.log(`[Enhanced RAG] Using ${topDocs.length} documents with scores:`, 
              topDocs.map(d => ({ type: d.metadata?.type, score: d.relevanceScore?.toFixed(3) })));
            
            // Get time-based greeting from config
            const greeting = getTimeBasedGreeting();
            
            // Enhanced prompt with better context handling
            const contextTypes = topDocs.map(doc => doc.metadata?.type || 'unknown').join(', ');
            
            // Filter context based on question type
            let filteredContext = context;
            const lowerQ = question.toLowerCase();
            
            if (lowerQ.includes('kepala') || lowerQ.includes('manajer') || lowerQ.includes('direktur') || lowerQ.includes('struktur')) {
              // For organizational questions, prioritize PDF content
              const orgDocs = topDocs.filter(doc => 
                doc.metadata?.type === 'pdf' || 
                doc.content.toLowerCase().includes('direktur') ||
                doc.content.toLowerCase().includes('kepala') ||
                doc.content.toLowerCase().includes('manajer')
              );
              if (orgDocs.length > 0) {
                filteredContext = orgDocs.map(doc => doc.content).join('\n\n');
              }
            }
            
            const prompt = `SISTEM: Anda adalah asisten AI untuk TVKU. WAJIB ikuti aturan ini:

KONTEKS RELEVAN:
${filteredContext}

PERTANYAAN: ${question}

ATURAN KETAT:
- HANYA jawab dari KONTEKS RELEVAN di atas
- BERIKAN informasi faktual, bukan roleplay
- DILARANG menyebut "Saya" atau berperan sebagai orang tersebut
- Format jawaban: ${greeting} + [Nama jabatan] adalah [Nama orang] + "Semoga bermanfaat"
- Contoh: "Kepala Produksi TVKU adalah Trias"
- DILARANG: "Saya Kepala Produksi" atau roleplay lainnya

JAWABAN FAKTUAL:`;
            
            const response = await chatModel.invoke(prompt);
            
            const answer = typeof response === 'string' ? response : String(response.content || response);
            
            // ANTI-HALLUCINATION VALIDATION
            const hallucinationKeywords = [
              'menurut saya', 'saya rasa', 'kemungkinan', 'mungkin saja',
              'berdasarkan pengetahuan', 'secara umum', 'biasanya',
              'pada umumnya', 'menginspirasi generasi', 'membantu generasi'
            ];
            
            const isHallucination = hallucinationKeywords.some(keyword => 
              answer.toLowerCase().includes(keyword)
            );
            
            if (isHallucination) {
              console.log('[ANTI-HALLUCINATION] Detected hallucination, using fallback');
              return `${getTimeBasedGreeting()}!\n\nMaaf, informasi yang Anda tanyakan belum tersedia dalam database saya saat ini.\n\nSaya dapat membantu dengan informasi seputar TVKU seperti program acara, berita, struktur organisasi, atau kontak tim sales.\n\nSemoga informasi ini bermanfaat!`;
            }
            
            // Quality analysis
            const qualityAnalysis = ResponseQualityAnalyzer.analyzeResponse(question, answer, topDocs);
            PerformanceMonitor.recordMetric('response_quality', qualityAnalysis);
            
            // Quality validation
            if (answer && answer.trim().length > RAG_CONFIG.response.minLength) {
              const finalAnswer = answer.trim();
              endTimer();
              PerformanceMonitor.logPerformance('total_query_processing', {
                question_length: question.length,
                response_length: finalAnswer.length,
                quality_score: qualityAnalysis.score,
                context_source: 'rag'
              });
              
              return finalAnswer;
            }
          }
        } catch (error: any) {
          console.log('[Enhanced RAG] Direct ChromaDB query failed:', error?.message || error);
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
          // More polite fallback for unrelated questions
          const greeting = getTimeBasedGreeting();
          return `${greeting}!\n\nMaaf, saya adalah asisten virtual TVKU yang khusus membantu informasi seputar TVKU (Televisi Kampus Universitas Dian Nuswantoro).\n\nSaya dapat membantu Anda dengan informasi tentang:\n• Program acara TVKU\n• Berita terbaru\n• Struktur organisasi\n• Ratecard iklan\n• Kontak tim sales\n• Media sosial TVKU\n\nSilakan tanyakan hal-hal terkait TVKU ya!\n\nSemoga informasi ini bermanfaat!`;
        }
      }
      
      // Get time-based greeting from config
      const greeting = getTimeBasedGreeting();
      
      // Enhanced fallback prompt
      const prompt = `SISTEM: Asisten TVKU. ATURAN KETAT:

DATA TERSEDIA:
${contextInfo}

PERTANYAAN: ${question}

WAJIB:
- HANYA dari DATA di atas
- DILARANG mengarang
- Jika tidak ada: "Data tidak tersedia"
- Format: ${greeting} + jawaban + "Semoga bermanfaat"

JAWABAN:`;
      
      const response = await chatModel.invoke(prompt);
      
      // Handle different response types from Ollama
      if (typeof response === 'string') {
        return response;
      }
      if (response && typeof response === 'object' && 'content' in response) {
        return String(response.content);
      }
      return String(response);

    } catch (error: any) {
      endTimer();
      console.error("[Enhanced RAG] Error:", error);
      PerformanceMonitor.recordMetric('errors', {
        error: error?.message || error,
        question: question,
        timestamp: new Date()
      });
      return "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.";
    }
  }

  private static async getDynamicContext(question: string): Promise<string | null> {
    const lowerQuestion = question.toLowerCase();
    
    try {
      // Enhanced keyword matching for news
      if (RAG_CONFIG.keywords.news.some(keyword => lowerQuestion.includes(keyword))) {
        const newsResponse = await fetch('https://apidev.tvku.tv/api/berita');
        const newsData = await newsResponse.json();
        
        if (newsData.data && Array.isArray(newsData.data) && newsData.data.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayNews = newsData.data.filter((news: any) => 
            news && news.created_at && typeof news.created_at === 'string' && news.created_at.startsWith(today)
          );
          
          if (todayNews.length > 0) {
            const latestNews = todayNews[0];
            return `BERITA HARI INI TVKU:\n\n${latestNews.judul}\nKategori: ${latestNews.kategori?.nama || 'Umum'}\nWaktu: ${new Date(latestNews.waktu_publish).toLocaleDateString('id-ID')}`;
          } else {
            const latestNews = newsData.data[0];
            return `BERITA TERBARU TVKU:\n\n${latestNews.judul}\nKategori: ${latestNews.kategori?.nama || 'Umum'}\nWaktu: ${new Date(latestNews.waktu_publish).toLocaleDateString('id-ID')}`;
          }
        }
        return 'BERITA: Tidak ada berita tersedia.';
      }

      // Enhanced keyword matching for programs
      if (RAG_CONFIG.keywords.programs.some(keyword => lowerQuestion.includes(keyword))) {
        const programResponse = await fetch('https://apidev.tvku.tv/api/program');
        const programData = await programResponse.json();
        return `PROGRAM TVKU:\n${JSON.stringify(programData.data?.slice(0, 3) || [], null, 2)}`;
      }

      // Enhanced keyword matching for schedule
      if (RAG_CONFIG.keywords.schedule.some(keyword => lowerQuestion.includes(keyword))) {
        const scheduleResponse = await fetch('https://apidev.tvku.tv/api/jadwal');
        const scheduleData = await scheduleResponse.json();
        return `JADWAL TVKU:\n${JSON.stringify(scheduleData.data?.slice(0, 5) || [], null, 2)}`;
      }

      return null;
    } catch (error: any) {
      console.error("[Enhanced RAG] Error getting dynamic context:", error);
      return null;
    }
  }

  private static async getAllPrograms(): Promise<string> {
    const greeting = getTimeBasedGreeting();
    let response = `${greeting}!\n\nProgram-program TVKU:\n\n`;
    
    try {
      const apiResponse = await fetch('https://apidev.tvku.tv/api/program', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          response += '📺 **PROGRAM TERBARU TVKU:**\n';
          data.data.forEach((item: any, index: number) => {
            response += `${index + 1}. ${item.program}\n`;
            if (item.path) {
              response += `   Kategori: ${item.path}\n`;
            }
            response += '\n';
          });
        } else {
          response += '⚠️ Data program tidak ditemukan dari API\n\n';
        }
        
        // Add debug info
        console.log('API Response:', JSON.stringify(data, null, 2));
      } else {
        response += '⚠️ Gagal mengambil data dari API TVKU\n\n';
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      response += '⚠️ Tidak dapat terhubung ke server TVKU\n\n';
    }
    
    response += '📞 **Info lebih lanjut:** Hubungi tim TVKU\n\n';
    response += 'Semoga informasi ini bermanfaat!';
    
    return response;
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