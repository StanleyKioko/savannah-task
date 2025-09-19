import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink, Loader2 } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { keycloakConfig } from '@/lib/api';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  // Don't auto-redirect - let the user click the button
  
  const redirectToKeycloakRegistration = async () => {
    try {
      // Generate state parameter for CSRF protection
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('oidc_state', state);
      
      // Try the direct registration URL (kc_action=register triggers the registration form)
      const registrationUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth?client_id=${keycloakConfig.clientId}&redirect_uri=${encodeURIComponent(keycloakConfig.redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${state}&kc_action=register`;
      
      // Redirect in the same tab to ensure proper callback handling
      window.location.href = registrationUrl;
    } catch (error) {
      console.error('Failed to redirect to registration:', error);
      setError('Could not open registration page. Please try again later.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          You can create a new account through our secure authentication system.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        {isLoading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              Processing...
            </p>
          </>
        ) : (
          <>
            {error ? (
              <Alert className="mb-6">
                <AlertTitle>Registration Information</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6 w-full">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Registration Options:</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>Create account directly in Keycloak</li>
                    <li>Use your existing account if you already have one</li>
                    <li>After registration, return to this app to log in</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={redirectToKeycloakRegistration}
                  className="w-full"
                >
                  Continue to Registration
                </Button>
                
                <div className="text-sm text-center text-muted-foreground">
                  <p className="mb-2">Existing test user credentials:</p>
                  <p><strong>Username:</strong> testuser123</p>
                  <p><strong>Password:</strong> password123</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto" 
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}