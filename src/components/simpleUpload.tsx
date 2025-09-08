'use client';

import { useState } from 'react';

export default function SimpleUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        setProgress(100);
        setTimeout(() => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            setMessage(result.message || 'Upload berhasil');
          } else {
            const result = JSON.parse(xhr.responseText);
            setMessage(result.error || 'Upload gagal');
          }
          setUploading(false);
          setProgress(0);
        }, 500);
      };

      xhr.onerror = () => {
        setMessage('Upload gagal');
        setUploading(false);
      };

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (error) {
      setMessage('Upload gagal');
      setUploading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow">
      <h3 className="text-xl font-semibold mb-4">Upload PDF</h3>
      <input
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        disabled={uploading}
        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{progress === 100 ? 'Processing...' : 'Uploading...'}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress === 100 ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {message && (
        <p className={`text-sm mt-2 p-2 rounded ${
          message.includes('berhasil') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}