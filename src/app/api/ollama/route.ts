import { NextRequest, NextResponse } from 'next/server'
import { ChatbotService } from '@/lib/chatbot'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userMessage = body.message || body.prompt
    
    // Get contexts for debugging
    const contexts = getContextsForQuestion(userMessage)
    
    const response = await ChatbotService.processMessage(userMessage)
    const { ResponseHandler } = await import('@/lib/chatbot')
    const formatted = ResponseHandler.formatResponse(response)
    
    return NextResponse.json({ 
      response: formatted.display,
      speech: formatted.speech,
      contexts: contexts,
      debug: {
        question: userMessage,
        contextCount: contexts.length
      }
    })
  } catch (error) {
    console.error("Error in /api/ollama:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

function getContextsForQuestion(question: string): string[] {
  const lowerQ = question.toLowerCase()
  
  // Greeting keywords - no contexts needed
  const greetingKeywords = ['halo', 'hai', 'hi', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum']
  const isGreeting = greetingKeywords.some(keyword => lowerQ.includes(keyword))
  
  if (isGreeting && !lowerQ.includes('tvku') && !lowerQ.includes('berita') && !lowerQ.includes('program')) {
    return [
      "Greeting: Halo! Saya Dira, asisten virtual TVKU siap membantu Anda.",
      "Greeting: Selamat datang di layanan informasi TVKU.",
      "Greeting: Ada yang bisa saya bantu tentang TVKU?"
    ]
  }
  
  // Thank you keywords - no contexts needed
  const thankYouKeywords = ['terima kasih', 'terimakasih', 'makasih', 'thanks', 'thank you']
  const isThankYou = thankYouKeywords.some(keyword => lowerQ.includes(keyword))
  
  if (isThankYou) {
    return [
      "Thank you: Sama-sama! Senang bisa membantu.",
      "Thank you: Jika ada pertanyaan lain tentang TVKU, silakan tanya.",
      "Thank you: TVKU siap melayani kebutuhan informasi Anda."
    ]
  }
  
  // Berita keywords
  if (lowerQ.includes('berita') || lowerQ.includes('news') || lowerQ.includes('hari ini')) {
    return [
      "BERITA TERBARU TVKU: Mobil Pick Up Pengangkut Sepeda Terbakar di Jalan Siliwangi - Kategori: Kriminal - Waktu: 24 Juli 2025",
      "BERITA TERBARU TVKU: Workshop Digital Marketing untuk UMKM Semarang - Kategori: Ekonomi - Waktu: 23 Juli 2025",
      "BERITA TERBARU TVKU: Seminar Nasional Teknologi Informasi - Kategori: Pendidikan - Waktu: 22 Juli 2025",
      "TVKU menyajikan berita terkini seputar kegiatan kampus, masyarakat, dan perkembangan teknologi."
    ]
  }
  
  // Direktur keywords
  if (lowerQ.includes('direktur') || lowerQ.includes('pimpinan') || lowerQ.includes('struktur')) {
    return [
      "Struktur manajemen TVKU dipimpin oleh seorang Direktur Utama. Saat ini, posisi Direktur Utama TVKU dijabat oleh Dr. Guruh Fajar Shidik, M.Cs.",
      "Direktur Operasional TVKU dijabat oleh Dr. Hery Pamungkas, S.S., M.I.Kom yang bertanggung jawab atas operasional harian.",
      "Direktur HRD & Keuangan TVKU adalah Rinowati N yang mengelola sumber daya manusia dan keuangan.",
      "Kepala Produksi TVKU dijabat oleh Trias, sedangkan Kepala News dijabat oleh Tutuk Toto Carito."
    ]
  }
  
  // Visi Misi keywords
  if (lowerQ.includes('visi') || lowerQ.includes('misi') || lowerQ.includes('motto')) {
    return [
      "Visi TVKU adalah menjadi televisi kampus terdepan dalam menyajikan informasi edukatif dan menghibur bagi masyarakat.",
      "Misi TVKU meliputi penyediaan konten berkualitas, pengembangan SDM broadcasting, dan kontribusi positif untuk masyarakat.",
      "Motto TVKU adalah 'Inspiring Through Information' yang mencerminkan komitmen untuk menginspirasi melalui informasi berkualitas.",
      "TVKU berkomitmen untuk menjadi media yang memberikan kontribusi positif bagi pengembangan pendidikan dan budaya."
    ]
  }
  
  // Program keywords
  if (lowerQ.includes('program') || lowerQ.includes('acara') || lowerQ.includes('siaran')) {
    return [
      "PROGRAM TVKU: Udinus News - program berita harian yang menyajikan informasi terkini seputar kampus dan masyarakat.",
      "PROGRAM TVKU: Tech Talk - program diskusi teknologi informasi dan komunikasi terbaru.",
      "PROGRAM TVKU: Campus Life - program yang mengangkat kehidupan mahasiswa dan kegiatan kampus.",
      "TVKU memiliki berbagai program unggulan yang mendidik dan menghibur sesuai dengan visi sebagai televisi kampus."
    ]
  }
  
  // Ratecard keywords
  if (lowerQ.includes('ratecard') || lowerQ.includes('tarif') || lowerQ.includes('iklan') || lowerQ.includes('harga')) {
    return [
      "Ratecard TVKU menyediakan berbagai paket iklan dengan durasi 30 detik hingga 60 detik untuk berbagai program.",
      "Tarif iklan TVKU disesuaikan dengan waktu tayang dan program yang dipilih, mulai dari prime time hingga regular time.",
      "Untuk informasi ratecard terbaru, silakan hubungi tim sales TVKU di nomor yang tersedia.",
      "TVKU menawarkan paket kerjasama iklan yang fleksibel sesuai kebutuhan klien."
    ]
  }
  
  // Kontak keywords
  if (lowerQ.includes('kontak') || lowerQ.includes('sales') || lowerQ.includes('hubungi')) {
    return [
      "Tim Sales TVKU dapat dihubungi untuk informasi kerjasama dan pemasangan iklan.",
      "Kontak TVKU tersedia untuk konsultasi program siaran dan kerjasama media.",
      "Manager Humas & Marketing TVKU dijabat oleh Deka Sukma Artayoga untuk urusan kerjasama.",
      "TVKU berlokasi di Kompleks Udinus Gedung E, Jl. Nakula 1 No.5-11 Lt.2, Semarang."
    ]
  }
  
  // Alamat keywords
  if (lowerQ.includes('alamat') || lowerQ.includes('lokasi') || lowerQ.includes('dimana')) {
    return [
      "Alamat TVKU: Kompleks Udinus Gedung E, Jl. Nakula 1 No.5-11 Lt.2, Pendrikan Kidul, Semarang Tengah.",
      "TVKU berlokasi di dalam kampus Universitas Dian Nuswantoro, Semarang, Jawa Tengah.",
      "Lokasi TVKU mudah diakses dan berada di pusat kota Semarang."
    ]
  }
  
  // Social media keywords
  if (lowerQ.includes('sosmed') || lowerQ.includes('instagram') || lowerQ.includes('youtube') || lowerQ.includes('tiktok')) {
    return [
      "Media sosial TVKU: Instagram @tvku_smg, YouTube TVKU Universitas Dian Nuswantoro, TikTok @tvku_smg.",
      "TVKU aktif di berbagai platform media sosial untuk menjangkau audiens yang lebih luas.",
      "Website resmi TVKU dapat diakses di https://tvku.tv untuk informasi lengkap."
    ]
  }
  
  // Default fallback - more specific based on question content
  if (lowerQ.includes('tvku')) {
    return [
      "TVKU adalah televisi kampus Universitas Dian Nuswantoro yang menyajikan konten edukatif dan informatif.",
      "Sebagai media kampus, TVKU berperan dalam menyebarkan informasi akademik dan kemahasiswaan.",
      "TVKU memiliki komitmen untuk menghasilkan konten berkualitas yang bermanfaat bagi masyarakat."
    ]
  }
  
  // Generic fallback
  return [
    "Maaf, informasi yang Anda cari belum tersedia dalam database TVKU saat ini.",
    "Silakan hubungi tim TVKU untuk informasi lebih lanjut.",
    "TVKU siap membantu kebutuhan informasi dan kerjasama media Anda."
  ]
}