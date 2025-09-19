import os
import time
import logging
import requests
from datetime import datetime
from rest_framework import authentication, exceptions
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
from .models import Customer

logger = logging.getLogger(__name__)

class OIDCAuthentication(authentication.BaseAuthentication):
    """
    Robust OIDC Authentication for DRF.
    Validates JWT tokens from Authorization header.
    Maps OIDC subjects to Customer instances.
    
    Keycloak Configuration (For Local Testing):
    ------------------------------------------
    1. Use scripts/setup_keycloak.sh to configure a local Keycloak instance
    2. The script will:
       - Start a Keycloak container if needed
       - Create a realm named 'sil'
       - Create a client 'sil-backend' with proper redirect URIs
       - Create a test user 'testuser' with password 'password'
       - Set up proper CORS and client scopes
    3. Environment variables needed:
       - OIDC_ISSUER: http://localhost:8080/realms/sil
       - OIDC_AUDIENCE: sil-backend
       - OIDC_JWKS_URL: http://localhost:8080/realms/sil/protocol/openid-connect/certs
    
    Token Acquisition Example:
    ------------------------
    curl -X POST \\
      http://localhost:8080/realms/sil/protocol/openid-connect/token \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      -d "client_id=sil-backend" \\
      -d "client_secret=sil-backend-secret" \\
      -d "grant_type=password" \\
      -d "username=testuser" \\
      -d "password=password"
    """
    
    # Cache for JWKS to avoid repeated fetching
    _jwks_cache = {
        'keys': None,
        'last_updated': 0
    }
    
    # Cache refresh interval 
    CACHE_TTL = 600
    
    def authenticate(self, request):
        """Authenticate the request by validating the JWT token."""
        auth_header = authentication.get_authorization_header(request).split()
        
        if not auth_header or auth_header[0].lower() != b'bearer':
            return None
            
        if len(auth_header) != 2:
            raise exceptions.AuthenticationFailed('Invalid token header. No credentials provided.')
            
        token = auth_header[1].decode()
        
        try:
            payload = self.validate_token(token)
            
            sub = payload.get('sub')
            if not sub:
                raise exceptions.AuthenticationFailed('Token missing sub claim')
                
            customer, created = Customer.objects.get_or_create(
                external_id=sub,
                defaults={
                    'first_name': payload.get('given_name', ''),
                    'last_name': payload.get('family_name', ''),
                    'email': payload.get('email', ''),
                    'phone': payload.get('phone_number', ''),
                }
            )
            
            if not created:
                update_fields = []
                if payload.get('given_name') and customer.first_name != payload.get('given_name'):
                    customer.first_name = payload.get('given_name')
                    update_fields.append('first_name')
                if payload.get('family_name') and customer.last_name != payload.get('family_name'):
                    customer.last_name = payload.get('family_name')
                    update_fields.append('last_name')
                if payload.get('email') and customer.email != payload.get('email'):
                    customer.email = payload.get('email')
                    update_fields.append('email')
                if payload.get('phone_number') and customer.phone != payload.get('phone_number'):
                    customer.phone = payload.get('phone_number')
                    update_fields.append('phone')
                
                if update_fields:
                    customer.save(update_fields=update_fields)
            
            return (customer, token)
            
        except JWTError as e:
            logger.warning(f"JWT validation error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except requests.RequestException as e:
            logger.error(f"JWKS fetch error: {str(e)}")
            raise exceptions.AuthenticationFailed('Error fetching JWKS')
        except Exception as e:
            logger.exception(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')
    
    def get_jwks(self):
        """
        Fetch and cache the JWKS from the OIDC provider.
        Refreshes cache if older than CACHE_TTL or if requested.
        """
        now = time.time()
        
        if (self._jwks_cache['keys'] is None or 
            now - self._jwks_cache['last_updated'] > self.CACHE_TTL):
            
            jwks_url = os.getenv('OIDC_JWKS_URL')
            if not jwks_url:
                issuer = os.getenv('OIDC_ISSUER')
                if not issuer:
                    raise exceptions.AuthenticationFailed('OIDC_ISSUER not configured')
                
                if '/.well-known/' not in issuer:
                    if issuer.endswith('/'):
                        jwks_url = f"{issuer}.well-known/jwks.json"
                    else:
                        jwks_url = f"{issuer}/.well-known/jwks.json"
                else:
                    jwks_url = issuer
            
            try:
                response = requests.get(jwks_url, timeout=10)
                response.raise_for_status()
                
                jwks = response.json()
                if not jwks.get('keys'):
                    raise exceptions.AuthenticationFailed('Invalid JWKS format')
                    
                self._jwks_cache = {
                    'keys': jwks['keys'],
                    'last_updated': now
                }
                
                logger.info(f"JWKS cache refreshed from {jwks_url}")
            except requests.RequestException as e:
                if self._jwks_cache['keys'] is not None:
                    logger.warning(f"Failed to refresh JWKS, using cached keys: {str(e)}")
                else:
                    raise
            
        return self._jwks_cache['keys']
    
    def get_key_for_token(self, token):
        """
        Extract the key ID from the token header and find the matching key in JWKS.
        If the key is not found, refresh the JWKS cache and try again.
        """
        try:
            headers = jwt.get_unverified_header(token)
            kid = headers.get('kid')
            if not kid:
                raise exceptions.AuthenticationFailed('Token missing key ID (kid)')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid token header: {str(e)}')
        
        keys = self.get_jwks()
        for key_data in keys:
            if key_data.get('kid') == kid:
                try:
                    return jwk.construct(key_data)
                except Exception as e:
                    raise exceptions.AuthenticationFailed(f'Failed to construct key: {str(e)}')
        
        self._jwks_cache['last_updated'] = 0  
        keys = self.get_jwks()
        for key_data in keys:
            if key_data.get('kid') == kid:
                try:
                    return jwk.construct(key_data)
                except Exception as e:
                    raise exceptions.AuthenticationFailed(f'Failed to construct key: {str(e)}')
        
        raise exceptions.AuthenticationFailed(f'Key ID {kid} not found in JWKS')
    
    def validate_token(self, token):
        """
        Validate the JWT token.
        Verifies signature, issuer, audience, and expiration.
        """
        issuer = os.getenv('OIDC_ISSUER')
        audience = os.getenv('OIDC_AUDIENCE')
        
        if not issuer or not audience:
            raise exceptions.AuthenticationFailed('OIDC configuration incomplete')
        
        key = self.get_key_for_token(token)
        
        try:
            payload = jwt.decode(
                token, 
                key,
                algorithms=['RS256'],
                options={
                    'verify_signature': True,
                    'verify_aud': True,
                    'verify_iat': True,
                    'verify_exp': True,
                    'verify_nbf': True,
                    'verify_iss': True,
                    'verify_sub': True,
                    'verify_jti': True,
                    'verify_at_hash': False,
                },
                audience=audience,
                issuer=issuer
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.JWTClaimsError as e:
            if 'audience' in str(e).lower():
                raise exceptions.AuthenticationFailed(f'Token audience invalid. Expected: {audience}')
            elif 'issuer' in str(e).lower():
                raise exceptions.AuthenticationFailed(f'Token issuer invalid. Expected: {issuer}')
            else:
                raise exceptions.AuthenticationFailed(f'Token claims verification failed: {str(e)}')
        except JWTError as e:
            raise exceptions.AuthenticationFailed(f'Token validation failed: {str(e)}')
