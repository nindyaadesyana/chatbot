import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
// Impor Chroma melalui LangChain Community
import { Chroma } from "@langchain/community/vectorstores/chroma"; 
import { OllamaEmbeddings } from "@langchain/ollama";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

// --- GANTI DENGAN URL OLLAMA TVKU ---
const TVKU_OLLAMA_CHAT_URL = "http://127.0.0.1:11434"; 

const chatModel = new ChatOllama({
  baseUrl: TVKU_OLLAMA_CHAT_URL,
  model: "llama3", 
});

const embeddings = new OllamaEmbeddings({
  baseUrl: TVKU_OLLAMA_CHAT_URL,
  model: "nomic-embed-text",
});

const COLLECTION_NAME = "tvku_docs";

export async function askWithRAG(question: string): Promise<string> {
  try {
    console.log(`[RAG] Menerima pertanyaan: "${question}"`);

    // Check for real-time data queries first
    const lowerQuestion = question.toLowerCase();
    let dynamicContext = '';
    
    // Get real-time data from TVKU API
    if (lowerQuestion.includes('berita') || lowerQuestion.includes('news') || 
        lowerQuestion.includes('hari ini') || lowerQuestion.includes('terbaru') ||
        lowerQuestion.includes('terkini') || lowerQuestion.includes('update')) {
      try {
        const newsResponse = await fetch('https://apidev.tvku.tv/api/berita');
        const newsData = await newsResponse.json();
        
        if (newsData.data && Array.isArray(newsData.data) && newsData.data.length > 0) {
          // Check if there's news from today
          const today = new Date().toISOString().split('T')[0];
          const todayNews = newsData.data.filter((news: any) => 
            news && news.created_at && typeof news.created_at === 'string' && news.created_at.startsWith(today)
          );
          
          if (todayNews.length > 0) {
            dynamicContext = `BERITA HARI INI:\n${JSON.stringify(todayNews.slice(0, 3), null, 2)}`;
          } else {
            // No news today, show latest news
            dynamicContext = `BERITA TERAKHIR (tidak ada berita hari ini):\n${JSON.stringify(newsData.data.slice(0, 3), null, 2)}`;
          }
        } else {
          dynamicContext = 'BERITA: Tidak ada berita tersedia saat ini.';
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        dynamicContext = 'BERITA: Gagal mengambil data berita.';
      }
    }
    
    if (lowerQuestion.includes('program') || lowerQuestion.includes('acara')) {
      try {
        const programResponse = await fetch('https://apidev.tvku.tv/api/program');
        const programData = await programResponse.json();
        dynamicContext += `\n\nPROGRAM TVKU:\n${JSON.stringify(programData.data?.slice(0, 3) || [], null, 2)}`;
      } catch (error) {
        console.error('Error fetching programs:', error);
      }
    }
    
    if (lowerQuestion.includes('jadwal') || lowerQuestion.includes('schedule')) {
      try {
        const scheduleResponse = await fetch('https://apidev.tvku.tv/api/jadwal');
        const scheduleData = await scheduleResponse.json();
        dynamicContext += `\n\nJADWAL TVKU:\n${JSON.stringify(scheduleData.data?.slice(0, 5) || [], null, 2)}`;
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    }

    // Hubungkan ke Vector Store yang sudah dibuat oleh ingest.ts
    const vectorStore = new Chroma(embeddings, {
        collectionName: COLLECTION_NAME,
        url: "http://localhost:8000",
    });

    const retriever = vectorStore.asRetriever({ k: 4 });

    const prompt = ChatPromptTemplate.fromTemplate(`
      Anda adalah Dira, asisten AI perempuan TVKU yang ramah dan natural. Jawab dengan gaya percakapan Indonesia yang santai tapi sopan.
      
      GAYA BICARA:
      - Gunakan bahasa sehari-hari yang natural
      - Sesekali pakai kata "nih", "ya", "sih", "dong" untuk kesan akrab
      - Jangan terlalu formal, tapi tetap sopan
      - Jawab langsung to the point
      
      CONTOH GAYA NATURAL:
      "Hai! TVKU itu dikelola sama Universitas Dian Nuswantoro di Semarang ya. Jadi ini televisi kampusnya UDINUS gitu. Ada yang mau ditanya lagi?"
      
      DATA REAL-TIME TVKU:
      ${dynamicContext}
      
      Jawab berdasarkan konteks berikut:

      KONTEKS:
      {context}

      PERTANYAAN:
      {input}

      JAWABAN (natural dan santai tapi informatif, prioritaskan data real-time jika ada):`
    );

    const chain = await createStuffDocumentsChain({
      llm: chatModel,
      prompt,
      outputParser: new StringOutputParser(),
    });

    const retrievalChain = await createRetrievalChain({
      combineDocsChain: chain,
      retriever,
    });
    
    let result;
    try {
      result = await retrievalChain.invoke({ input: question });
      if (!result || !result.answer) {
        throw new Error('No answer from retrieval chain');
      }
    } catch (error) {
      console.error('[RAG] Retrieval chain error:', error);
      return 'Maaf, saya tidak menemukan informasi tersebut dalam dokumen yang tersedia.';
    }
    
    // Make response more natural
    let answer = result.answer;
    
    // Add casual greeting if too formal
    if (answer.includes('Selamat pagi/siang/sore')) {
      answer = answer.replace('Selamat pagi/siang/sore', 'Hai');
    }
    
    // Make it more conversational
    answer = answer.replace(/\baku\b/g, 'aku');
    answer = answer.replace(/Berdasarkan informasi yang saya miliki/g, 'Jadi gini');
    answer = answer.replace(/Demikian informasi yang dapat saya sampaikan/g, 'Itu aja sih infonya');
    
    return answer;

  } catch (error) {
    console.error("[RAG] Terjadi kesalahan:", error);
    return "Maaf, terjadi kesalahan saat saya mencoba mencari jawaban.";
  }
}