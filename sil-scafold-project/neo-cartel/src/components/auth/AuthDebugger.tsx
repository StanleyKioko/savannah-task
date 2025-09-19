// Save this as src/components/auth/AuthDebugger.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { keycloakConfig } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { jwtDecode } from 'jwt-decode';

// Helper function to pretty print JSON
const prettyPrint = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
};

// Token expiration helper
const isTokenExpired = (token: string) => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export default function AuthDebugger() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [decodedAccess, setDecodedAccess] = useState<any>(null);
  const [decodedRefresh, setDecodedRefresh] = useState<any>(null);
  const [keycloakStatus, setKeycloakStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [corsStatus, setCorsStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    // Check tokens on mount
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');

    setAccessToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);

    if (storedAccessToken) {
      try {
        setDecodedAccess(jwtDecode(storedAccessToken));
      } catch (e) {
        console.error('Failed to decode access token:', e);
      }
    }

    if (storedRefreshToken) {
      try {
        setDecodedRefresh(jwtDecode(storedRefreshToken));
      } catch (e) {
        console.error('Failed to decode refresh token:', e);
      }
    }

    // Check Keycloak availability
    fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}/.well-known/openid-configuration`)
      .then(response => {
        if (response.ok) {
          setKeycloakStatus('available');
        } else {
          setKeycloakStatus('unavailable');
        }
      })
      .catch(() => {
        setKeycloakStatus('unavailable');
      });

    // Check CORS
    fetch('http://localhost:8000/api/products/', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
      },
    })
      .then(response => {
        setCorsStatus(response.ok ? 'ok' : 'error');
      })
      .catch(() => {
        setCorsStatus('error');
      });
  }, []);

  const testRedirect = () => {
    const redirectUrl = keycloakConfig.getAuthUrl();
    window.open(redirectUrl, '_blank');
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
        <CardDescription>
          Tool to help diagnose authentication issues with Keycloak
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <span className="text-sm font-medium">Keycloak Status</span>
            {keycloakStatus === 'checking' ? (
              <Badge variant="outline">Checking...</Badge>
            ) : keycloakStatus === 'available' ? (
              <Badge variant="success" className="bg-green-500">Available</Badge>
            ) : (
              <Badge variant="destructive">Unavailable</Badge>
            )}
          </div>
          
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <span className="text-sm font-medium">CORS Status</span>
            {corsStatus === 'checking' ? (
              <Badge variant="outline">Checking...</Badge>
            ) : corsStatus === 'ok' ? (
              <Badge variant="success" className="bg-green-500">OK</Badge>
            ) : (
              <Badge variant="destructive">Error</Badge>
            )}
          </div>
          
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <span className="text-sm font-medium">Local Storage</span>
            <Badge variant={typeof localStorage !== 'undefined' ? 'success' : 'destructive'} 
              className={typeof localStorage !== 'undefined' ? 'bg-green-500' : ''}>
              {typeof localStorage !== 'undefined' ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
        </div>

        {/* Configuration */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="config">
            <AccordionTrigger>Keycloak Configuration</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {prettyPrint({
                  url: keycloakConfig.url,
                  realm: keycloakConfig.realm,
                  clientId: keycloakConfig.clientId,
                  redirectUri: keycloakConfig.redirectUri,
                })}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Token Information */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="tokens">
            <AccordionTrigger>
              Tokens 
              {accessToken && (
                <Badge variant={isTokenExpired(accessToken) ? 'destructive' : 'outline'} className="ml-2">
                  {isTokenExpired(accessToken) ? 'Expired' : 'Valid'}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Access Token</h4>
                  {accessToken ? (
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                      {prettyPrint(decodedAccess)}
                    </pre>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>No Access Token</AlertTitle>
                      <AlertDescription>
                        No access token found in localStorage.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Refresh Token</h4>
                  {refreshToken ? (
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                      {prettyPrint(decodedRefresh)}
                    </pre>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>No Refresh Token</AlertTitle>
                      <AlertDescription>
                        No refresh token found in localStorage.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={testRedirect}>
            Test Keycloak Redirect
          </Button>
          
          <Button variant="destructive" onClick={clearTokens}>
            Clear Tokens & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}