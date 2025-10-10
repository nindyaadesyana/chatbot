import { EnhancedRAGService } from '../src/lib/chatbot/services/enhancedRagService';
import { PerformanceMonitor } from '../src/lib/chatbot/utils/performanceMonitor';

async function testQueries() {
  console.log('🧪 Testing RAG Tuning Performance...\n');

  const testQueries = [
    'Apa itu TVKU?',
    'Berita hari ini',
    'Program acara TVKU',
    'Jadwal TVKU',
    'Ratecard iklan TVKU',
    'Visi misi TVKU',
    'Kontak sales TVKU'
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing: "${query}"`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    try {
      const response = await EnhancedRAGService.processQuery(query);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`📏 Response length: ${response.length} chars`);
      console.log(`🎯 Response preview: ${response.substring(0, 100)}...`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  // Show performance summary
  console.log('\n📊 Performance Summary:');
  console.log('═'.repeat(50));
  const summary = PerformanceMonitor.getMetricsSummary();
  console.log(JSON.stringify(summary, null, 2));
}

testQueries().catch(console.error);