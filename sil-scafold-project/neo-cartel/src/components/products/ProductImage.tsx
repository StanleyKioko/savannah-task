import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { productAPI } from '@/lib/productApi';
import { BackendProduct } from '@/types/backend';

interface ProductImageProps {
  product: BackendProduct;
  onImageUpdate?: (updatedProduct: BackendProduct) => void;
  editable?: boolean;
}

export function ProductImage({ product, onImageUpdate, editable = false }: ProductImageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      const response = await productAPI.uploadProductImage(product.id, file);
      console.log('Upload response:', response);
      if (onImageUpdate) {
        onImageUpdate(response as BackendProduct);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="relative">
      <div className="h-40 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img 
            src={`http://localhost:8000${product.image}`} 
            alt={product.name} 
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-gray-400">{product.sku}</span>
        )}
      </div>
      
      {editable && (
        <div className="mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById(`file-upload-${product.id}`)?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          <input
            id={`file-upload-${product.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}