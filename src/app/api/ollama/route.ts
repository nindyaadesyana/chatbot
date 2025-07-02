import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import fs from 'fs/promises';
import path from 'path';



interface IBerita {
  id: number
  judul: string
  deskripsi: string
  kategori: {
    nama: string
  }
}
interface IAcara {
  id: number
  acara: string
  deskription: string
}
interface IJadwalAcara {
  id: number
  acara: string
  jam_awal: number
  jam_akhir: number
  hari: {
    id: number
    hari: string
  }
}
interface IOurProgram {
  id: number
  judul: string
  deskripsi: string
}
interface IProgramAcara {
  id: number
  judul: string
  deskripsi: string
}
interface ISeputarDinus {
  id: number
  teks: string
  deskripsi: string
}

async function getTentangTVKU(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'tentangTVKU.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Format the data for better display in chat
    let formattedData = `### [Tentang TVKU]\n${data.kataPengantar}\n\n`
    formattedData += `### [Visi dan Misi]\n**Visi:** ${data.visi}\n**Misi:** ${data.misi}\n\n`

    if (data.rateCard && data.rateCard.length > 0) {
      formattedData += `### [Rate Card]\n`
      data.rateCard.forEach((item: any) => { //eslint-disable-line
        formattedData += `- ${item.acara}: ${item.durasi} (${item.harga})\n`
      })
      formattedData += '\n'
    }

  const SOCIAL_MEDIA_MAP: Record<string, string> = {
     tvku_ig: "https://www.instagram.com/tvku_smg",
     tvku_yt: "https://www.youtube.com/@TVKU_udinus",
     tvku_tt: "https://www.tiktok.com/@tvku_smg"
   };
  // Di dalam fungsi getTentangTVKU() di route.ts
  if (data.mediaSosial) {
    formattedData += `### [Media Sosial]\n`;
    for (const [platform, code] of Object.entries(data.mediaSosial)) {
      const url = SOCIAL_MEDIA_MAP[code as keyof typeof SOCIAL_MEDIA_MAP];
      formattedData += `- [${platform}: ${code}](${url})\n`; 
      // Output: "- [instagram: tvku_ig](https://www.instagram.com/tvku_smg)"
    }
  }

    return formattedData;
  } catch (error) {
    console.error('Gagal membaca tentangTVKU.json:', error);
    return '';
  }
}

// Fetch + Format Helper
async function fetchAndFormat<T>(
  url: string,
  mapFn: (item: T) => string,
  label: string
): Promise<string> {
  try {
    const res = await axios.get(url)
    const data = res.data.data
    if (data && data.length > 0) {
      const formatted = data.map(mapFn).join('\n')
      return `\n\n### [${label}]\n${formatted}`
    }
  } catch (err) {
    console.error(`Gagal mengambil ${label}:`, err)
  }
  return ''
}

// POST handler
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt tidak valid' }, { status: 400 })
    }
    // const filePath = path.join(process.cwd(), 'public','tentangTVKU.json');
    // const tentangTVKU = await fs.readFile(filePath, 'utf-8');
    const lowerPrompt = prompt.toLowerCase()

    const systemPrompt = `Anda adalah Dira, Aturan:
1. Fokus pada topik berita dan informasi umum
2. Jangan bahas topik sensitif
3. Jawab dalam bahasa yang sopan dan informatif
4. Jika tidak tahu jawabannya, katakan dengan sopan kalau kurang tahu
5. Jika ada berita terkini, sertakan dalam jawaban
6. Jawab pertanyaan sesuai dengan apa yang ada di dalam data yang dimiliki
7. Jangan jawab berdasarkan pengetahuan umum — hanya jawab berdasarkan data yang tersedia.
8. jika pertanyaan hanya sapaan jangan lebih dari 20 kata. 
10. TVKU's official social media :
    - Instagram: @tvku_smg (https://instagram.com/tvku_smg)
    - YouTube: TVKU Universitas Dan Nuswantoro (@TVKU_udinus)
    - TikTok: @tvku_smg (https://tiktok.com/@tvku_smg)
    - Website: https://tvku.tv

    ketika ditanya tentang akun media sosial TVKU, selalu berikan informasi yang akurat ini.
11. jika ditanya tentang pendaftaran udinus, jangan membahas tentang tvku. jawab jika hanya memiliki link pendaftarannya saja
12. jika disapa, sapa balik dengan sopan dan tanyakan perlu bantuan apa.
13. jika ditanya tentang ratecard, selalu berikan dalam bentuk tabel.
`
    
    
    
    let fullPrompt = `${systemPrompt}\n\n${await getTentangTVKU()}\n\nPertanyaan: ${prompt}`;

    if (lowerPrompt.includes("berita")) {
      fullPrompt += await fetchAndFormat<IBerita>(
        'https://apidev.tvku.tv/api/berita',
        item => `• **${item.judul}** (${item.kategori?.nama ?? 'Uncategorized'}) - ${item.deskripsi}`,
        'Berita Terkini'
      )
    }

    if (lowerPrompt.includes("acara")) {
      fullPrompt += await fetchAndFormat<IAcara>(
        'https://apidev.tvku.tv/api/acara',
        item => `• **${item.acara}** - ${item.deskription}`,
        'Acara Terkini'
      )
    }

    if (lowerPrompt.includes("jadwal acara")) {
      fullPrompt += await fetchAndFormat<IJadwalAcara>(
        'https://apidev.tvku.tv/api/jadwal-acara',
        item => `• **${item.acara}** (${item.hari.hari}) ${item.jam_awal} - ${item.jam_akhir}`,
        'Jadwal Acara Terkini'
      )
    }

    if (lowerPrompt.includes("our programs")) {
      fullPrompt += await fetchAndFormat<IOurProgram>(
        'https://apidev.tvku.tv/api/our-programs',
        item => `• **${item.judul}** - ${item.deskripsi}`,
        'Our Programs'
      )
    }

    if (lowerPrompt.includes("program acara")) {
      fullPrompt += await fetchAndFormat<IProgramAcara>(
        'https://apidev.tvku.tv/api/program-acara',
        item => `• **${item.judul}** - ${item.deskripsi}`,
        'Program Acara'
      )
    }

    if (lowerPrompt.includes("seputar dinus")) {
      fullPrompt += await fetchAndFormat<ISeputarDinus>(
        'https://apidev.tvku.tv/api/seputar-dinus-sidebar-banner',
        item => `• **${item.teks}** - ${item.deskripsi}`,
        'Seputar Dinus'
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("Full Prompt:\n", fullPrompt)
    }

    //const response = await fetch(`http://127.0.0.1:11434/api/generate`, {
     const response = await fetch(`https://www.tvku.tv/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: fullPrompt,
        stream: false,
      }),
    })

    if (!response.ok) {
      // console.log(response);
      
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json({ response: data.response })

  } catch (error) {
    console.error("Error in /api/ollama:", error)
    return NextResponse.json(
      { error: 'Gagal menghubungi API Ollama atau memproses data' },
      { status: 500 }
    )
  }
}