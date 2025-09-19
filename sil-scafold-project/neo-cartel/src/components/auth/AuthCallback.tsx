import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useAuthStore from '@/stores/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOIDCCallback, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code and state from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Enhanced debugging
        console.log('Auth Callback Details:', {
          url: window.location.href,
          code: code ? `${code.substring(0, 6)}...` : 'missing',
          state: state ? `${state.substring(0, 6)}...` : 'missing',
          error,
          errorDescription,
          timestamp: new Date().toISOString(),
          allParams: Object.fromEntries(params.entries())
        });

        // Handle error responses from OIDC provider
        if (error) {
          throw new Error(errorDescription || `Authentication error: ${error}`);
        }

        if (!code) {
          throw new Error('Missing authorization code from authentication provider');
        }

        // Process the callback with whatever parameters we have
        // For development, we'll make state optional
        console.log(`Proceeding with code exchange (state validation ${state ? 'enabled' : 'disabled'})`);
        await handleOIDCCallback(code, state || '');
        
        // Get the originally requested URL or default to home
        const from = sessionStorage.getItem('auth_redirect') || '/';
        sessionStorage.removeItem('auth_redirect'); // Clean up
        
        setProcessing(false);
        navigate(from, { replace: true });
        
        // Show debug info
        console.log('Authentication successful! Redirecting to:', from);
      } catch (err: any) {
        console.error('Authentication callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        setProcessing(false);
        
        // Development helper - add a link to the auth debug page
        console.info('Visit /auth/debug to inspect authentication state');
      }
    };

    handleCallback();
  }, [location, handleOIDCCallback, navigate]);

  // If already authenticated and no errors, redirect to home
  useEffect(() => {
    if (isAuthenticated && !error && !processing) {
      // Check for the success flag set by the handleOIDCCallback function
      const authSuccess = sessionStorage.getItem('auth_success') === 'true';
      
      if (authSuccess) {
        // Clear the success flag
        sessionStorage.removeItem('auth_success');
        
        // Get the originally requested URL or default to home
        const from = sessionStorage.getItem('auth_redirect') || '/';
        console.log('Authentication successful, redirecting to:', from);
        
        // Redirect with a slight delay to ensure state updates are complete
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, error, processing, navigate]);

  return (
    <>
      <Helmet>
        <title>Completing Sign In - EStore</title>
        <meta name="description" content="Completing your authentication process." />
      </Helmet>

      <div className="container py-12">
        <div className="max-w-md mx-auto">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription>
                <p className="mb-4">{error}</p>
                
                {/* Show more detailed troubleshooting for development */}
                <div className="mb-6 text-sm">
                  <p className="font-medium mb-2">Common causes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Invalid or expired authorization code</li>
                    <li>CORS issues when contacting Keycloak token endpoint</li>
                    <li>Redirect URI mismatch between requests</li>
                    <li>Client credentials issue in Keycloak</li>
                  </ul>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Return to login
                  </button>
                  <button
                    onClick={() => navigate('/auth/debug')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Open Auth Debugger
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-xl">Completing authentication...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we sign you in.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}