import React from 'react';

interface RatecardItem {
  acara: string;
  durasi: string;
  harga: string;
}

interface RatecardTableProps {
  items: RatecardItem[];
  contacts?: Array<{ nama: string; telepon: string }>;
}

export function RatecardTable({ items, contacts }: RatecardTableProps) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h3 className="text-xl font-bold flex items-center">
          📺 RATECARD TVKU RESMI
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Jenis Layanan
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Durasi
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Harga
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.acara}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.durasi}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">
                  {item.harga}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {contacts && contacts.length > 0 && (
        <div className="bg-gray-50 p-4 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            📞 HUBUNGI TIM SALES:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {contacts.map((contact, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{contact.nama}:</span>
                <a 
                  href={`tel:${contact.telepon}`}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  {contact.telepon}
                </a>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            ⚠️ Harga dapat berubah sewaktu-waktu<br/>
            💡 Hubungi tim sales untuk penawaran terbaik!
          </p>
        </div>
      )}
    </div>
  );
}