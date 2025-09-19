import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { productAPI } from '@/lib/productApi';

export function SimpleImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    try {
      // Using product ID 1 for testing
      const response = await productAPI.uploadProductImage(1, file);
      setResult(JSON.stringify(response, null, 2));
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">Test Image Uploader</h2>
      
      <div className="mb-4">
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2"
        />
        
        {file && (
          <p className="text-sm text-gray-600">
            Selected: {file.name} ({file.type}, {Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>
      
      <Button 
        onClick={handleUpload} 
        disabled={uploading || !file}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded text-red-500">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="font-bold">Upload Result:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}