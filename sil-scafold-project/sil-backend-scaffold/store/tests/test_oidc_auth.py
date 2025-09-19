import os
import time
import pytest
from unittest.mock import patch, MagicMock
from jose import jwt
from django.test import RequestFactory
from rest_framework.exceptions import AuthenticationFailed

from store.auth import OIDCAuthentication
from store.models import Customer

# Test data
TEST_PRIVATE_KEY = """-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
agU6TGVQGq1PoXZ/L4YN2UMHkMm/JDc8QkWCmBbscUk44PxlMWYBBQiOOy3+RRcu
eVzs1UR/5L0JkOR2Hj5WdQXTJFgNkKjMJBJKCJn3L2Qc72gHZcO/eO+kRdpS7M/s
5vlEcvEYRX9ZKoUMxGB6WIoqB/Fv5fDrm5yILTrGRlc1YUXXdqDLhQiJTf6+jn8q
RfA0PIkRAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV
laAidgg/sWqpjXDbXr93otIMLlWsM+X0CYMYMagpOJJUGh4hLDvYlLc4XYBXfHCo
aBTpKs3zaaIgt8UToDeYz7j1DjCIkNfNsRxjEphO/FI5XpwP0XxPSfbTvakj7L5G
eZaYF9EYQ6nEyNpAX1JlO1mUECvnWLC2ACQR3CKFzihkm4rQ0LGIXqMMnvG0RqA6
lXdH/Yh89mBwJLpIgi7unEXmPszjdOcAQnpH2Y+Ens3bBPF0M0OrAl84+O4/2VRG
eLw1Qe5kPVyMpouqA4Ey4kIrRYh4SijMrFixJ2oVlVkCgYEA3B9RAYH5cUwCo8X+
nIzwUrXl/OXpIgLXFzRk+0oXKn7f2DoXuFT/9i4pWBmfGmLqvjlHZPGRbi0ggDWU
rHYuoa6GsMf5+bVfFhTF4SD4xmiY+xRUKbQ8PsIE91RskQfHOWWQ1+fMfBE9Ypsv
/71yKsBxFKplQFdXVD1U16kMi1MCgYEA2WJyO0/Vcf/D8KJ/11lLFs74EsnxQK/i
PCJm1Sg0OjeSMXUFxByU/0PLpWeEvdRB5hjS6mI+cAV1ZjF8xWFNcUSRLTs61fSA
dhBlhnWYkO9j4j2nYgvE0k0/jG4uK0kKCJfPKR1suc+ATXABVbzdZM2YGpD71J6w
z7PkLJVu2AsCgYBWfC0Sx+X+Zhf3IGpVrJYUfc9sMJF7bWsaIo2JBYqrLEgp0vP7
nrJBUrHdmXRmfHnTPZ/19+6C3OEMgYcZ+/Qfu57hsJPk8GY3nNWOWBCiHW5fJzVS
3zNgpKIc7JePZyS/4cWGxTwxjLtJCh5HtS5f20kMR0Qj0G3zR9agkDRpFwKBgQDK
3YQZBVUX+TjQBN3aEQhEm2+y0rKrBsB9JTkPbYxLnA59nUPBW74lHPn6R3TfLQp1
+yLC5jeVhjqUzUbLp4A0FSQPzK9P6HBMYLFGan11DP8w2kY/uT9SFwQpnCyDgPeN
QJR9u7o3NVK6WTXVMnQpCiKjKRLK1vp4rUKKq5KMmwKBgGIjsMHynoORQvUeVhvx
IMqZgBLolRrAK9J4Vk+MlaeKX0tBVD+GaUw4KtE8UXrGnhTD8QVy/8BJNq0tYjdZ
bKjHKeU27HK2xUJyCmOuJeF2flwSfiI7zXLvXx8G0gZQxhks7pN0M+XxPvNOF8fj
e4jkoQxdPMpoe24QMaGjEEjX
-----END PRIVATE KEY-----"""

TEST_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u
+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWWoFOkxl
UBqtT6F2fy+GDdlDB5DJvyQ3PEJFgpgW7HFJOODZYTFmAQUIjjst/kUXLnlc7NVE
f+S9CZDkdh4+VnUF0yRYDZCozCQSSgiZ9y9kHO9oB2XDv3jvpEXaUuzP7Ob5RHLx
GEV/WSqFDMRgeliaKgfxb+Xw65uciC06xkZXNWFF13agy4UIiU3+vo5/KkXwNDyJ
EQIDAQAB
-----END PUBLIC KEY-----"""

TEST_JWKS = {
    "keys": [
        {
            "kty": "RSA",
            "use": "sig",
            "kid": "test-key-id",
            "alg": "RS256",
            "n": "u1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0_IzW7yWR7QkrmBL7jTKEn5u-qKhbwKfBstIs-bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWWoFOkxlUBqtT6F2fy-GDdlDB5DJvyQ3PEJFgpgW7HFJOOD8ZTFmAQUIjjst_kUXLnlc7NVEf-S9CZDkdh4-VnUF0yRYDZCozCQSSgiZ9y9kHO9oB2XDv3jvpEXaUuzP7Ob5RHLxGEV_WSqFDMRgeliaKgfxb-Xw65uciC06xkZXNWFF13agy4UIiU3-vo5_KkXwNDyJEQ",
            "e": "AQAB"
        }
    ]
}

@pytest.fixture
def auth_instance():
    """Create an instance of OIDCAuthentication."""
    return OIDCAuthentication()

@pytest.fixture
def mock_jwks():
    """Mock the JWKS response."""
    with patch('requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = TEST_JWKS
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        yield mock_get

@pytest.fixture
def valid_token():
    """Create a valid JWT token for testing."""
    # Set environment variables for testing
    os.environ['OIDC_ISSUER'] = 'https://test-issuer.example.com'
    os.environ['OIDC_AUDIENCE'] = 'test-audience'
    
    # Generate a token
    payload = {
        'sub': 'test-user-123',
        'given_name': 'Test',
        'family_name': 'User',
        'email': 'test@example.com',
        'phone_number': '+1234567890',
        'iss': 'https://test-issuer.example.com',
        'aud': 'test-audience',
        'exp': int(time.time()) + 3600,  # 1 hour from now
        'iat': int(time.time()),
    }
    token = jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256', headers={'kid': 'test-key-id'})
    return token

@pytest.mark.django_db
def test_valid_token_authentication(auth_instance, mock_jwks, valid_token):
    """Test successful authentication with a valid token."""
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {valid_token}'
    
    # Authenticate
    user, token_out = auth_instance.authenticate(request)
    
    # Verify the user was created and returned
    assert user is not None
    assert isinstance(user, Customer)
    assert user.external_id == 'test-user-123'
    assert user.first_name == 'Test'
    assert user.last_name == 'User'
    assert user.email == 'test@example.com'
    assert user.phone == '+1234567890'
    
    # Verify the token was returned
    assert token_out == valid_token

@pytest.mark.django_db
def test_invalid_audience(auth_instance, mock_jwks, valid_token):
    """Test authentication fails with invalid audience."""
    # Override the audience
    os.environ['OIDC_AUDIENCE'] = 'wrong-audience'
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {valid_token}'
    
    # Authenticate - should fail
    with pytest.raises(AuthenticationFailed):
        auth_instance.authenticate(request)

@pytest.mark.django_db
def test_expired_token(auth_instance, mock_jwks):
    """Test authentication fails with expired token."""
    # Set environment variables for testing
    os.environ['OIDC_ISSUER'] = 'https://test-issuer.example.com'
    os.environ['OIDC_AUDIENCE'] = 'test-audience'
    
    # Generate an expired token
    payload = {
        'sub': 'test-user-123',
        'iss': 'https://test-issuer.example.com',
        'aud': 'test-audience',
        'exp': int(time.time()) - 3600,  
        'iat': int(time.time()) - 7200,
    }
    expired_token = jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256', headers={'kid': 'test-key-id'})
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {expired_token}'
    
    # Authenticate - should fail
    with pytest.raises(AuthenticationFailed):
        auth_instance.authenticate(request)

@pytest.mark.django_db
def test_no_token(auth_instance):
    """Test that no token returns None (other auth methods can try)."""
    factory = RequestFactory()
    request = factory.get('/api/test/')
    
    # No Authorization header
    result = auth_instance.authenticate(request)
    assert result is None
    
    # Authorization header with no Bearer
    request.META['HTTP_AUTHORIZATION'] = 'Basic dXNlcjpwYXNz'
    result = auth_instance.authenticate(request)
    assert result is None

@pytest.mark.django_db
def test_jwks_caching(auth_instance, mock_jwks, valid_token):
    """Test that the JWKS is cached and only fetched once within TTL."""
    # Reduce the cache TTL for testing
    OIDCAuthentication.CACHE_TTL = 1  # 1 second
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {valid_token}'
    
    # First authentication
    auth_instance.authenticate(request)
    
    # Should have fetched JWKS once
    assert mock_jwks.call_count == 1
    
    # Second authentication (should use cache)
    auth_instance.authenticate(request)
    assert mock_jwks.call_count == 1
    
    # Wait for cache to expire
    time.sleep(1.1)
    
    # Third authentication (should fetch again)
    auth_instance.authenticate(request)
    assert mock_jwks.call_count == 2

@pytest.mark.django_db
def test_invalid_signature(auth_instance, mock_jwks):
    """Test authentication fails with invalid signature."""
    # Set environment variables for testing
    os.environ['OIDC_ISSUER'] = 'https://test-issuer.example.com'
    os.environ['OIDC_AUDIENCE'] = 'test-audience'
    
    # Generate a token with different private key 
    different_private_key = """-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDZ1QBzlBLWvMN1
aZaZxgRfqL33s5GYK8zoiMOe6fJSYPAc3vPBn4UYkgXbOCsYJUYrJNQgKZ6zqkwz
n7LJtRxcXgpJKnGh83SzQk1qpDW6+lHfe+RZdXWBSGcgxijD5KL1ZqpbKzHW5zkW
7S1oNYhLYnLrXLJsxJOgcOgGuPLSeFdN97fO6iF1D2vnl1wgpJON39JbMC+nvJUu
7g0XB6Ozv9I1sfZ79Dj+9I80zLxU2YAj1CW/KF3jy7QU/qnzzQkixUk9JTMcBGCE
dseZIqTuhMJQkMkRzoS+FIHa8zNlFR2hSo1CfI8cNFRQgJB0xtKTbOu6jTIrxl0E
O3GcCHhBAgMBAAECggEBAMZNLBoEbJrSeFWGpLTFAKFWRgJGkhYCUXJuDwKw6j0N
7VcgxwpaOzYp4HSeXU4wp7abfQoXMTrEgNNMCRkjeaK2bnrzJKJXEXesHQlYLFxy
zdgOBYn7rN6DS/dEKXNmvHGrfPw/uPJrfkFYLGLkUoqZpDQA3LoZdBvQeqjWYYUK
9mxO+FnOIQN/qb3GYF4SYeA2jw5STLx+JZLCvcPaRi2FvoVeUwSxvRRUmj+uI3WF
WiVvFO5u0gu7c1JrLGAq+BgOlqS8PJJHFqnYyWwVncoQrBmNK3mYIBIn8EQ3X5Sd
QhkPYT2RNe7gAwHErbAZIjKKdm7ZCWWGYYWZlx4A2CkCgYEA8xQdC3FHa4vLpuT1
AJfVbRcZdXGR+oIYpjYsfsK/F4Z5LKvDQjUkKkMqDu7t2M9Gw9HWQbhN+6YcY1nG
jcpcU5qvGZEA1EHF9bTUUkGWRzffiIAu5aWGfLjGlPFQwPnxzG3FH2d+QZCwscVj
FgOZ1Tsr9QGaUQM/Zsl1kJ1zFm8CgYEA5SaJFaFyBIlCyB2JEkL2tSbsQvQmHbdG
h+t4PqZu1BQXu9T9Q1VVHx1w4Sj/BtQ/LIbCxzOVuUzC9RXZm68nWzTkRaQDLw3I
aXHPnQ6AXjELTgATXnhQDI7vjWiNa48Eu/MQK/OQJr1VTYXFNBNpwvg6QHRYy9ug
1ggbz/h8K+8CgYEAwTM9aFpZrGtjlHEi0D8g+8LNsZCBVLsGM5/CSL4Jx5FgIRXU
yoqDO6qdQkKYyWdAf+L5rhAjYDgGLXTyQnTmAj+cdpgOGsC2yIGHZFiyeKrXRYi/
WK1mYZgn7G5eVkJdSmZU+5jM1JH0WURwpBCU4IayljYJMrMDH3OUUjVf0tsCgYEA
wTy9PLHpTX3a78xygBq3QdEHloSH0dHYzXZ8Dg2Tsv6zZzEGdKEFPeRKmCixJRUm
w6pZ6HnUkT0qhVTwXeKNpLd0/7eYdNsk2S6A1cG8NpLI7p0b5SkdNbxmPsfpxPZX
FwEDZR9VWNm59/GXWEtzfEz71SCTHQKUNSzNcTCkN9UCgYAKhOtkpR/zRpHQiYzA
qoxkrqGKP8gJtoJsLi37FayY8F0bUw6hV+KgFxkLnp6fUCCJX4gN3eSRDQBHnamu
6wmQQN3D7GKIj3QWP4IkLpmNwW4GgJ3m7CCCSg+r5FCzVvz4PuXFXYLUVd0/hT2A
wTpKXBNTncKRFCkwPCm2j7v9fw==
-----END PRIVATE KEY-----"""
    
    payload = {
        'sub': 'test-user-123',
        'iss': 'https://test-issuer.example.com',
        'aud': 'test-audience',
        'exp': int(time.time()) + 3600,
        'iat': int(time.time()),
    }
    invalid_token = jwt.encode(payload, different_private_key, algorithm='RS256', headers={'kid': 'test-key-id'})
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {invalid_token}'
    
    # Authenticate - should fail
    with pytest.raises(AuthenticationFailed):
        auth_instance.authenticate(request)

@pytest.mark.django_db
def test_missing_kid(auth_instance, mock_jwks):
    """Test authentication fails when token has no kid."""
    # Set environment variables for testing
    os.environ['OIDC_ISSUER'] = 'https://test-issuer.example.com'
    os.environ['OIDC_AUDIENCE'] = 'test-audience'
    
    # Generate a token without kid
    payload = {
        'sub': 'test-user-123',
        'iss': 'https://test-issuer.example.com',
        'aud': 'test-audience',
        'exp': int(time.time()) + 3600,
        'iat': int(time.time()),
    }
    no_kid_token = jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256')  # No kid in header
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {no_kid_token}'
    
    # Authenticate - should fail
    with pytest.raises(AuthenticationFailed):
        auth_instance.authenticate(request)

@pytest.mark.django_db
def test_kid_not_found(auth_instance, mock_jwks):
    """Test authentication fails when kid is not found in JWKS."""
    # Set environment variables for testing
    os.environ['OIDC_ISSUER'] = 'https://test-issuer.example.com'
    os.environ['OIDC_AUDIENCE'] = 'test-audience'
    
    # Generate a token with unknown kid
    payload = {
        'sub': 'test-user-123',
        'iss': 'https://test-issuer.example.com',
        'aud': 'test-audience',
        'exp': int(time.time()) + 3600,
        'iat': int(time.time()),
    }
    unknown_kid_token = jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256', headers={'kid': 'unknown-key-id'})
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {unknown_kid_token}'
    
    # Authenticate - should fail
    with pytest.raises(AuthenticationFailed):
        auth_instance.authenticate(request)

@pytest.mark.django_db
def test_user_profile_update(auth_instance, mock_jwks):
    """Test that user profile is updated when token has new information."""
    # Set environment variables for testing
    os.environ['OIDC_ISSUER'] = 'https://test-issuer.example.com'
    os.environ['OIDC_AUDIENCE'] = 'test-audience'
    
    # Create a user first
    customer = Customer.objects.create(
        external_id='test-user-123',
        first_name='Old',
        last_name='Name',
        email='old@example.com',
        phone='+9876543210'
    )
    
    # Generate a token with updated profile
    payload = {
        'sub': 'test-user-123',
        'given_name': 'New',
        'family_name': 'Person',
        'email': 'new@example.com',
        'phone_number': '+1234567890',
        'iss': 'https://test-issuer.example.com',
        'aud': 'test-audience',
        'exp': int(time.time()) + 3600,
        'iat': int(time.time()),
    }
    token = jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256', headers={'kid': 'test-key-id'})
    
    # Create a request with the token
    factory = RequestFactory()
    request = factory.get('/api/test/')
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    
    # Authenticate
    user, _ = auth_instance.authenticate(request)
    
    # Verify the user was updated
    assert user.external_id == 'test-user-123'
    assert user.first_name == 'New'
    assert user.last_name == 'Person'
    assert user.email == 'new@example.com'
    assert user.phone == '+1234567890'