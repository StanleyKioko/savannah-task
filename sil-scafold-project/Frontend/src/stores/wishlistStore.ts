import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wishlist, Product } from '@/types';
import { apiClient } from '@/lib/api';

interface WishlistState {
  // State
  wishlist: Wishlist | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWishlist: () => Promise<void>;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  
  // Local actions (for offline functionality)
  addToWishlistLocal: (product: Product) => void;
  removeFromWishlistLocal: (productId: string) => void;
  clearWishlistLocal: () => void;
  
  // Utilities
  getItemCount: () => number;
  clearError: () => void;
  syncWithServer: () => Promise<void>;
}

const WISHLIST_API_ENDPOINTS = {
  wishlist: '/wishlist/',
  addItem: '/wishlist/',
  removeItem: (productId: string) => `/wishlist/remove/${productId}/`,
  clear: '/wishlist/clear/',
};

const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      // Initial state
      wishlist: null,
      isLoading: false,
      error: null,

      // Fetch wishlist from server
      fetchWishlist: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const wishlist = await apiClient.get<Wishlist>(WISHLIST_API_ENDPOINTS.wishlist);
          set({ wishlist, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch wishlist',
          });
          throw error;
        }
      },

      // Add product to wishlist (server)
      addToWishlist: async (product: Product) => {
        set({ isLoading: true, error: null });
        
        try {
          const payload = { product_id: product.id };
          const wishlist = await apiClient.post<Wishlist>(WISHLIST_API_ENDPOINTS.addItem, payload);
          set({ wishlist, isLoading: false });
        } catch (error: any) {
          // Fallback to local add if server fails
          console.warn('Failed to add item to server wishlist, adding locally:', error);
          get().addToWishlistLocal(product);
          
          set({
            isLoading: false,
            error: 'Added to wishlist locally. Will sync when online.',
          });
        }
      },

      // Remove product from wishlist (server)
      removeFromWishlist: async (productId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const wishlist = await apiClient.delete<Wishlist>(
            WISHLIST_API_ENDPOINTS.removeItem(productId)
          );
          set({ wishlist, isLoading: false });
        } catch (error: any) {
          // Fallback to local removal
          get().removeFromWishlistLocal(productId);
          
          set({
            isLoading: false,
            error: 'Removed locally. Will sync when online.',
          });
        }
      },

      // Clear entire wishlist (server)
      clearWishlist: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await apiClient.delete(WISHLIST_API_ENDPOINTS.clear);
          set({ wishlist: null, isLoading: false });
        } catch (error: any) {
          // Fallback to local clear
          get().clearWishlistLocal();
          
          set({
            isLoading: false,
            error: 'Cleared locally. Will sync when online.',
          });
        }
      },

      // Check if product is in wishlist
      isInWishlist: (productId: string): boolean => {
        const { wishlist } = get();
        if (!wishlist) return false;
        return wishlist.products.some(product => product.id === productId);
      },

      // Add product to wishlist (local)
      addToWishlistLocal: (product: Product) => {
        const { wishlist } = get();
        
        if (!wishlist) {
          // Create new wishlist
          set({
            wishlist: {
              id: 'local_wishlist',
              user: 'local_user',
              products: [product],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          });
        } else {
          // Check if product is already in wishlist
          const productExists = wishlist.products.some(p => p.id === product.id);
          
          if (!productExists) {
            set({
              wishlist: {
                ...wishlist,
                products: [...wishlist.products, product],
                updated_at: new Date().toISOString(),
              }
            });
          }
        }
      },

      // Remove product from wishlist (local)
      removeFromWishlistLocal: (productId: string) => {
        const { wishlist } = get();
        
        if (wishlist) {
          set({
            wishlist: {
              ...wishlist,
              products: wishlist.products.filter(product => product.id !== productId),
              updated_at: new Date().toISOString(),
            }
          });
        }
      },

      // Clear wishlist (local)
      clearWishlistLocal: () => {
        set({ wishlist: null });
      },

      // Get total number of items in wishlist
      getItemCount: (): number => {
        const { wishlist } = get();
        return wishlist ? wishlist.products.length : 0;
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Sync local wishlist with server
      syncWithServer: async () => {
        const { wishlist } = get();
        
        if (!wishlist || wishlist.id === 'local_wishlist') {
          // If we have a local wishlist, sync it with the server
          if (wishlist) {
            try {
              for (const product of wishlist.products) {
                await get().addToWishlist(product);
              }
              // Clear local wishlist after successful sync
              get().clearWishlistLocal();
            } catch (error) {
              console.error('Failed to sync wishlist with server:', error);
            }
          }
          
          // Fetch latest wishlist from server
          await get().fetchWishlist();
        }
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        wishlist: state.wishlist,
      }),
    }
  )
);

export default useWishlistStore;

// Auto-sync with server when store is created (if user is authenticated)
const initializeWishlist = async () => {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      await useWishlistStore.getState().syncWithServer();
    } catch (error) {
      console.warn('Failed to initialize wishlist:', error);
    }
  }
};

// Initialize wishlist on store creation
initializeWishlist();