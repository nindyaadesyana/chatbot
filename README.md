# TVKU AI Chatbot with RAG System

Intelligent chatbot untuk TVKU (Televisi Kampus Universitas Dian Nuswantoro) dengan teknologi Retrieval-Augmented Generation (RAG) dan Text-to-Speech.

## 🚀 Fitur Utama

### 🤖 AI Chatbot
- **Dira** - Asisten AI perempuan dengan logat Indonesia natural
- Gaya bicara santai tapi sopan dengan kata-kata khas Indonesia
- Voice chat dengan speech recognition dan TTS
- Real-time data integration dari API TVKU

### 📚 RAG System
- **Enhanced RAG** dengan ChromaDB vector database
- **LangChain** integration untuk document processing
- **Ollama** local LLM (llama3 + nomic-embed-text)
- PDF upload dan OCR processing
- Real-time API data integration

### 🎯 Fitur Khusus
- **Ratecard TVKU** - Tabel tarif iklan lengkap
- **Berita terbaru** - Integrasi dengan API berita TVKU
- **Program & Jadwal** - Data real-time acara TVKU
- **Upload PDF** - Dengan progress bar dan auto-processing
- **Voice Chat** - Speech-to-text dan text-to-speech

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Web Speech API** - Voice recognition & TTS

### Backend & AI
- **Ollama** - Local LLM server
- **LangChain** - AI framework
- **ChromaDB** - Vector database
- **Tesseract.js** - OCR processing
- **React Markdown** - Markdown rendering

### APIs
- **TVKU API** - Real-time data
  - `/api/berita` - News
  - `/api/program` - TV Programs  
  - `/api/jadwal` - Schedule

## 📋 Prerequisites

### Required Services
```bash
# 1. Ollama (Local LLM)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3
ollama pull nomic-embed-text

# 2. ChromaDB (Vector Database)
docker run -d -p 8000:8000 chromadb/chroma
```

### Node.js Dependencies
```bash
npm install
```

## 🚀 Quick Start Guide

### Prerequisites
Pastikan sudah terinstall:
- **Node.js** 18+
- **Docker** 
- **Ollama**

### Setup Pertama Kali

#### 1. Install Ollama & Models
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama3
ollama pull nomic-embed-text
```

#### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd chatbot
npm install
```

#### 3. Start Services (Buka 4 Terminal)

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - ChromaDB:**
```bash
docker run -d -p 8000:8000 chromadb/chroma
```

**Terminal 3 - Ingest Data (WAJIB untuk chatbot berfungsi):**
```bash
npm run ingest:enhanced
```

**Terminal 4 - Start App:**
```bash
npm run dev
```

#### 4. Verifikasi Setup
- ✅ **Ollama**: `ollama list` (harus ada llama3 & nomic-embed-text)
- ✅ **ChromaDB**: http://localhost:8000
- ✅ **App**: http://localhost:3000
- ✅ **Chat**: Klik tombol chat di pojok kanan bawah

### Menjalankan Setelah Setup Pertama

Setiap kali mau pakai aplikasi, jalankan 3 service ini:

```bash
# Terminal 1
ollama serve

# Terminal 2 (atau gunakan container yang sudah ada)
docker start <chromadb_container_id>
# atau buat baru:
docker run -d -p 8000:8000 chromadb/chroma

# Terminal 3
npm run dev
```

**Catatan**: Ingest hanya perlu dijalankan sekali, kecuali ada update data.

### Akses Aplikasi
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (upload PDF)
- **Chat**: Klik floating chat button di website

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/
│   │   └── page.tsx        # Admin panel untuk upload PDF
│   ├── api/
│   │   ├── ollama/
│   │   │   └── route.ts    # Main chat API endpoint
│   │   └── upload/
│   │       └── route.ts    # PDF upload & processing API
│   ├── digitalMarketing/   # Marketing page
│   ├── news/              # News page
│   ├── programPage/       # TV Program page
│   ├── sales/             # Sales page
│   ├── seputar_udinus/    # UDINUS info pages (1-10)
│   ├── seputarUdinus/     # UDINUS overview
│   ├── seputarUdinusMore/ # More UDINUS info
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React Components
│   ├── seputarUdinus/
│   │   ├── CampusCard.tsx # Campus info card
│   │   ├── pagination.tsx # Pagination component
│   │   └── ProgramCard.tsx# Program info card
│   ├── ui/                # Shadcn UI components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── pagination.tsx
│   │   └── tabs.tsx
│   ├── about.tsx          # About section
│   ├── carousel.tsx       # Image carousel
│   ├── carouselCompanyLogo.tsx # Company logos
│   ├── chatButton.tsx     # Main chat interface dengan TTS
│   ├── clientHomePage.tsx # Client-side homepage wrapper
│   ├── featuredNews.tsx   # Featured news section
│   ├── footer.tsx         # Website footer
│   ├── homePage.tsx       # Homepage content
│   ├── iklanBenefit.tsx   # Advertisement benefits
│   ├── iklanHarga.tsx     # Advertisement pricing
│   ├── iklanHero.tsx      # Advertisement hero section
│   ├── iklanKerjasama.tsx # Partnership ads
│   ├── iklanPosisi.tsx    # Ad positioning
│   ├── multiTabContent.tsx# Multi-tab content
│   ├── navbar.tsx         # Navigation bar
│   ├── newsCard.tsx       # News card component
│   ├── newsHeader.tsx     # News header
│   ├── newsList.tsx       # News list
│   ├── newsPage.tsx       # News page layout
│   ├── ourExpertise.tsx   # Expertise section
│   ├── program.tsx        # TV program component
│   ├── salesHome.tsx      # Sales homepage
│   ├── schedule.tsx       # TV schedule
│   ├── seputarUdinus.tsx  # UDINUS info component
│   ├── simpleUpload.tsx   # PDF upload interface
│   ├── TVProgramPage.tsx  # TV program page
│   ├── voiceChatButton.tsx# Voice chat button
│   └── voiceChatOverlay.tsx# Voice chat overlay
├── lib/                   # Core Libraries
│   ├── chatbot/           # 🤖 AI Chatbot System
│   │   ├── config/
│   │   │   ├── api.ts     # API configuration
│   │   │   └── prompts.ts # AI prompts templates
│   │   ├── services/      # 🔧 Core Services
│   │   │   ├── dataService.ts      # Data fetching utilities
│   │   │   ├── enhancedRagService.ts # 🚀 Primary RAG dengan API
│   │   │   ├── langchainService.ts  # 🔄 Backup RAG system
│   │   │   ├── ollamaService.ts     # Ollama LLM interface
│   │   │   ├── pdfService.ts        # PDF processing
│   │   │   └── tvkuService.ts       # TVKU API integration
│   │   ├── types/
│   │   │   └── index.ts   # TypeScript type definitions
│   │   ├── utils/
│   │   │   ├── promptBuilder.ts # Dynamic prompt construction
│   │   │   └── responseHandler.ts # Greeting/thanks detection
│   │   ├── index.ts       # 🎯 Main ChatbotService orchestrator
│   │   └── README.md      # Chatbot documentation
│   ├── voice/
│   │   └── speechService.ts # 🎤 Voice recognition service
│   └── utils.ts           # General utilities
├── data/                  # 📄 Static Data Files
│   └── *.json            # RAG training data
└── public/
    ├── uploads/           # 📁 Uploaded PDF files
    ├── images/            # 🖼️ Static images
    └── sounds/            # 🔊 Audio files for TTS
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://apidev.tvku.tv/api
```

### Ollama Models
```bash
# Required models
ollama pull llama3           # Chat model
ollama pull nomic-embed-text # Embedding model
```

### ChromaDB Collection
- **Collection Name**: `tvku_docs`
- **Port**: 8000
- **URL**: http://localhost:8000

## 📖 Usage Guide

### Chat Interface
1. **Text Chat**: Ketik pertanyaan di input box
2. **Voice Chat**: Klik tombol mic untuk voice input
3. **TTS**: Jawaban otomatis dibacakan dengan suara perempuan Indonesia

### Admin Panel
1. Akses `/admin` untuk upload PDF
2. Drag & drop atau pilih file PDF
3. Progress bar menunjukkan status upload
4. File otomatis diproses ke RAG system

### Supported Queries
- **Berita**: "berita hari ini", "news terbaru"
- **Program**: "program tvku", "acara apa saja"
- **Jadwal**: "jadwal tvku", "schedule"
- **Ratecard**: "ratecard tvku", "tarif iklan"
- **General**: Pertanyaan umum tentang TVKU

## 🏧 Arsitektur Chatbot

### Entry Point Flow:
```
User Input → ChatbotService.processMessage() → ResponseHandler → EnhancedRAGService
```

### Dual RAG System:
- **Primary**: `enhancedRagService.ts` - Real-time API + Vector DB
- **Backup**: `langchainService.ts` - Pure vector search

### Service Layer:
- **dataService.ts** - Utility functions untuk data fetching
- **tvkuService.ts** - Integration dengan TVKU API endpoints
- **ollamaService.ts** - Interface ke Ollama LLM server
- **pdfService.ts** - PDF upload, OCR, dan text extraction

### Utils & Config:
- **responseHandler.ts** - Deteksi greeting, thanks, dan response templates
- **promptBuilder.ts** - Dynamic prompt construction berdasarkan context
- **speechService.ts** - Voice recognition dan TTS integration

## 🔄 RAG Workflow

### 1. Document Ingestion Pipeline
```
PDF Upload (simpleUpload.tsx) → 
OCR Processing (pdfService.ts) → 
Text Splitting → 
Embeddings (nomic-embed-text) → 
ChromaDB Storage
```

### 2. Query Processing Flow
```
User Input (chatButton.tsx) → 
ChatbotService.processMessage() → 
ResponseHandler.check() → 
EnhancedRAGService.processQuery() → 
API Data Check (tvkuService.ts) → 
Vector Search (ChromaDB) → 
LLM Processing (Ollama) → 
TTS Response
```

### 3. Real-time Integration
```
Query Analysis → 
TVKU API Call (berita/program/jadwal) → 
Data Merge dengan Vector Results → 
Enhanced Contextual Response → 
Indonesian Female TTS Output
```

### 4. Fallback Mechanism
```
EnhancedRAG Fails → 
LangChain RAG Backup → 
Static Response Templates → 
Error Handling
```

## 🎛️ API Endpoints

### Internal APIs
- `POST /api/ollama` - Chat processing
- `POST /api/upload` - PDF upload & processing

### External APIs (TVKU)
- `GET /api/berita` - Latest news
- `GET /api/program` - TV programs
- `GET /api/jadwal` - Schedule

## 🔊 Voice Features

### Speech Recognition
- **Language**: Indonesian (id-ID)
- **Browser Support**: Chrome, Edge, Firefox
- **Activation**: Mic button atau voice command

### Text-to-Speech
- **Voice**: Indonesian female voice
- **Rate**: 1.2x (natural speed)
- **Pitch**: 1.3 (feminine tone)
- **Auto-play**: Semua response dibacakan

## 📊 Performance

### Response Time
- **Simple Query**: ~1-2 seconds
- **RAG Query**: ~3-5 seconds
- **API Integration**: ~2-4 seconds

### Accuracy
- **Document Retrieval**: Vector similarity search
- **Context Relevance**: Top-4 most relevant chunks
- **Real-time Data**: Direct API integration

## 🛠️ Development

### Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run ingest:enhanced  # Ingest RAG data
```

### Adding New Features
1. **New API Integration**: Update `langchainService.ts`
2. **New UI Components**: Add to `components/`
3. **New RAG Data**: Place in `data/` and run ingest

### Debugging
```bash
# Check Ollama status
ollama list

# Check ChromaDB
curl http://localhost:8000/api/v1/collections

# Check logs
npm run dev # See console logs
```

## 🚨 Troubleshooting

### Common Issues

**Ollama not responding**
```bash
# Cek models terinstall
ollama list

# Install ulang jika perlu
ollama pull llama3
ollama pull nomic-embed-text

# Restart service
ollama serve
```

**ChromaDB connection failed**
```bash
# Stop container lama
docker stop $(docker ps -q --filter ancestor=chromadb/chroma)

# Start baru
docker run -d -p 8000:8000 chromadb/chroma

# Cek status
docker ps
```

**Chatbot tidak bisa jawab pertanyaan TVKU**
```bash
# Pastikan ingest sudah dijalankan
npm run ingest:enhanced

# Cek ChromaDB jalan
curl http://localhost:8000/api/v1/collections
```

**Ingest gagal**
```bash
# Pastikan Ollama & ChromaDB jalan dulu
ollama serve
docker run -d -p 8000:8000 chromadb/chroma

# Baru jalankan ingest
npm run ingest:enhanced
```

**Voice not working**
- Pastikan browser support Web Speech API (Chrome/Edge recommended)
- Berikan permission microphone
- Gunakan HTTPS untuk production

**PDF upload failed**
- Check file size (max recommended: 10MB)
- Ensure `public/uploads/` directory exists
- Check OCR processing logs

### Cek Status Services
```bash
# Cek Ollama
ollama list
curl http://localhost:11434/api/tags

# Cek ChromaDB
curl http://localhost:8000/api/v1/collections

# Cek Docker containers
docker ps
```

## 📝 License

MIT License - Free for educational and commercial use.

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

Untuk pertanyaan teknis atau bug report, silakan buat issue di repository ini.

---

**TVKU AI Chatbot** - Powered by Next.js, Ollama, and LangChain