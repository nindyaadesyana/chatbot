import SimpleUpload from '@/components/simpleUpload';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Panel</h1>
        <SimpleUpload />
      </div>
    </div>
  );
}