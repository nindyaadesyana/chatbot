# RAG Integration untuk TVKU Chatbot

## Overview
Sistem RAG (Retrieval-Augmented Generation) yang terintegrasi menggabungkan:
- **Dokumen Statis**: PDF Company Profile, JSON data
- **Data Dinamis**: Berita, jadwal, program TV terbaru
- **Vector Search**: ChromaDB untuk pencarian semantik

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start ChromaDB
```bash
docker run -p 8000:8000 chromadb/chroma
```

### 3. Start Ollama
```bash
ollama serve
ollama pull llama3
ollama pull nomic-embed-text
```

### 4. Ingest Data
```bash
# Basic ingestion (static only)
npm run ingest

# Enhanced ingestion (static + dynamic)
npm run ingest:enhanced
```

### 5. Start Development Server
```bash
npm run dev
```

## API Endpoints

### Main Chatbot
```
POST /api/ollama
{
  "prompt": "Apa itu TVKU?"
}
```

### Direct RAG
```
POST /api/rag
{
  "query": "Jadwal acara hari ini",
  "action": "search"
}
```

## Architecture

```
User Query → Enhanced RAG Service → {
  ├── Vector Store (ChromaDB)
  ├── Dynamic Data (News/Schedule/Programs)
  └── LLM (Ollama Llama3)
} → Response
```

## Features

✅ **Unified Query Processing**: Satu endpoint untuk semua jenis pertanyaan
✅ **Smart Context Mixing**: Kombinasi data statis dan dinamis
✅ **Real-time Data**: Berita dan jadwal terbaru
✅ **Semantic Search**: Pencarian berdasarkan makna, bukan kata kunci
✅ **Fallback Handling**: Graceful degradation jika service tidak tersedia

## Data Sources

1. **Company_Profile_TVKU_2025_web.pdf** - Informasi umum TVKU
2. **tentangTVKU.json** - Data terstruktur tentang TVKU
3. **Dynamic News** - Berita terbaru dari API
4. **TV Programs** - Daftar program TV
5. **Schedule Data** - Jadwal acara real-time

## Usage Examples

```typescript
// Pertanyaan umum (menggunakan PDF/JSON)
"Apa visi misi TVKU?"

// Pertanyaan dinamis (menggunakan API + RAG)
"Berita apa yang terbaru hari ini?"
"Jadwal acara malam ini apa saja?"

// Pertanyaan campuran
"Bagaimana cara memasang iklan di program berita?"
```