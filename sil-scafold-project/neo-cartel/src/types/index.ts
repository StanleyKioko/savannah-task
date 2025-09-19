// Authentication Types

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  phone?: string;
  date_of_birth?: string;
  address?: Address;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  newsletter_subscription: boolean;
  email_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface Address {
  id: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  children?: Category[];
  product_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  sale_price?: number;
  category: Category;
  categories: Category[];
  brand?: Brand;
  images: ProductImage[];
  featured_image?: string;
  in_stock: boolean;
  stock_quantity: number;
  weight?: number;
  dimensions?: ProductDimensions;
  attributes: ProductAttribute[];
  variants?: ProductVariant[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_digital: boolean;
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  image: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  sku: string;
  stock_quantity: number;
  attributes: ProductAttribute[];
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  is_active: boolean;
}

export interface Review {
  id: string;
  user: User;
  product: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  user?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user: User;
  status: OrderStatus;
  items: OrderItem[];
  billing_address: Address;
  shipping_address: Address;
  payment_method: PaymentMethod;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  notifications?: {
    sms?: boolean;
    email?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer';
  provider: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimum_amount?: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
}

export interface Wishlist {
  id: string;
  user: string;
  products: Product[];
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  status: number;
}

// Filter and Search Types
export interface ProductFilters {
  category?: string[];
  brand?: string[];
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  rating?: number;
  tags?: string[];
  attributes?: Record<string, string[]>;
}

export interface ProductSearchParams {
  q?: string;
  category?: string;
  sort?: 'name' | 'price' | 'rating' | 'created_at' | '-name' | '-price' | '-rating' | '-created_at';
  filters?: ProductFilters;
  page?: number;
  page_size?: number;
}

// Authentication Types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
  badge?: string | number;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}