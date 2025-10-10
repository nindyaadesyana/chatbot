// RAG System Configuration
export const RAG_CONFIG = {
  // Ollama Configuration
  ollama: {
    baseUrl: "http://127.0.0.1:11434",
    chatModel: "llama3",
    embeddingModel: "nomic-embed-text",
    chatParams: {
      temperature: 0.3,      // Lower for more consistent responses
      topK: 40,             // Limit vocabulary for focused responses
      topP: 0.9,            // Nucleus sampling
      repeatPenalty: 1.1,   // Reduce repetition
      numCtx: 4096          // Larger context window
    },
    embeddingParams: {
      numCtx: 2048,         // Optimized for embeddings
      temperature: 0        // Deterministic embeddings
    }
  },

  // ChromaDB Configuration
  chroma: {
    host: "localhost",
    port: 8000,
    url: "http://localhost:8000",
    collectionName: "tvku_docs"
  },

  // Retrieval Configuration
  retrieval: {
    maxResults: 8,          // Number of documents to retrieve
    relevanceThreshold: 0.7, // Similarity threshold (lower = more similar)
    topDocuments: 4,        // Final number of documents to use
    prioritizePdf: true     // Give PDF content higher priority
  },

  // Text Splitting Configuration
  textSplitting: {
    chunkSize: 800,         // Smaller chunks for better precision
    chunkOverlap: 150,      // Reduced overlap
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    keepSeparator: true,
    batchSize: 50           // Batch size for ingestion
  },

  // Response Configuration
  response: {
    minLength: 20,          // Minimum response length
    maxRetries: 2,          // Max retries for failed responses
    fallbackToJson: true,   // Use JSON data as fallback
    includeGreeting: true   // Include time-based greeting
  },

  // Keyword Matching
  keywords: {
    news: ['berita', 'news', 'hari ini', 'terbaru', 'terkini', 'update', 'informasi', 'kabar'],
    programs: ['program', 'acara', 'tayangan', 'siaran', 'show'],
    schedule: ['jadwal', 'schedule', 'waktu', 'jam', 'kapan'],
    ratecard: ['ratecard', 'rate card', 'tarif iklan', 'harga iklan', 'biaya iklan']
  },

  // API Configuration
  api: {
    timeout: 10000,         // 10 second timeout
    retries: 3,             // Number of retries
    cacheTimeout: 300000    // 5 minute cache for API data
  }
};

// Greeting configuration based on time
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'Selamat pagi';
  if (hour >= 10 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

// Document priority weights
export const DOCUMENT_PRIORITIES = {
  pdf: 1.0,           // Highest priority for PDF content
  pdf_ocr: 1.0,       // Same as PDF
  dynamic_news: 0.9,  // High priority for fresh news
  dynamic_programs: 0.8,
  dynamic_schedule: 0.8,
  json: 0.6           // Lower priority for static JSON
};