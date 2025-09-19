// Backend API response types
// These match exactly what the Django backend returns

export interface BackendProduct {
  id: number;
  sku: string;
  name: string;
  price: string;  // Decimal values are returned as strings in JSON
  category: number; // This is just the category ID
  image: string | null; // URL to the image or null if no image
}

export interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  parent: number | null; // Parent category ID or null
  product_count: number;
}