import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, checkAuthStatus, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Verify the authentication status when the component mounts
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the current location the user was trying to access
    sessionStorage.setItem('auth_redirect', location.pathname);
    console.log('User not authenticated. Redirecting to login from:', location.pathname);
    
    // For debugging - check if there are tokens in localStorage that might be expired
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken || refreshToken) {
      console.warn('Tokens found but user not authenticated. Tokens may be expired or invalid.');
    }
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}