#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DockerManager {
  static async cleanupChromaDB(): Promise<void> {
    console.log('🧹 Cleaning up old ChromaDB containers...');
    
    try {
      // Stop all ChromaDB containers
      await execAsync('docker stop $(docker ps -q --filter ancestor=chromadb/chroma) 2>/dev/null || true');
      
      // Remove all ChromaDB containers
      await execAsync('docker rm $(docker ps -aq --filter ancestor=chromadb/chroma) 2>/dev/null || true');
      
      // Remove by name pattern
      await execAsync('docker rm -f tvku-chromadb chromadb chromadb-new 2>/dev/null || true');
      
      console.log('   ✅ Cleanup completed');
    } catch (error) {
      console.log('   ⚠️  Cleanup had some issues, continuing...');
    }
  }
  
  static async startChromaDB(): Promise<void> {
    console.log('🚀 Starting ChromaDB with docker-compose...');
    
    try {
      // Use docker-compose for better management
      await execAsync('docker-compose up -d chromadb');
      console.log('   ✅ ChromaDB started via docker-compose');
    } catch (error) {
      console.log('   ⚠️  docker-compose failed, trying manual start...');
      
      // Fallback to manual docker run
      await execAsync(`
        docker run -d \\
          --name tvku-chromadb \\
          --restart unless-stopped \\
          -p 8000:8000 \\
          -v chromadb_data:/chroma/chroma \\
          -e CHROMA_SERVER_HOST=0.0.0.0 \\
          -e CHROMA_SERVER_HTTP_PORT=8000 \\
          chromadb/chroma:latest
      `);
      console.log('   ✅ ChromaDB started manually');
    }
  }
  
  static async waitForChromaDB(maxWaitTime: number = 60): Promise<boolean> {
    console.log('⏳ Waiting for ChromaDB to be ready...');
    
    for (let i = 0; i < maxWaitTime; i++) {
      try {
        const response = await fetch('http://localhost:8000/', {
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.status === 200) {
          console.log(`   ✅ ChromaDB ready after ${i + 1}s`);
          return true;
        }
      } catch {
        // Still starting
      }
      
      if (i % 10 === 0 && i > 0) {
        console.log(`   ⏳ Still waiting... (${i}s)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`   ❌ ChromaDB not ready after ${maxWaitTime}s`);
    return false;
  }
  
  static async getStatus(): Promise<{
    running: boolean;
    containerName?: string;
    uptime?: string;
  }> {
    try {
      const { stdout } = await execAsync('docker ps --filter ancestor=chromadb/chroma --format "{{.Names}} {{.Status}}"');
      
      if (stdout.trim()) {
        const [name, ...statusParts] = stdout.trim().split(' ');
        return {
          running: true,
          containerName: name,
          uptime: statusParts.join(' ')
        };
      }
      
      return { running: false };
    } catch {
      return { running: false };
    }
  }
  
  static async restart(): Promise<void> {
    console.log('🔄 Restarting ChromaDB...');
    
    await this.cleanupChromaDB();
    await this.startChromaDB();
    
    const isReady = await this.waitForChromaDB();
    if (!isReady) {
      throw new Error('ChromaDB failed to start after restart');
    }
    
    console.log('✅ ChromaDB restarted successfully');
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      DockerManager.cleanupChromaDB()
        .then(() => DockerManager.startChromaDB())
        .then(() => DockerManager.waitForChromaDB())
        .catch(console.error);
      break;
      
    case 'restart':
      DockerManager.restart().catch(console.error);
      break;
      
    case 'status':
      DockerManager.getStatus()
        .then(status => {
          if (status.running) {
            console.log(`✅ ChromaDB running: ${status.containerName} (${status.uptime})`);
          } else {
            console.log('❌ ChromaDB not running');
          }
        })
        .catch(console.error);
      break;
      
    case 'cleanup':
      DockerManager.cleanupChromaDB().catch(console.error);
      break;
      
    default:
      console.log('Usage: npx tsx scripts/dockerManager.ts [start|restart|status|cleanup]');
  }
}