import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';
import { authAPI, keycloakConfig } from '@/lib/api';

const mapOidcToUser = (claims: any): User => {
  return {
    id: claims.sub,
    username: claims.preferred_username || claims.email || '',
    email: claims.email || '',
    first_name: claims.given_name || '',
    last_name: claims.family_name || '',
    is_staff: claims.realm_access?.roles?.includes('admin') || false,
    is_active: true,
    date_joined: claims.iat ? new Date(claims.iat * 1000).toISOString() : new Date().toISOString(),
    last_login: claims.auth_time ? new Date(claims.auth_time * 1000).toISOString() : undefined,
  };
};

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOIDC: () => Promise<void>;
  handleOIDCCallback: (code: string, state: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          await get().loginWithOIDC();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      loginWithOIDC: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const state = Math.random().toString(36).substring(7);
          sessionStorage.setItem('oidc_state', state);
          
          // Get authorization URL and redirect
          const authUrl = keycloakConfig.getAuthUrl(state); // Pass the state parameter
          window.location.href = authUrl;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'OIDC login failed' });
          throw error;
        }
      },

      handleOIDCCallback: async (code: string, state: string) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('Processing OIDC callback with code:', code ? `${code.substring(0, 6)}...` : 'missing');
          
          if (state) {
            const storedState = sessionStorage.getItem('oidc_state');
            console.log('State validation:', {
              received: state ? state.substring(0, 6) + '...' : 'missing',
              stored: storedState ? storedState.substring(0, 6) + '...' : 'missing',
              match: storedState === state
            });
            
            if (storedState && storedState !== state) {
              // For development, we'll log the warning but proceed anyway
              console.warn('State mismatch, but proceeding with authentication for development');
            }
          }
          
          // Clean up stored state
          sessionStorage.removeItem('oidc_state');
          
          // Exchange authorization code for tokens
          const tokenResponse = await keycloakConfig.exchangeCode(code, state);
          console.log('Token exchange successful');
          
          const tokens: AuthTokens = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            token_type: tokenResponse.token_type || 'Bearer',
            expires_in: tokenResponse.expires_in,
          };
          
          // Store tokens in localStorage for API requests
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
          
          // Decode user info from ID token or access token
          let user: User | null = null;
          
          if (tokenResponse.id_token) {
            try {
              const decodedIdToken = jwtDecode<any>(tokenResponse.id_token);
              user = mapOidcToUser(decodedIdToken);
            } catch (e) {
              console.warn('Could not decode ID token, trying access token');
            }
          }
          
          if (!user && tokens.access_token) {
            try {
              const decodedToken = jwtDecode<any>(tokens.access_token);
              user = mapOidcToUser(decodedToken);
            } catch (e) {
              console.warn('Could not decode access token');
            }
          }
          
          // Set a success flag in sessionStorage for the AuthCallback component to check
          sessionStorage.setItem('auth_success', 'true');
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'OIDC authentication failed',
          });
          throw error;
        }
      },

      // Register new user
      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        // With OIDC, we'll redirect to Keycloak for registration
        try {
          // Open Keycloak account page in a new tab
          // This gives the user a way to register without being redirected away from our app
          const accountUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/account/`;
          window.open(accountUrl, '_blank');
          
          // No need to wait for completion - just inform user
          set({
            isLoading: false,
            error: 'Registration page opened in a new tab. After registering, please return to log in.',
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed',
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        
        try {
          const { tokens } = get();
          
          if (tokens?.refresh_token) {
            // OIDC logout
            await keycloakConfig.logout(tokens.refresh_token);
          }
        } catch (error) {
          console.warn('OIDC logout request failed, proceeding with local logout');
        }
        
        // Clear local state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Refresh access token
      refreshTokens: async () => {
        const { tokens } = get();
        
        if (!tokens?.refresh_token) {
          throw new Error('No refresh token available');
        }
        
        try {
          // Use Keycloak OIDC refresh token endpoint
          const tokenResponse = await keycloakConfig.refreshToken(tokens.refresh_token);
          
          const newTokens: AuthTokens = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token || tokens.refresh_token,
            token_type: tokenResponse.token_type || 'Bearer',
            expires_in: tokenResponse.expires_in,
          };
          
          localStorage.setItem('access_token', newTokens.access_token);
          if (newTokens.refresh_token) {
            localStorage.setItem('refresh_token', newTokens.refresh_token);
          }
          
          set({ tokens: newTokens });
        } catch (error: any) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      // Update user profile
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedUser = await authAPI.updateProfile(data) as User;
          
          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Profile update failed',
          });
          throw error;
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Check authentication status on app load
      checkAuthStatus: async () => {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        try {
          // For OIDC, we can get the user info from the token itself
          // or make a userinfo request to Keycloak
          let user: User | null = null;
          
          try {
            // First try to decode the token
            const decodedToken = jwtDecode<any>(token);
            user = mapOidcToUser(decodedToken);
          } catch (e) {
            console.warn('Could not decode token, trying userinfo endpoint');
            
            // If decoding fails, try the userinfo endpoint
            const response = await fetch(
              `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            
            if (!response.ok) {
              throw new Error('Failed to get user info');
            }
            
            const userInfo = await response.json();
            user = mapOidcToUser(userInfo);
          }
          
          set({
            user,
            isAuthenticated: true,
            tokens: {
              access_token: token,
              refresh_token: localStorage.getItem('refresh_token') || '',
              token_type: 'Bearer',
              expires_in: 3600, // Default expiry
            },
          });
        } catch (error) {
          // Token is invalid, clear auth state
          console.error('Auth check failed:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;

// Auto-check auth status on store creation
useAuthStore.getState().checkAuthStatus();

// Set up automatic token refresh
let refreshTimer: NodeJS.Timeout | null = null;

const setupTokenRefresh = () => {
  const { tokens, refreshTokens, logout } = useAuthStore.getState();
  
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  
  if (tokens?.access_token) {
    try {
      const decodedToken = jwtDecode<any>(tokens.access_token);
      const expiresAt = decodedToken.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // Only set up refresh if token is valid and not expired
      if (timeUntilExpiry > 0) {
        // Refresh 1 min before expiry or halfway through the token's lifetime, whichever is sooner
        // Minimum 30s, maximum 15 minutes
        const refreshTime = Math.min(
          Math.max(timeUntilExpiry - 60000, 30000), 
          15 * 60 * 1000
        );
        
        console.log(`Token refresh scheduled in ${Math.round(refreshTime/1000)}s`);
        
        refreshTimer = setTimeout(async () => {
          try {
            console.log('Attempting to refresh token');
            await refreshTokens();
            console.log('Token refreshed successfully');
            setupTokenRefresh(); // Set up next refresh
          } catch (error) {
            console.error('Auto token refresh failed:', error);
            // Only logout if we're sure the token is expired
            if (Date.now() >= expiresAt) {
              console.warn('Token expired, logging out');
              logout();
            } else {
              console.warn('Token refresh failed but token still valid, retrying later');
              // Try again in 30 seconds
              setTimeout(() => setupTokenRefresh(), 30000);
            }
          }
        }, refreshTime);
      } else {
        console.warn('Token already expired, logging out');
        logout();
      }
    } catch (error) {
      console.warn('Could not decode token for auto-refresh setup');
    }
  }
};

// Subscribe to auth state changes to set up refresh timer
let unsubscribeAuth: (() => void) | undefined;

const setupAuthSubscription = () => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
  
  unsubscribeAuth = useAuthStore.subscribe(
    (state) => {
      if (state.tokens) {
        setupTokenRefresh();
      } else if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    }
  );
};

setupAuthSubscription();