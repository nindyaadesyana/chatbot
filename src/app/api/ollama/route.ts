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
  waktu_publish : string 
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
interface IRateCard {
  acara: string
  durasi: string
  harga: string
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
      formattedData += `### [Rate Card]\n`;

      const rateCards: IRateCard[] = data.rateCard; 
      rateCards.forEach((item: IRateCard) => {
        formattedData += `- ${item.acara}: ${item.durasi} (${item.harga})\n`;
      });

      formattedData += '\n';
    }

  const SOCIAL_MEDIA_MAP: Record<string, string> = {
     tvku_ig: "https://www.instagram.com/tvku_smg",
     tvku_yt: "https://www.youtube.com/@TVKU_udinus",
     tvku_tt: "https://www.tiktok.com/@tvku_smg"
   };

  if (data.mediaSosial) {
    formattedData += `### [Media Sosial]\n`;
    for (const [platform, code] of Object.entries(data.mediaSosial)) {
      const url = SOCIAL_MEDIA_MAP[code as keyof typeof SOCIAL_MEDIA_MAP];
      formattedData += `- [${platform}: ${code}](${url})\n`; 
    }
  }

    return formattedData;
  } catch (error) {
    console.error('Gagal membaca tentangTVKU.json:', error);
    return '';
  }
}

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
    
    const lowerPrompt = prompt.toLowerCase().trim()

    // Jika hanya sapaan, langsung kembalikan respons tanpa lanjut ke LLaMA
    const sapaanKeywords = ['halo', 'hi', 'hai', 'assalamualaikum', 'pagi', 'siang', 'sore', 'malam']
    if (sapaanKeywords.some(word => lowerPrompt === word || lowerPrompt.includes(word))) {
      return NextResponse.json({
        response: `Halo, Sahabat TVKU! Aku Dira, asisten virtual berbasis kecerdasan buatan milik TVKU. Tugasku adalah membantu memberikan informasi seputar TVKU — mulai dari jadwal acara, detail program unggulan, berita terbaru, hingga panduan seputar layanan TVKU. Aku siap menemani kamu kapan saja untuk menjawab pertanyaan dan membantumu menjelajahi semua yang ditawarkan TVKU.`
      })
    }


    const systemPrompt = `Anda adalah Dira, Asisten virtual TVKU.Aturan:
1. Fokus pada topik berita dan informasi umum
2. Jangan bahas topik sensitif
3. Jawab dalam bahasa yang sopan dan informatif
4. Jika tidak tahu jawabannya, katakan dengan sopan kalau kurang tahu
5. Jika ada berita terkini, sertakan dalam jawaban
6. Jawab pertanyaan sesuai dengan apa yang ada di dalam data yang dimiliki
7. Jangan jawab berdasarkan pengetahuan umum — hanya jawab berdasarkan data yang tersedia.
8. Jawab pertanyaan sesuai dengan data yang tersedia. Jika tidak tahu, katakan dengan sopan.
9. TVKU's official social media :
    - Instagram: @tvku_smg
    - YouTube: TVKU Universitas Dan Nuswantoro (@TVKU_udinus)
    - TikTok: @tvku_smg 
    - Website: https://tvku.tv

    ketika ditanya tentang akun media sosial TVKU, selalu berikan informasi yang akurat ini.
10. jika ditanya tentang pendaftaran udinus, jangan membahas tentang tvku. jawab jika hanya memiliki link pendaftarannya saja
11. jika ditanya tentang ratecard, selalu berikan dalam bentuk tabel.
`
    
    
    
    let fullPrompt = `${systemPrompt}\n\n${await getTentangTVKU()}\n\nPertanyaan: ${prompt}`;

    if (lowerPrompt.includes("berita")) {
      const res = await axios.get('https://apidev.tvku.tv/api/berita')
      const data: IBerita[] = res.data.data

      // Urutkan berdasarkan tanggal terbaru
      const sorted = data.sort((a: IBerita, b: IBerita) => 
        new Date(b.waktu_publish).getTime() - new Date(a.waktu_publish).getTime()
      )

      const formatted = sorted.map(item =>
        `• **${item.judul}** (${item.kategori?.nama ?? 'Uncategorized'}) - ${item.deskripsi}`
      ).join('\n')

      fullPrompt += `\n\n### [Berita Terkini]\n${formatted}`
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