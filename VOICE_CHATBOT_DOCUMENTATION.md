# TVKU Voice Chatbot Documentation

Dokumentasi lengkap untuk sistem chatbot dengan fitur Speech-to-Text (STT) dan Text-to-Speech (TTS).

## 📋 Overview

TVKU Voice Chatbot adalah sistem AI assistant yang dapat:
- **Mendengar** pertanyaan user (STT)
- **Memproses** dengan AI backend
- **Menjawab** dengan suara (TTS)
- **Menampilkan** response visual

## 🏗️ Arsitektur Sistem

```
User Voice Input → STT → Chatbot API → AI Processing → Response → TTS → User Audio Output
                    ↓                                      ↓
                Text Display                        Visual Response
```

## 📁 Struktur File

### Backend Chatbot
```
src/lib/chatbot/
├── config/
│   ├── api.ts              # API endpoints
│   └── prompts.ts          # System prompts & responses
├── services/
│   ├── dataService.ts      # Data fetching
│   ├── tvkuService.ts      # TVKU specific data
│   └── ollamaService.ts    # AI model integration
├── utils/
│   ├── promptBuilder.ts    # Dynamic prompt construction
│   └── responseHandler.ts  # Response formatting & TTS prep
├── types/
│   └── index.ts           # TypeScript interfaces
└── index.ts               # Main chatbot service
```

### Voice Components
```
src/lib/voice/
└── speechService.ts       # STT & TTS functionality

src/components/
├── chatButton.tsx         # Main chat interface (ACTIVE)
├── voiceChatButton.tsx    # Alternative voice interface
└── voiceChatOverlay.tsx   # Voice chat modal
```

### API Routes
```
src/app/api/
└── ollama/
    └── route.ts           # Main chatbot API endpoint
```

## 🎤 Speech-to-Text (STT)

### Implementasi
- **Technology**: Web Speech API
- **Language**: Indonesian (id-ID)
- **Mode**: Continuous listening
- **File**: `src/components/chatButton.tsx`

### Konfigurasi STT
```typescript
const recognition = new SpeechRecognition()
recognition.continuous = false
recognition.interimResults = false
recognition.lang = "id-ID"
```

### Flow STT
1. User klik tombol mic
2. Browser request microphone permission
3. STT mulai listening
4. User berbicara
5. STT convert ke text
6. Text dikirim ke chatbot API

### Error Handling
- `no-speech`: Tidak mendeteksi suara
- `audio-capture`: Tidak bisa akses mikrofon
- `not-allowed`: Permission ditolak

## 🔊 Text-to-Speech (TTS)

### Implementasi
- **Technology**: Web Speech Synthesis API
- **Language**: Indonesian (id-ID)
- **Voice Priority**: Google Bahasa Indonesia
- **File**: `src/components/chatButton.tsx`

### Konfigurasi TTS
```typescript
const utterance = new SpeechSynthesisUtterance(text)
utterance.rate = 1.3        // Speed (faster)
utterance.pitch = 1.1       // Higher pitch (younger sound)
utterance.lang = 'id-ID'    // Indonesian
```

### Voice Selection Priority
1. **Google Bahasa Indonesia** (preferred)
2. **Microsoft Andika Indonesian**
3. **Any Indonesian voice** (fallback)

### TTS Optimizations
- **Pronunciation fixes**: "TVKU" → "Tiviku"
- **Shortened responses**: News summary instead of full text
- **Clean formatting**: Remove markdown, HTML tags
- **Speed optimization**: 1.3x normal speed

## 🤖 Chatbot Backend

### Main Service
**File**: `src/lib/chatbot/index.ts`
```typescript
export class ChatbotService {
  static async processMessage(prompt: string): Promise<string>
}
```

### Response Types
1. **Greeting**: "Halo", "Hi" → Welcome message
2. **Thank You**: "Terima kasih" → Appreciation response
3. **News Query**: "Berita" → Latest news data
4. **General**: Other queries → AI processing

### Data Sources
- **News**: `https://apidev.tvku.tv/api/berita`
- **Events**: `https://apidev.tvku.tv/api/acara`
- **Schedule**: `https://apidev.tvku.tv/api/jadwal-acara`
- **Programs**: `https://apidev.tvku.tv/api/our-programs`

## 🔧 API Endpoint

### POST `/api/ollama`

**Request**:
```json
{
  "prompt": "Ada berita apa hari ini?"
}
```

**Response**:
```json
{
  "response": "Formatted response for display",
  "speech": "Cleaned response for TTS"
}
```

### Response Formatting
- **Display**: Full response with markdown
- **Speech**: Cleaned version for TTS
  - Remove HTML tags
  - Remove markdown formatting
  - Fix pronunciations
  - Shorten news responses

## 🎯 Usage Guide

### 🚀 Quick Start

#### Method 1: Text + Voice Chat (Recommended)
1. **Buka website** TVKU
2. **Klik tombol chat** (💬) di pojok kanan bawah
3. **Chat modal terbuka** dengan Dira
4. **Pilih input method**:
   - **Ketik**: Tulis pertanyaan di text box
   - **Voice**: Klik tombol mic (🎤) dan bicara

#### Method 2: Voice-Only Chat (Alternative)
1. **Klik tombol voice** (🎤) di pojok kanan bawah
2. **Voice overlay muncul**
3. **Bicara langsung** - sistem auto-listening
4. **Dengar response** Dira

### 📝 Cara Menggunakan Voice Features

#### Speech-to-Text (STT)
```
1. Klik tombol mic 🎤
2. Browser minta permission microphone → ALLOW
3. Tombol berubah merah + animasi pulse
4. Bicara dengan jelas: "Ada berita apa hari ini?"
5. Sistem convert voice → text
6. Text muncul di chat
```

#### Text-to-Speech (TTS)
```
1. Dira memproses pertanyaan
2. Response muncul di chat (text)
3. Dira otomatis bacakan response (audio)
4. Dengar jawaban sambil baca text
```

### 🗣️ Contoh Pertanyaan

#### Berita & Informasi
- "Ada berita apa hari ini?"
- "Berita terbaru TVKU"
- "Kabar terkini"

#### Jadwal & Acara
- "Jadwal acara hari ini"
- "Program apa saja di TVKU?"
- "Acara minggu ini"

#### Informasi TVKU
- "Tentang TVKU"
- "Rate card iklan"
- "Media sosial TVKU"

#### Sapaan & Terima Kasih
- "Halo Dira"
- "Selamat pagi"
- "Terima kasih"
- "Makasih ya"

### ⚡ Tips Penggunaan

#### Untuk STT (Voice Input)
- **Bicara jelas** dan tidak terlalu cepat
- **Kurangi noise** background
- **Gunakan headset** untuk hasil terbaik
- **Izinkan microphone** di browser

#### Untuk TTS (Voice Output)
- **Pastikan speaker/headphone** nyala
- **Atur volume** yang nyaman
- **Tunggu Dira selesai** bicara sebelum bertanya lagi

### 🎛️ Kontrol Voice

#### Tombol & Status
- **🎤 Biru**: Ready untuk voice input
- **🎤 Merah + Pulse**: Sedang listening
- **❌**: Stop voice mode

#### Keyboard Shortcuts
- **Enter**: Send text message
- **Esc**: Close chat modal

### 🔄 User Experience Flow

#### Normal Chat Flow
```
User → Click Chat → Modal Open → Type/Voice → STT → API → AI → Response → TTS → Audio + Visual
```

#### Voice-Only Flow
```
User → Click Voice → Overlay → Continuous Listen → Auto Process → Response → Audio + Visual
```

### 🎯 Expected Behavior

#### Successful Voice Interaction
1. **User says**: "Ada berita apa hari ini?"
2. **STT converts**: Text appears in chat
3. **API processes**: "Sedang memproses..." message
4. **Dira responds**: News summary text appears
5. **TTS speaks**: "Berikut 5 berita terkini Tiviku..."
6. **User hears**: Shortened audio version

#### Error Scenarios
- **No microphone**: "Tidak bisa mengakses mikrofon"
- **No speech detected**: "Tidak mendeteksi suara"
- **API timeout**: Fallback response provided
- **No audio output**: Check speaker/volume settings

## ⚙️ Konfigurasi

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://apidev.tvku.tv
```

### Browser Requirements
- **STT**: Chrome, Edge, Safari (with permission)
- **TTS**: All modern browsers
- **Microphone**: Required for voice input
- **Speakers**: Required for audio output

## 🐛 Troubleshooting

### STT Issues
- **No voice detected**: Check microphone permission
- **Poor recognition**: Speak clearly, reduce background noise
- **Language issues**: Ensure Indonesian language setting

### TTS Issues
- **No audio**: Check speaker volume, browser audio settings
- **Robot voice**: Limited by browser's available voices
- **Slow speech**: Adjust rate parameter (currently 1.3)

### API Issues
- **Timeout**: Ollama API has 30s timeout with fallback
- **No response**: Check network connection and API endpoints
- **Error messages**: Check console for detailed error logs

## 🔄 Development Usage Guide

### 🛠️ Setup Development Environment

#### Prerequisites
```bash
# Required
Node.js >= 18
npm or yarn or pnpm
Next.js 14+
TypeScript

# Optional
VSCode with extensions:
- TypeScript Hero
- ES7+ React/Redux/React-Native snippets
```

#### Installation
```bash
# Clone repository
git clone <repository-url>
cd chatbot

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API URLs

# Run development server
npm run dev
```

### 📁 Project Structure Understanding

#### Core Components
```typescript
// Main chatbot service
import { ChatbotService } from '@/lib/chatbot'

// Voice functionality
import { SpeechService } from '@/lib/voice/speechService'

// UI components
import ChatButton from '@/components/chatButton' // ACTIVE
import VoiceChatButton from '@/components/voiceChatButton' // ALTERNATIVE
```

#### Key Files to Know
- **`src/components/chatButton.tsx`**: Main chat interface (currently used)
- **`src/lib/chatbot/index.ts`**: Core chatbot logic
- **`src/app/api/ollama/route.ts`**: API endpoint
- **`src/lib/voice/speechService.ts`**: STT/TTS functionality

### 🚀 Adding New Features

#### 1. Adding New Response Types
```typescript
// Step 1: Add keywords to config
// File: src/lib/chatbot/config/prompts.ts
export const NEW_KEYWORDS = ['keyword1', 'keyword2'];
export const NEW_RESPONSE = 'Your response here';

// Step 2: Add detection logic
// File: src/lib/chatbot/utils/responseHandler.ts
static isNewType(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase().trim();
  return NEW_KEYWORDS.some(word => 
    lowerPrompt.includes(word)
  );
}

// Step 3: Add to main service
// File: src/lib/chatbot/index.ts
if (ResponseHandler.isNewType(prompt)) {
  return ResponseHandler.getNewResponse();
}
```

#### 2. Adding New Data Sources
```typescript
// Step 1: Add API endpoint
// File: src/lib/chatbot/config/api.ts
export const API_ENDPOINTS = {
  // existing endpoints...
  NEW_DATA: 'https://api.example.com/new-data'
};

// Step 2: Add data service
// File: src/lib/chatbot/services/dataService.ts
static async getNewData(): Promise<string> {
  return this.fetchAndFormat<INewType>(
    API_ENDPOINTS.NEW_DATA,
    item => `• **${item.title}** - ${item.description}`,
    'New Data Label'
  );
}

// Step 3: Add to prompt builder
// File: src/lib/chatbot/utils/promptBuilder.ts
if (this.prompt.includes("new data")) {
  fullPrompt += await DataService.getNewData();
}
```

#### 3. Customizing TTS Behavior
```typescript
// File: src/lib/chatbot/utils/responseHandler.ts
static formatForTTS(response: string): string {
  // Add custom formatting rules
  if (response.includes('Special Case')) {
    return 'Custom TTS response for special case';
  }
  
  return response
    .replace(/CUSTOM_WORD/g, 'Pronunciation Fix')
    .replace(/\*\*/g, '') // Remove markdown
    .trim();
}
```

### 🧪 Testing & Debugging

#### Manual Testing
```javascript
// Console testing commands

// 1. Test TTS with different voices
const testTTS = (text, voiceName) => {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = speechSynthesis.getVoices().find(v => v.name.includes(voiceName));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
};

testTTS('Halo Tiviku', 'Google');

// 2. Test API endpoint
fetch('/api/ollama', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'test prompt' })
}).then(r => r.json()).then(console.log);

// 3. Check available voices
speechSynthesis.getVoices().forEach(voice => 
  console.log(voice.name, voice.lang)
);
```

#### Debug Logging
```typescript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Add to components for voice debugging
console.log('STT Result:', transcript);
console.log('TTS Input:', speechText);
console.log('API Response:', response);
```

### 🔧 Configuration Management

#### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://apidev.tvku.tv
OLLAMA_API_URL=
DEBUG_MODE=true
```

#### Runtime Configuration
```typescript
// File: src/lib/chatbot/config/runtime.ts
export const CONFIG = {
  TTS_RATE: process.env.NODE_ENV === 'development' ? 1.5 : 1.3,
  STT_LANGUAGE: 'id-ID',
  API_TIMEOUT: 30000,
  DEBUG_ENABLED: process.env.DEBUG_MODE === 'true'
};
```

### 🐛 Common Development Issues

#### STT Not Working
```typescript
// Debug checklist
1. Check browser support: 'webkitSpeechRecognition' in window
2. Verify HTTPS (required for microphone)
3. Check microphone permissions
4. Test with different browsers
5. Verify language setting (id-ID)
```

#### TTS Not Working
```typescript
// Debug steps
1. Test basic: speechSynthesis.speak(new SpeechSynthesisUtterance('test'))
2. Check available voices: speechSynthesis.getVoices()
3. Verify audio output device
4. Check browser audio settings
5. Test with different text lengths
```

### 🚀 Development Workflow

#### Feature Development Process
```bash
# 1. Create feature branch
git checkout -b feature/new-voice-command

# 2. Develop & test locally
npm run dev
# Test in browser with voice features

# 3. Run tests
npm run test
npm run type-check

# 4. Build & verify
npm run build
npm run start

# 5. Commit & push
git add .
git commit -m "feat: add new voice command"
git push origin feature/new-voice-command
```

### Adding New Features
1. **Backend**: Add to `src/lib/chatbot/`
2. **API**: Update `src/app/api/ollama/route.ts`
3. **Frontend**: Modify `src/components/chatButton.tsx`
4. **Voice**: Update `src/lib/voice/speechService.ts`

### Testing Voice Features
```javascript
// Test TTS
speechSynthesis.speak(new SpeechSynthesisUtterance('test suara'));

// Test STT
// Use browser's built-in voice input or component

// Check available voices
speechSynthesis.getVoices().forEach(voice => 
  console.log(voice.name, voice.lang)
);
```

## 📊 Performance Metrics

### Response Times
- **STT Processing**: ~1-2 seconds
- **API Call**: ~5-30 seconds (depends on AI model)
- **TTS Generation**: ~1 second
- **Total UX**: ~7-33 seconds

### Optimizations Applied
- **Fallback responses** for API timeouts
- **Shortened TTS** for long responses
- **Faster speech rate** (1.3x)
- **Voice prioritization** for better quality

## 🚀 Future Improvements

### Planned Features
- **Wake word detection** ("Hey Dira")
- **Voice interruption** (stop TTS when user speaks)
- **Multiple language support**
- **Custom voice training**
- **Offline mode** for basic responses

### Technical Enhancements
- **WebRTC** for better audio quality
- **Voice activity detection**
- **Noise cancellation**
- **Real-time streaming** responses

---

## 👥 Contributors

**Developed by**: [akbarlion](https://github.com/akbarlion) as collaborator

## 📞 Support

Untuk pertanyaan teknis atau bug reports, hubungi development team atau buat issue di repository.

**Last Updated**: January 2025
**Version**: 1.0.0
**Collaborator**: [@akbarlion](https://github.com/akbarlion)