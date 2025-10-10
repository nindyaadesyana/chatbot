#!/usr/bin/env tsx

import { ChromaClient } from 'chromadb';
import { RAG_CONFIG } from '../src/lib/chatbot/config/ragConfig';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
}

async function checkOllama(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      return {
        name: 'Ollama',
        status: 'unhealthy',
        message: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    const models = data.models || [];
    const hasLlama3 = models.some((m: any) => m.name?.includes('llama3'));
    const hasNomic = models.some((m: any) => m.name?.includes('nomic-embed-text'));
    
    if (!hasLlama3 || !hasNomic) {
      return {
        name: 'Ollama',
        status: 'unhealthy',
        message: `Missing models - llama3: ${hasLlama3}, nomic-embed-text: ${hasNomic}`
      };
    }
    
    return {
      name: 'Ollama',
      status: 'healthy',
      message: `${models.length} models available`,
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Ollama',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkChromaDB(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple connectivity test
    const response = await fetch('http://localhost:8000/', {
      signal: AbortSignal.timeout(5000)
    });
    
    // ChromaDB root endpoint returns empty 200, that's OK
    if (response.status !== 200) {
      return {
        name: 'ChromaDB',
        status: 'unhealthy',
        message: `Connection failed: HTTP ${response.status}`
      };
    }
    
    // Check collection
    const client = new ChromaClient({
      host: RAG_CONFIG.chroma.host,
      port: RAG_CONFIG.chroma.port
    });
    
    try {
      const collection = await client.getCollection({ 
        name: RAG_CONFIG.chroma.collectionName 
      });
      const count = await collection.count();
      
      return {
        name: 'ChromaDB',
        status: 'healthy',
        message: `Collection '${RAG_CONFIG.chroma.collectionName}' has ${count} documents`,
        responseTime: Date.now() - start
      };
    } catch (collectionError) {
      return {
        name: 'ChromaDB',
        status: 'unhealthy',
        message: `Collection '${RAG_CONFIG.chroma.collectionName}' not found - run ingest first`
      };
    }
  } catch (error) {
    return {
      name: 'ChromaDB',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkTVKUAPI(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const response = await fetch('https://apidev.tvku.tv/api/berita', {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return {
        name: 'TVKU API',
        status: 'unhealthy',
        message: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    const newsCount = data.data?.length || 0;
    
    return {
      name: 'TVKU API',
      status: 'healthy',
      message: `${newsCount} news articles available`,
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'TVKU API',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runHealthCheck(): Promise<void> {
  console.log('🏥 TVKU Chatbot Health Check\n');
  
  const checks = [
    checkOllama(),
    checkChromaDB(),
    checkTVKUAPI()
  ];
  
  const results = await Promise.all(checks);
  
  let allHealthy = true;
  
  for (const result of results) {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    const timeInfo = result.responseTime ? ` (${result.responseTime}ms)` : '';
    
    console.log(`${icon} ${result.name}${timeInfo}`);
    console.log(`   ${result.message}\n`);
    
    if (result.status === 'unhealthy') {
      allHealthy = false;
    }
  }
  
  if (allHealthy) {
    console.log('🎉 All services are healthy! Chatbot ready to use.');
    process.exit(0);
  } else {
    console.log('⚠️  Some services are unhealthy. Check the issues above.');
    console.log('\n🔧 Quick fixes:');
    console.log('   • Ollama: ollama serve');
    console.log('   • ChromaDB: docker run -d -p 8000:8000 chromadb/chroma');
    console.log('   • Missing collection: npm run ingest:enhanced');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runHealthCheck().catch(console.error);
}

export { runHealthCheck, checkOllama, checkChromaDB, checkTVKUAPI };