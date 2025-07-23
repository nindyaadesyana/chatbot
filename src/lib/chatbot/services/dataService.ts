import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { IBerita, IAcara, IJadwalAcara, IOurProgram, IProgramAcara, ISeputarDinus } from '../types';

export class DataService {
  static async fetchAndFormat<T>(
    url: string,
    mapFn: (item: T, idx: number, arr: T[]) => string,
    label: string,
    limit?: number
  ): Promise<string> {
    try {
      const res = await axios.get(url);
      let data = res.data.data;
      if (limit && Array.isArray(data)) {
        data = data.slice(0, limit);
      }
      if (data && data.length > 0) {
        const formatted = data.map((item: T, idx: number, arr: T[]) => mapFn(item, idx, data)).join('\n');
        return `\n\n### [${label}]\n${formatted}`;
      }
    } catch (err) {
      console.error(`Gagal mengambil ${label}:`, err);
    }
    return '';
  }

  static async getBerita(): Promise<string> {
    try {
      const res = await axios.get(API_ENDPOINTS.BERITA);
      const data: IBerita[] = res.data.data;

      // Ambil 5 berita terbaru (boleh judul sama)
      const sorted = data.sort((a: IBerita, b: IBerita) => 
        new Date(b.waktu_publish).getTime() - new Date(a.waktu_publish).getTime()
      );

      const formatted = sorted.slice(0, 5).map((item, index) => {
        // Remove HTML tags from description
        const cleanDescription = item.deskripsi.replace(/<[^>]*>/g, '').trim();
        return `${index + 1}. **${item.judul}**\n   Kategori: ${item.kategori?.nama ?? 'Umum'}\n   Deskripsi: ${cleanDescription}\n   Waktu: ${new Date(item.waktu_publish).toLocaleDateString('id-ID')}\n`;
      }).join('\n');

      return `\n\n### [Berita Terkini TVKU]\n${formatted}`;
    } catch (error) {
      console.error('Gagal mengambil berita:', error);
      return '';
    }
  }


  static async getJadwalAcara(): Promise<string> {
    try {
      const res = await axios.get(API_ENDPOINTS.JADWAL_ACARA);
      const data: IJadwalAcara[] = res.data.data || [];
      // Ambil 20 teratas, tampilkan dalam format numbering
      const rows = data.slice(0, 20).map((item, idx) => {
        const jamAwal = String(item.jam_awal).replace(/\.(\d)$/, ':$10');
        const jamAkhir = String(item.jam_akhir).replace(/\.(\d)$/, ':$10');
        return `${idx + 1}. ${item.acara.replace(/\*\*/g, '').trim()} (${item.hari.hari}) ${jamAwal} - ${jamAkhir}`;
      }).join('\n');
      if (!rows) return '';
      return `\n\n### [Jadwal Acara Terkini]\n${rows}\n\nSetiap program memiliki jadwal tayang berbeda. Jika ingin tahu detail acara tertentu, silakan sebutkan nama acaranya!`;
    } catch (error) {
      console.error('Gagal mengambil jadwal acara:', error);
      return '';
    }
  }

  static async getOurPrograms(): Promise<string> {
    return this.fetchAndFormat<IOurProgram>(
      API_ENDPOINTS.OUR_PROGRAMS,
      (item: IOurProgram, idx: number, arr: IOurProgram[]) => idx < 5 ? `• **${item.judul}** - ${item.deskripsi}` : '',
      'Our Programs'
    );
  }

  static async getProgramAcara(): Promise<string> {
    try {
      const res = await axios.get(API_ENDPOINTS.PROGRAM_ACARA);
      const data: IProgramAcara[] = res.data.data || [];
      // Ambil 5 teratas, tampilkan semua (boleh duplikat judul), numbering, dan format rapi
      const formattedList = data
        .slice(0, 5)
        .map((item, idx) => `${idx + 1}. **${item.judul}**`)
        .join('\n');
      if (!formattedList) return '';
      return `\n\n### [Program Acara TVKU Terbaru]\n${formattedList}\n\nSetiap program menghadirkan topik menarik dan inspiratif. Jika ingin tahu detail atau jadwal tayang salah satu program, silakan sebutkan judulnya!`;
    } catch (error) {
      console.error('Gagal mengambil program acara:', error);
      return '';
    }
  }

  static async getSeputarDinus(): Promise<string> {
    return this.fetchAndFormat<ISeputarDinus>(
      API_ENDPOINTS.SEPUTAR_DINUS,
      item => `• **${item.teks}** - ${item.deskripsi}`,
      'Seputar Dinus'
    );
  }
}