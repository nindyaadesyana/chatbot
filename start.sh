#!/bin/bash

echo "🚀 Starting TVKU Chatbot..."

# Kill any process on port 8000
echo "🧹 Cleaning port 8000..."
lsof -ti:8000 | xargs -r kill -9 2>/dev/null || true

# Start ChromaDB
echo "🐳 Starting ChromaDB..."
docker stop $(docker ps -q --filter ancestor=chromadb/chroma) 2>/dev/null || true
docker rm $(docker ps -aq --filter ancestor=chromadb/chroma) 2>/dev/null || true
docker run -d -p 8000:8000 chromadb/chroma

# Wait for ChromaDB
echo "⏳ Waiting for ChromaDB..."
sleep 10

# Start Next.js
echo "🌐 Starting Next.js..."
npm run dev:only