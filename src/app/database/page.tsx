'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseFile {
  name: string;
  size: number;
  uploadDate: string;
  type: string;
}

export default function DatabasePage() {
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/database');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (filename: string) => {
    if (!confirm(`Hapus file ${filename}?`)) return;
    
    try {
      const response = await fetch('/api/database', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      
      if (response.ok) {
        loadFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const reingest = async () => {
    if (!confirm('Re-ingest semua data? Proses ini akan memakan waktu.')) return;
    
    try {
      const response = await fetch('/api/database/reingest', { method: 'POST' });
      if (response.ok) {
        alert('Re-ingestion berhasil!');
      }
    } catch (error) {
      console.error('Error re-ingesting:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <Button onClick={reingest} className="w-fit">
            Re-ingest Data
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.name} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.uploadDate}
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteFile(file.name)}
                >
                  Hapus
                </Button>
              </div>
            ))}
            {files.length === 0 && (
              <p className="text-center text-gray-500 py-8">Tidak ada file</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}