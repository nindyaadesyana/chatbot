import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { IBerita, IAcara, IJadwalAcara, IOurProgram, IProgramAcara, ISeputarDinus } from '../types';

export class DataService {
  static async fetchAndFormat<T>(
    url: string,
    mapFn: (item: T) => string,
    label: string
  ): Promise<string> {
    try {
      const res = await axios.get(url);
      const data = res.data.data;
      if (data && data.length > 0) {
        const formatted = data.map(mapFn).join('\n');
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

  static async getAcara(): Promise<string> {
    return this.fetchAndFormat<IAcara>(
      API_ENDPOINTS.ACARA,
      item => `• **${item.acara}** - ${item.deskription}`,
      'Acara Terkini'
    );
  }

  static async getJadwalAcara(): Promise<string> {
    return this.fetchAndFormat<IJadwalAcara>(
      API_ENDPOINTS.JADWAL_ACARA,
      item => `• **${item.acara}** (${item.hari.hari}) ${item.jam_awal} - ${item.jam_akhir}`,
      'Jadwal Acara Terkini'
    );
  }

  static async getOurPrograms(): Promise<string> {
    return this.fetchAndFormat<IOurProgram>(
      API_ENDPOINTS.OUR_PROGRAMS,
      item => `• **${item.judul}** - ${item.deskripsi}`,
      'Our Programs'
    );
  }

  static async getProgramAcara(): Promise<string> {
    return this.fetchAndFormat<IProgramAcara>(
      API_ENDPOINTS.PROGRAM_ACARA,
      item => `• **${item.judul}** - ${item.deskripsi}`,
      'Program Acara'
    );
  }

  static async getSeputarDinus(): Promise<string> {
    return this.fetchAndFormat<ISeputarDinus>(
      API_ENDPOINTS.SEPUTAR_DINUS,
      item => `• **${item.teks}** - ${item.deskripsi}`,
      'Seputar Dinus'
    );
  }
}