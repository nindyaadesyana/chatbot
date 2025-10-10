import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function keepChromaAlive() {
  console.log('🔄 Starting ChromaDB health monitor...');
  
  setInterval(async () => {
    try {
      // Check if ChromaDB is responding
      const response = await fetch('http://localhost:8000/api/v1/heartbeat', {
        method: 'GET',
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error('ChromaDB not responding');
      }
      
      console.log('✅ ChromaDB healthy');
      
    } catch (error) {
      console.log('❌ ChromaDB down, restarting...');
      
      try {
        // Kill existing containers
        await execAsync('docker kill $(docker ps -q --filter ancestor=chromadb/chroma) 2>/dev/null || true');
        
        // Start new container
        await execAsync('docker run -d -p 8000:8000 --restart=always chromadb/chroma');
        
        // Wait for startup
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ ChromaDB restarted');
        
      } catch (restartError) {
        console.log('❌ Failed to restart ChromaDB:', restartError.message);
      }
    }
  }, 30000); // Check every 30 seconds
}

keepChromaAlive();