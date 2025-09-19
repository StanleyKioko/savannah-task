import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { useState } from 'react';

export default function OIDCLoginButton() {
  const { loginWithOIDC } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleOIDCLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithOIDC();
      // No need to navigate here as loginWithOIDC will redirect to Keycloak
    } catch (error) {
      setIsLoading(false);
      console.error('OIDC login error:', error);
    }
  };

  return (
    <Button 
      variant="outline"
      className="w-full" 
      onClick={handleOIDCLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        'Sign in with Keycloak'
      )}
    </Button>
  );
}