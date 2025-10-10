#!/usr/bin/env tsx

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkDockerCompose(): Promise<boolean> {
  try {
    await execAsync('docker-compose --version');
    return true;
  } catch {
    try {
      await execAsync('docker compose --version');
      return true;
    } catch {
      return false;
    }
  }
}

async function startChromaDB(): Promise<void> {
  console.log('🐳 Starting ChromaDB...');
  
  const hasDockerCompose = await checkDockerCompose();
  
  if (hasDockerCompose) {
    // Use docker-compose
    try {
      const command = await execAsync('docker-compose --version').then(() => 'docker-compose').catch(() => 'docker compose');
      await execAsync(`${command} up -d chromadb`);
      console.log('   ✅ ChromaDB started via docker-compose');
    } catch (error) {
      console.log('   ⚠️  docker-compose failed, falling back to docker run');
      await fallbackDockerRun();
    }
  } else {
    await fallbackDockerRun();
  }
}

async function fallbackDockerRun(): Promise<void> {
  try {
    // Stop existing containers
    await execAsync('docker stop $(docker ps -q --filter ancestor=chromadb/chroma) 2>/dev/null || true');
    await execAsync('docker rm $(docker ps -aq --filter ancestor=chromadb/chroma) 2>/dev/null || true');
    
    // Start new container
    await execAsync('docker run -d -p 8000:8000 --name chromadb chromadb/chroma');
    console.log('   ✅ ChromaDB started via docker run');
  } catch (error) {
    console.error('   ❌ Failed to start ChromaDB:', error);
    throw error;
  }
}

async function waitForChromaDB(): Promise<void> {
  console.log('⏳ Waiting for ChromaDB to be ready...');
  
  for (let i = 0; i < 30; i++) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/heartbeat');
      if (response.ok) {
        console.log('   ✅ ChromaDB is ready!');
        return;
      }
    } catch {
      // Still starting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  
  throw new Error('ChromaDB failed to start within 30 seconds');
}

async function startServices(): Promise<void> {
  try {
    await startChromaDB();
    await waitForChromaDB();
    
    console.log('\n🎉 All services started successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run ingest:enhanced (if first time)');
    console.log('   2. Run: npm run dev');
    console.log('   3. Check: npm run health');
    
  } catch (error) {
    console.error('\n❌ Failed to start services:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  startServices().catch(console.error);
}

export { startServices };