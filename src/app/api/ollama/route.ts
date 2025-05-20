import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

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
  acara : string
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

const tentangTVKU = `
### [Kata Pengantar]
Stasiun televisi yang memiliki nilai strategis dalam rangka turut serta dalam mencerdaskan kehidupan bangsa dan memberikan
alternatif solusi atas berbagai permasalahan di masyarakat melalui program program siaran yang berkualitas dan tepat sasaran. 
Mengingat, hingga saat ini belum ada program pendidikan yang layak sehingga keberadaan stasiun pendidikan sangat dibutuhkan.
Kota induk jawa tengah, semarang yang dikenal sebagai kota industri, perdagangan, kelautan, wisata buaya dan pendidikan juga sangat dibutuhkan.
pada tanggal 13 September 2023, surat keputusan gubernur jawa tengah no. 483/116/2003 telah diperbarui pada tanggal 8 februai 2005 dengan No. 483/12A/2005
secara resmi mendapatkan izin untuk membangun stasiun televsi pendidikan yang dikelola oleh PT.Televsi Kampus Universitas Dian nuswantoro dikenal dengan TVKU.

### [Visi dan Misi]
**Visi:** Menyegarkan bangsa melalui media audio visual  
**Misi:** Memberikan edukasi melalui media televisi dengan materi edukasi baik teoritis maupun praktis aplikatif kepada masyarakat semarang Jawa Tengah
khususnya dan warga masyaakat pada ummnya.

### [Rate Card]
| ACARA                             | DURASI     | HARGA             |
|----------------------------------|------------|-------------------|
| Blocking Time Talkshow           | 60 Menit   | Rp 30.000.000     |
| Blocking Time Produk             | 60 Menit   | Rp 10.000.000     |
| Live Event di Luar Studio        | 60 Menit   | Rp 75.000.000     |
| Biaya Produksi Live Event        | 60 Menit   | Rp 10.000.000     |
| Produksi TVC                     | 60 Detik   | Rp 45.000.000     |
| Produksi Company Profile         | 5 Menit    | Rp 65.000.000     |
| Running Text                     | -          | Rp 300.000        |
| Liputan Advertorial              | 3 Menit    | Rp 2.500.000      |
| Liputan Khusus/Tapping (60mnt)   | 60 Menit   | Rp 25.000.000     |
| Liputan Khusus/Tapping (30mnt)   | 30 Menit   | Rp 20.000.000     |
| Liputan Khusus/Tapping (15mnt)   | 15 Menit   | Rp 10.000.000     |
| Penayangan TVC                   | 30 Detik   | Rp 500.000        |
rmrf
### [Manajemen]
TVKU dikelola oleh PT Televisi Kampus Universitas Dian Nuswantoro . Penyaran program akan dilakukan  seara mandiri atau pihak luar tergantung pada
bobot kualitas yang memenuhi syarat. Pengelolaan siaran dilakukan oleh sumber daya manusia yang profesional dibidangnya, bekerjasama dengan pihak-pihak
yang berkompeten di bidang penyiarantelevisi. Sumber dana yang digunakan dalam pelaksanaan program aksi dan siaran digali dari lembaga Independen dan iklan.

### [Penghargaan TVKU Semarang]
1. Lembaga Penyiaran Televisi Lokal Terbaik Jawa Tengah (2016, 2018, 2019, 2022, 2023)
2. Iklan Layanan Masyarakat Terbaik (2019, 2020)
3. Presenter Wanita Terbaik (2019)
4. Lifetime Achievement Prof. Ir. Edi Noersasngko, M.Kom (2021)
5. Markplus Award Industry Marketing Champion (2023)

### [Fasilitas TVKU]
- Front Office
- Transit Room
- Foyer
- Studio
- Master Control Room
- Meeting Room
- Workplace
- Dubbing Room

### [Kontak Kerja Sama]
- Deka  (📞 081 390 245 687)
- Fitri (📞 081 227 241 195)
- Bagus (📞 081 228 115 941)
- Official Digital Marketing: 📱 085 156 471 303

### [Media Sosial TVKU Semarang]
-  [Instagram](https://www.instagram.com/tvku_smg/)
-  [YouTube](https://www.youtube.com/@TVKU_udinus)
-  [TikTok](https://www.tiktok.com/@tvku_smg)

###[Cara Pendaftaran Mahasiswa Udinus]

### [Target Viewers]
Pemirsa TVKU adalah seluruh lapisan masyarakat yang berdomisili di Semarang dan sekitarnya, penduduk Jawa Tengah pada umumnya yang berusia 10 sampai dengan
60 tahun, terutama yang ingin menimba ilmu dan pendidikan. Program siaran dirancang untuk semua level, terutama terkait dengan peningkatan pengetahuan tentang progrm tersebut.

TVKU dapat ditonton melalui Digital TV, atau live streaming TVKU Semarang melalui Android. Kini, siaran TVKU menjangkau 12,5 juta penduduk jawa tengah di Kota Semarang, Kota Salatiga,
Kab. Kendal, Kab. Demak, Kab. Grobokan, Kab. Jepara, Kab. Kudus, Kab. Pati, Kab. Blora, Kab. Temanggung, Magelang, Kota Pekalongan, Kab. Pekalongan, Kab. Sragen, Kab. Batang, 
Kab. Pemalang, Kab. Karanganyar, Kab. Boyolali dan sekitarnya.

### [Motto dan Objektif]
**Motto:** Menumbuhkan Ilmu  
**Objektif:** Meningkatkan kesejahteraan warga dengan meningkatkan pengetahuan teoritis dan ketrampilan praktis dan diterapkan melalui program siaran yang dirancang khusus untuk tujuan itu
`

// Fallback response
async function getBotResponse(message: string) {
  return {
    type: "bot",
    message: "Maaf, saya belum bisa menjawab pertanyaan itu sekarang."
  };
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

    const lowerPrompt = prompt.toLowerCase()

    const systemPrompt = `Anda adalah Atmin. Aturan:
1. Fokus pada topik berita dan informasi umum
2. Jangan bahas topik sensitif
3. Jawab dalam bahasa yang sopan dan informatif
4. Jika tidak tahu jawabannya, katakan dengan sopan kalau kurang tahu
5. Jika ada berita terkini, sertakan dalam jawaban
6. Jawab pertanyaan sesuai dengan apa yang ada di dalam data yang dimiliki
7. Jangan jawab berdasarkan pengetahuan umum — hanya jawab berdasarkan data yang tersedia.`

    let fullPrompt = `${systemPrompt}\n\n${tentangTVKU}\n\nPertanyaan: ${prompt}`

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

    const response = await fetch(`http://127.0.0.1:11434/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: fullPrompt,
        stream: false,
      }),
    })

    if (!response.ok) {
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
