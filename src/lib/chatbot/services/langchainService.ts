import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
// Impor Chroma melalui LangChain Community
import { Chroma } from "@langchain/community/vectorstores/chroma"; 
import { OllamaEmbeddings } from "@langchain/ollama";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

// --- GANTI DENGAN URL OLLAMA TVKU ---
const TVKU_OLLAMA_CHAT_URL = "https://www.tvku.tv/chat/"; // <-- GANTI INI!

const chatModel = new ChatOllama({
  baseUrl: TVKU_OLLAMA_CHAT_URL,
  model: "llama3", // Model untuk menjawab pertanyaan
});

const embeddings = new OllamaEmbeddings({
  baseUrl: TVKU_OLLAMA_CHAT_URL,
  model: "nomic-embed-text",
});

const COLLECTION_NAME = "tvku_docs";

export async function askWithRAG(question: string): Promise<string> {
  try {
    console.log(`[RAG] Menerima pertanyaan: "${question}"`);

    // Hubungkan ke Vector Store yang sudah dibuat oleh ingest.ts
    const vectorStore = new Chroma(embeddings, {
        collectionName: COLLECTION_NAME,
        url: "http://localhost:8000",
    });

    const retriever = vectorStore.asRetriever({ k: 4 });

    const prompt = ChatPromptTemplate.fromTemplate(`
      Anda adalah "Love", asisten AI untuk TVKU. Jawab pertanyaan HANYA berdasarkan konteks berikut. Jika jawaban tidak ada di konteks, katakan "Maaf, saya tidak menemukan informasi tersebut."

      KONTEKS:
      {context}

      PERTANYAAN:
      {input}

      JAWABAN:`
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
    
    const result = await retrievalChain.invoke({ input: question });
    return result.answer;

  } catch (error) {
    console.error("[RAG] Terjadi kesalahan:", error);
    return "Maaf, terjadi kesalahan saat saya mencoba mencari jawaban.";
  }
}