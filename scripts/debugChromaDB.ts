import { ChromaClient } from "chromadb";
import { OllamaEmbeddings } from "@langchain/ollama";

async function debugChromaDB() {
  try {
    console.log('🔍 Debugging ChromaDB...');
    
    const client = new ChromaClient({ host: 'localhost', port: 8000 });
    const collection = await client.getCollection({ name: 'tvku_docs' });
    
    // Get all documents
    const allDocs = await collection.get();
    console.log(`📄 Total documents in ChromaDB: ${allDocs.documents?.length || 0}`);
    
    if (allDocs.documents && allDocs.documents.length > 0) {
      console.log('\n📋 Sample documents:');
      allDocs.documents.slice(0, 3).forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.substring(0, 200)}...`);
      });
    }
    
    // Test query for "direktur"
    console.log('\n🔍 Testing query for "direktur"...');
    const embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text',
      baseUrl: 'http://127.0.0.1:11434'
    });
    
    const queryEmbedding = await embeddings.embedQuery('direktur utama TVKU');
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5
    });
    
    console.log('\n📊 Query results:');
    if (results.documents && results.documents[0]) {
      results.documents[0].forEach((doc, i) => {
        console.log(`\n${i + 1}. Score: ${results.distances?.[0]?.[i] || 'N/A'}`);
        console.log(`Content: ${doc?.substring(0, 300)}...`);
      });
    } else {
      console.log('❌ No results found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugChromaDB();