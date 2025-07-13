# TVKU Chatbot Backend

Modular chatbot backend untuk TVKU yang mudah di-maintain dan dikembangkan.

## Struktur Folder

```
src/lib/chatbot/
├── config/          # Konfigurasi dan konstanta
│   ├── api.ts       # API endpoints dan config
│   └── prompts.ts   # System prompts dan responses
├── services/        # Business logic layer
│   ├── dataService.ts    # API data fetching
│   ├── tvkuService.ts    # TVKU specific data
│   └── ollamaService.ts  # AI model integration
├── utils/           # Utility functions
│   ├── promptBuilder.ts     # Dynamic prompt construction
│   └── responseHandler.ts  # Response processing
├── types/           # TypeScript interfaces
│   └── index.ts     # Data type definitions
└── index.ts         # Main chatbot service
```

## Cara Menggunakan

### Basic Usage
```typescript
import { ChatbotService } from '@/lib/chatbot';

const response = await ChatbotService.processMessage("Halo, apa kabar?");
```

### Advanced Usage
```typescript
import { 
  DataService, 
  PromptBuilder, 
  ResponseHandler 
} from '@/lib/chatbot';

// Custom data fetching
const berita = await DataService.getBerita();

// Custom prompt building
const builder = new PromptBuilder("berita terbaru");
const prompt = await builder.build();

// Custom response handling
if (ResponseHandler.isGreeting("halo")) {
  const greeting = ResponseHandler.getGreetingResponse();
}
```

## Konfigurasi

### API Endpoints (`config/api.ts`)
```typescript
export const API_ENDPOINTS = {
  BERITA: 'https://apidev.tvku.tv/api/berita',
  // ... tambah endpoint baru di sini
};
```

### Prompts (`config/prompts.ts`)
```typescript
export const SYSTEM_PROMPT = `Anda adalah Dira...`;
export const GREETING_RESPONSE = `Halo, Sahabat TVKU!...`;
```

## Menambah Fitur Baru

### 1. Tambah Data Source Baru
```typescript
// di services/dataService.ts
static async getNewData(): Promise<string> {
  return this.fetchAndFormat<INewType>(
    API_ENDPOINTS.NEW_ENDPOINT,
    item => `• **${item.title}** - ${item.description}`,
    'New Data Label'
  );
}
```

### 2. Update Prompt Builder
```typescript
// di utils/promptBuilder.ts
if (this.prompt.includes("new keyword")) {
  fullPrompt += await DataService.getNewData();
}
```

### 3. Tambah Type Definition
```typescript
// di types/index.ts
export interface INewType {
  id: number;
  title: string;
  description: string;
}
```

## Testing

```bash
# Test individual services
import { DataService } from '@/lib/chatbot';
const result = await DataService.getBerita();

# Test full chatbot
import { ChatbotService } from '@/lib/chatbot';
const response = await ChatbotService.processMessage("test prompt");
```

## Best Practices

1. **Separation of Concerns**: Setiap service punya tanggung jawab spesifik
2. **Error Handling**: Semua service handle error dengan graceful fallback
3. **Type Safety**: Gunakan TypeScript interfaces untuk semua data
4. **Configuration**: Semua config terpusat di folder `config/`
5. **Modularity**: Import hanya yang dibutuhkan untuk performa optimal

## Troubleshooting

### Common Issues
- **API Error**: Cek `config/api.ts` untuk endpoint yang benar
- **Prompt Issues**: Edit `config/prompts.ts` untuk system prompt
- **Type Errors**: Update `types/index.ts` sesuai API response

### Debug Mode
Set `NODE_ENV=development` untuk melihat full prompt di console.

---

## 👥 Contributors

**Developed by**: [akbarlion](https://github.com/akbarlion) as collaborator

## 📞 Support

Untuk pertanyaan teknis atau bug reports, hubungi development team atau buat issue di repository.

**Last Updated**: January 2025
**Version**: 1.0.0
**Collaborator**: [@akbarlion](https://github.com/akbarlion)