import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pertanyaan_pengguna } = await request.json();

    if (!pertanyaan_pengguna) {
      return NextResponse.json(
        { error: 'pertanyaan_pengguna is required' },
        { status: 400 }
      );
    }

    // Simulate retriever contexts based on question
    const contexts = getContextsForQuestion(pertanyaan_pengguna);

    return NextResponse.json({
      question: pertanyaan_pengguna,
      contexts: contexts
    });

  } catch (error: any) {
    console.error('Debug Contexts API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getContextsForQuestion(question: string): string[] {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('direktur utama')) {
    return [
      "Struktur manajemen TVKU dipimpin oleh seorang Direktur Utama. Saat ini, posisi Direktur Utama TVKU dijabat oleh Dr. Guruh Fajar Shidik, M.Cs.",
      "Dr. Guruh Fajar Shidik, M.Cs memiliki latar belakang di bidang teknologi informasi dan media penyiaran.",
      "Untuk informasi lebih lanjut mengenai jajaran direksi, silakan kunjungi halaman 'Tentang Kami' di situs resmi TVKU."
    ];
  }
  
  if (lowerQ.includes('direktur operasional')) {
    return [
      "Direktur Operasional TVKU dijabat oleh Dr. Hery Pamungkas, S.S., M.I.Kom.",
      "Dr. Hery Pamungkas bertanggung jawab atas operasional harian TVKU termasuk produksi dan penyiaran.",
      "Beliau memiliki pengalaman luas di bidang komunikasi dan media."
    ];
  }
  
  if (lowerQ.includes('visi')) {
    return [
      "Visi TVKU adalah menjadi televisi kampus terdepan dalam menyajikan informasi edukatif dan menghibur bagi masyarakat.",
      "TVKU berkomitmen untuk menjadi media yang memberikan kontribusi positif bagi pengembangan pendidikan dan budaya.",
      "Sebagai televisi kampus, TVKU fokus pada konten yang mendidik dan menginspirasi."
    ];
  }
  
  if (lowerQ.includes('misi')) {
    return [
      "Misi TVKU meliputi penyediaan konten berkualitas, pengembangan SDM broadcasting, dan kontribusi positif untuk masyarakat.",
      "TVKU berkomitmen untuk menghasilkan program-program yang edukatif dan menghibur.",
      "Sebagai bagian dari Universitas Dian Nuswantoro, TVKU mendukung visi pendidikan yang berkualitas."
    ];
  }
  
  if (lowerQ.includes('berita')) {
    return [
      "BERITA TERBARU TVKU: Pelantikan Pengurus Baru Himpunan Mahasiswa Teknik Informatika UDINUS - Kategori: Kampus - Waktu: 15 Januari 2025",
      "BERITA TERBARU TVKU: Workshop Digital Marketing untuk UMKM Semarang - Kategori: Ekonomi - Waktu: 14 Januari 2025",
      "TVKU menyajikan berita terkini seputar kegiatan kampus dan masyarakat sekitar."
    ];
  }
  
  return [
    "Informasi umum tentang TVKU sebagai televisi kampus Universitas Dian Nuswantoro.",
    "TVKU berkomitmen memberikan layanan informasi dan hiburan berkualitas.",
    "Untuk informasi lebih detail, silakan hubungi tim TVKU."
  ];
}