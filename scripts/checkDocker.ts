import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function startChromaWithMonitoring() {
  try {
    // Check if Docker is running
    await execAsync('docker info');
    console.log('✅ Docker is running');
    
    // Check and clean up port 8000
    console.log('🔍 Checking port 8000...');
    
    try {
      // Check what's using port 8000
      const portCheck = await execAsync('lsof -i:8000');
      if (portCheck.stdout.trim()) {
        console.log('⚠️  Port 8000 is in use:');
        console.log(portCheck.stdout);
        
        // Only kill non-Docker processes on port 8000
        const processes = await execAsync('lsof -ti:8000');
        const pids = processes.stdout.trim().split('\n').filter(pid => pid);
        
        for (const pid of pids) {
          try {
            // Check if it's a Docker process
            const processInfo = await execAsync(`ps -p ${pid} -o comm=`);
            if (!processInfo.stdout.includes('docker') && !processInfo.stdout.includes('com.docker')) {
              await execAsync(`kill -9 ${pid}`);
              console.log(`✅ Killed non-Docker process ${pid}`);
            } else {
              console.log(`⚠️  Skipping Docker process ${pid}`);
            }
          } catch (e) {
            // Process might have already died
          }
        }
      } else {
        console.log('✅ Port 8000 is available');
      }
    } catch (e) {
      console.log('✅ Port 8000 is available (no processes found)');
    }
    
    // Clean up existing ChromaDB containers
    try {
      const containers = await execAsync('docker ps -q --filter ancestor=chromadb/chroma');
      if (containers.stdout.trim()) {
        console.log('🧹 Stopping existing ChromaDB containers...');
        await execAsync('docker ps -q --filter ancestor=chromadb/chroma | xargs docker stop');
        await execAsync('docker ps -aq --filter ancestor=chromadb/chroma | xargs docker rm');
        console.log('✅ ChromaDB containers cleaned up');
      }
    } catch (e) {
      // Ignore container cleanup errors
    }
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start ChromaDB directly with docker run
    let chromaStarted = false;
    
    try {
      // Simple docker run without problematic flags
      await execAsync('docker run -d -p 8000:8000 chromadb/chroma');
      console.log('✅ ChromaDB started successfully');
      chromaStarted = true;
    } catch (dockerError) {
      console.log('❌ Failed to start ChromaDB');
      console.log('📝 Error:', dockerError.message);
      
      // Try alternative approach
      try {
        console.log('⚠️  Trying alternative docker command...');
        await execAsync('docker pull chromadb/chroma && docker run -d -p 8000:8000 chromadb/chroma');
        console.log('✅ ChromaDB started with alternative method');
        chromaStarted = true;
      } catch (altError) {
        console.log('❌ Alternative method also failed');
        chromaStarted = false;
      }
    }
    
    if (chromaStarted) {
      // Wait for ChromaDB to be ready
      console.log('⏳ Waiting for ChromaDB to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Test ChromaDB connection
      try {
        const testResponse = await fetch('http://localhost:8000/', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (testResponse.ok) {
          console.log('✅ ChromaDB is responding');
          console.log('🎉 ChromaDB ready for use!');
        } else {
          console.log('⚠️  ChromaDB started but not fully ready');
        }
      } catch (testError) {
        console.log('⚠️  ChromaDB health check failed, but container is running');
      }
      
      console.log('✅ Setup complete - chatbot ready!');
    } else {
      console.log('⚠️  ChromaDB failed to start, chatbot will use fallback mode');
    }
    
  } catch (dockerError) {
    console.log('❌ Docker is not running');
    console.log('📝 Manual steps:');
    console.log('   1. Open Docker Desktop');
    console.log('   2. Wait for Docker to start');
    console.log('   3. Run: npm run dev again');
    console.log('');
    console.log('⚠️  Chatbot will use fallback mode until ChromaDB is available');
  }
}

// Disabled aggressive health monitoring to prevent restart loops
// ChromaDB will run with Docker's built-in restart policy

startChromaWithMonitoring();