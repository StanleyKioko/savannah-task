import { apiClient } from './api';
import { BackendProduct, BackendCategory } from '@/types/backend';

// Product API Service
export const productAPI = {
  // Get all products
  getProducts: () => 
    apiClient.get<BackendProduct[]>('/products/'),
  
  // Get product by ID
  getProduct: (id: number) => 
    apiClient.get<BackendProduct>(`/products/${id}/`),
  
  // Get all categories
  getCategories: () => 
    apiClient.get<BackendCategory[]>('/categories/'),
  
  // Get category by ID
  getCategory: (id: number) => 
    apiClient.get<BackendCategory>(`/categories/${id}/`),
  
  // Get average price for a category
  getCategoryAveragePrice: (id: number) => 
    apiClient.get<{ category: string, average_price: number, product_count: number }>(`/categories/${id}/average-price/`),
  
  // Create an order
  createOrder: (orderData: {
    customer_name: string;
    customer_email: string;
    shipping_address: string;
    customer_phone: string;
    preferred_date?: string;
    preferred_time?: string;
    notifications?: {
      sms: boolean;
      email: boolean;
    };
    items: Array<{
      product: number;
      qty: number;
      unit_price: number;
    }>;
  }) => 
    apiClient.post('/orders/', orderData),
  
  getOrder: (id: number) => 
    apiClient.get(`/orders/${id}/`),
    
  getOrderNotificationStatus: (id: number) =>
    apiClient.get(`/orders/${id}/notifications/`),
    
  uploadProductImage: (productId: number, imageFile: File) => {
    console.log(`Uploading file: ${imageFile.name}, type: ${imageFile.type}, size: ${imageFile.size}`);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return apiClient.post(`/products/${productId}/image/`, formData);
  },
  
  // Upload products CSV
  uploadProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the upload method for file uploads
    return apiClient.upload('/products/upload/', formData);
  },

  // Wishlist API methods
  // Get wishlist
  getWishlist: () => 
    apiClient.get('/wishlist/'),
  
  // Add product to wishlist
  addToWishlist: (productId: number) => 
    apiClient.post('/wishlist/', { product_id: productId }),
  
  // Remove product from wishlist
  removeFromWishlist: (productId: number) => 
    apiClient.delete(`/wishlist/remove/${productId}/`),
  
  // Clear entire wishlist
  clearWishlist: () => 
    apiClient.delete('/wishlist/clear/')
}