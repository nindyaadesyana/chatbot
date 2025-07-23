export interface IBerita {
  id: number
  judul: string
  deskripsi: string
  kategori: {
    nama: string
  }
  waktu_publish: string 
}

export interface IAcara {
  id: number
  acara: string
  deskripsi: string
}

export interface IJadwalAcara {
  id: number
  acara: string
  jam_awal: number
  jam_akhir: number
  hari: {
    id: number
    hari: string
  }
}

export interface IOurProgram {
  id: number
  judul: string
  deskripsi: string
}

export interface IProgramAcara {
  id_program: number;
  judul: string;
  deskripsi: string;
}

export interface ISeputarDinus {
  id: number
  teks: string
  deskripsi: string
}

export interface IRateCard {
  acara: string
  durasi: string
  harga: string
}

export interface ITentangTVKU {
  kataPengantar: string
  visi: string
  misi: string
  rateCard: IRateCard[]
  mediaSosial: Record<string, string>
}