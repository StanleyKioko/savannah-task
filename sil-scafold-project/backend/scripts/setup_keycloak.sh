#!/bin/bash
# This script sets up a development environment with Keycloak for OIDC testing

echo "==========================================="
echo "  Setting up Keycloak for OIDC Auth       "
echo "==========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Keycloak is already running
if [ "$(docker ps -q -f name=keycloak)" ]; then
  echo "Keycloak is already running. Stopping and removing container..."
  docker stop keycloak
  docker rm keycloak
fi

# Start Keycloak container
echo "Starting Keycloak container for OIDC testing..."
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:21.1.1 \
  start-dev

echo "Waiting for Keycloak to start..."
sleep 10

# Set environment variables for API calls
KEYCLOAK_URL="http://localhost:8080"
ADMIN_TOKEN_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password")

ADMIN_TOKEN=$(echo $ADMIN_TOKEN_RESPONSE | sed 's/.*"access_token":"\([^"]*\)".*/\1/')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Error: Failed to get admin token"
  echo "Response: $ADMIN_TOKEN_RESPONSE"
  echo ""
  echo "Manual setup instructions:"
  echo "1. Go to http://localhost:8080/admin/ and log in with admin/admin"
  echo "2. Create a new realm (e.g., 'sil')"
  echo "3. Create a new client (e.g., 'sil-backend')"
  echo "   - Set Access Type to 'confidential'"
  echo "   - Enable 'Service Accounts Enabled'"
  echo "   - Set Valid Redirect URIs to 'http://localhost:8000/*'"
  echo "4. After saving, go to the 'Credentials' tab and copy the client secret"
  exit 1
fi

echo "Creating 'sil' realm..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "sil",
    "enabled": true,
    "accessTokenLifespan": 1800
  }'

echo "Creating 'sil-backend' client..."
CLIENT_ID_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/sil/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "sil-backend",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "sil-backend-secret",
    "redirectUris": ["http://localhost:8000/*"],
    "webOrigins": ["*"],
    "directAccessGrantsEnabled": true,
    "serviceAccountsEnabled": true,
    "publicClient": false,
    "protocol": "openid-connect"
  }' \
  -v 2>&1 | grep "Location:" | sed -e 's/.*\/\([^\/]*\)$/\1/')

echo "Creating test user..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms/sil/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [
      {
        "type": "password",
        "value": "password",
        "temporary": false
      }
    ],
    "attributes": {
      "phone_number": ["+1234567890"]
    }
  }'

# Set environment variables
echo ""
echo "==========================================="
echo "  Keycloak Setup Complete                  "
echo "==========================================="
echo ""
echo "Update your .env file with the following values:"
echo ""
echo "OIDC_ISSUER=http://localhost:8080/realms/sil"
echo "OIDC_AUDIENCE=sil-backend"
echo "OIDC_JWKS_URL=http://localhost:8080/realms/sil/protocol/openid-connect/certs"
echo ""
echo "To get a test token, run:"
echo ""
echo "curl -X POST \\"
echo "  http://localhost:8080/realms/sil/protocol/openid-connect/token \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"client_id=sil-backend\" \\"
echo "  -d \"client_secret=sil-backend-secret\" \\"
echo "  -d \"grant_type=password\" \\"
echo "  -d \"username=testuser\" \\"
echo "  -d \"password=password\""
echo ""
echo "Keycloak Admin Console: http://localhost:8080/admin"
echo "Username: admin"
echo "Password: admin"
echo ""
echo "Test User:"
echo "Username: testuser"
echo "Password: password"
echo "==========================================="

# To stop Keycloak: docker stop keycloak
# To remove Keycloak: docker rm keycloak