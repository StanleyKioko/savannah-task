import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Product, ProductVariant } from '@/types';
import { apiClient } from '@/lib/api';

interface CartState {
  // State
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  
  // Local actions (for offline functionality)
  addItemLocal: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateItemQuantityLocal: (itemId: string, quantity: number) => void;
  removeItemLocal: (itemId: string) => void;
  clearCartLocal: () => void;
  
  // Utilities
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  clearError: () => void;
  syncWithServer: () => Promise<void>;
}

const CART_API_ENDPOINTS = {
  cart: '/cart/',
  addItem: '/cart/add/',
  updateItem: (itemId: string) => `/cart/items/${itemId}/`,
  removeItem: (itemId: string) => `/cart/items/${itemId}/`,
  clear: '/cart/clear/',
  applyCoupon: '/cart/coupon/',
  removeCoupon: '/cart/coupon/',
};

// Helper functions
const calculateItemSubtotal = (price: number, quantity: number): number => {
  return price * quantity;
};

const calculateCartTotals = (items: CartItem[]): { subtotal: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  // For now, simple total calculation. In real app, you'd include tax, shipping, discounts
  const total = subtotal;
  
  return { subtotal, total };
};

const generateLocalCartItem = (
  product: Product,
  quantity: number = 1,
  variant?: ProductVariant
): CartItem => {
  const price = variant?.sale_price || variant?.price || product.sale_price || product.price;
  const subtotal = calculateItemSubtotal(price, quantity);
  
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    product,
    variant,
    quantity,
    price,
    subtotal,
  };
};

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: null,
      isLoading: false,
      error: null,

      // Fetch cart from server
      fetchCart: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const cart = await apiClient.get<Cart>(CART_API_ENDPOINTS.cart);
          set({ cart, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch cart',
          });
          throw error;
        }
      },

      // Add item to cart (server)
      addItem: async (product: Product, quantity: number = 1, variant?: ProductVariant) => {
        set({ isLoading: true, error: null });
        
        try {
          const payload = {
            product_id: product.id,
            quantity,
            ...(variant && { variant_id: variant.id }),
          };
          
          const cart = await apiClient.post<Cart>(CART_API_ENDPOINTS.addItem, payload);
          set({ cart, isLoading: false });
        } catch (error: any) {
          // Fallback to local add if server fails
          console.warn('Failed to add item to server cart, adding locally:', error);
          get().addItemLocal(product, quantity, variant);
          
          set({
            isLoading: false,
            error: 'Added to cart locally. Will sync when online.',
          });
        }
      },

      // Update item quantity (server)
      updateItemQuantity: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const cart = await apiClient.patch<Cart>(
            CART_API_ENDPOINTS.updateItem(itemId),
            { quantity }
          );
          set({ cart, isLoading: false });
        } catch (error: any) {
          // Fallback to local update
          get().updateItemQuantityLocal(itemId, quantity);
          
          set({
            isLoading: false,
            error: 'Updated locally. Will sync when online.',
          });
        }
      },

      // Remove item from cart (server)
      removeItem: async (itemId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const cart = await apiClient.delete<Cart>(CART_API_ENDPOINTS.removeItem(itemId));
          set({ cart, isLoading: false });
        } catch (error: any) {
          // Fallback to local remove
          get().removeItemLocal(itemId);
          
          set({
            isLoading: false,
            error: 'Removed locally. Will sync when online.',
          });
        }
      },

      // Clear entire cart (server)
      clearCart: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await apiClient.post(CART_API_ENDPOINTS.clear);
          set({ cart: null, isLoading: false });
        } catch (error: any) {
          // Fallback to local clear
          get().clearCartLocal();
          
          set({
            isLoading: false,
            error: 'Cleared locally. Will sync when online.',
          });
        }
      },

      // Apply coupon code
      applyCoupon: async (code: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const cart = await apiClient.post<Cart>(CART_API_ENDPOINTS.applyCoupon, { code });
          set({ cart, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to apply coupon',
          });
          throw error;
        }
      },

      // Remove coupon code
      removeCoupon: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const cart = await apiClient.delete<Cart>(CART_API_ENDPOINTS.removeCoupon);
          set({ cart, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to remove coupon',
          });
          throw error;
        }
      },

      // Local actions for offline functionality
      addItemLocal: (product: Product, quantity: number = 1, variant?: ProductVariant) => {
        const { cart } = get();
        const newItem = generateLocalCartItem(product, quantity, variant);
        
        let updatedCart: Cart;
        
        if (!cart) {
          // Create new cart
          updatedCart = {
            id: 'local_cart',
            items: [newItem],
            subtotal: newItem.subtotal,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: newItem.subtotal,
            currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } else {
          // Check if item already exists (same product and variant)
          const existingItemIndex = cart.items.findIndex(
            item => 
              item.product.id === product.id &&
              item.variant?.id === variant?.id
          );
          
          let updatedItems: CartItem[];
          
          if (existingItemIndex >= 0) {
            // Update existing item quantity
            updatedItems = cart.items.map((item, index) =>
              index === existingItemIndex
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    subtotal: calculateItemSubtotal(item.price, item.quantity + quantity),
                  }
                : item
            );
          } else {
            // Add new item
            updatedItems = [...cart.items, newItem];
          }
          
          const { subtotal, total } = calculateCartTotals(updatedItems);
          
          updatedCart = {
            ...cart,
            items: updatedItems,
            subtotal,
            total,
            updated_at: new Date().toISOString(),
          };
        }
        
        set({ cart: updatedCart });
      },

      updateItemQuantityLocal: (itemId: string, quantity: number) => {
        const { cart } = get();
        
        if (!cart) return;
        
        const updatedItems = cart.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                subtotal: calculateItemSubtotal(item.price, quantity),
              }
            : item
        ).filter(item => item.quantity > 0); // Remove items with 0 quantity
        
        const { subtotal, total } = calculateCartTotals(updatedItems);
        
        const updatedCart: Cart = {
          ...cart,
          items: updatedItems,
          subtotal,
          total,
          updated_at: new Date().toISOString(),
        };
        
        set({ cart: updatedCart });
      },

      removeItemLocal: (itemId: string) => {
        const { cart } = get();
        
        if (!cart) return;
        
        const updatedItems = cart.items.filter(item => item.id !== itemId);
        
        if (updatedItems.length === 0) {
          set({ cart: null });
          return;
        }
        
        const { subtotal, total } = calculateCartTotals(updatedItems);
        
        const updatedCart: Cart = {
          ...cart,
          items: updatedItems,
          subtotal,
          total,
          updated_at: new Date().toISOString(),
        };
        
        set({ cart: updatedCart });
      },

      clearCartLocal: () => {
        set({ cart: null });
      },

      // Utility functions
      getItemCount: (): number => {
        const { cart } = get();
        return cart?.items.reduce((count, item) => count + item.quantity, 0) || 0;
      },

      getSubtotal: (): number => {
        const { cart } = get();
        return cart?.subtotal || 0;
      },

      getTotal: (): number => {
        const { cart } = get();
        return cart?.total || 0;
      },

      clearError: () => {
        set({ error: null });
      },

      // Sync local cart with server
      syncWithServer: async () => {
        const { cart } = get();
        const isAuthenticated = localStorage.getItem('access_token') !== null;
        
        // Only try to sync with server if authenticated
        if (isAuthenticated) {
          if (!cart || cart.id === 'local_cart') {
            // Try to fetch server cart first
            try {
              await get().fetchCart();
              console.log('Successfully synced with server cart');
            } catch (error) {
              console.warn('Could not sync with server cart - server may be unavailable');
              // Don't throw error - we'll just keep using the local cart
            }
          }
        } else {
          console.log('User not authenticated, using local cart only');
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);

export default useCartStore;

// Auto-sync cart when user becomes authenticated
import useAuthStore from './authStore';

let unsubscribeCart: (() => void) | undefined;

const setupCartAuthSubscription = () => {
  if (unsubscribeCart) {
    unsubscribeCart();
  }
  
  unsubscribeCart = useAuthStore.subscribe(
    (state) => {
      if (state.isAuthenticated) {
        useCartStore.getState().syncWithServer();
      }
    }
  );
};

setupCartAuthSubscription();