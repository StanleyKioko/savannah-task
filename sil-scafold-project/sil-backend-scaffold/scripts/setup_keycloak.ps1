# PowerShell script for setting up Keycloak on Windows
# This is the Windows equivalent of setup_keycloak.sh

Write-Host "Setting up Keycloak for OIDC authentication..." -ForegroundColor Green

# Check if docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Pull and run Keycloak if not already running
$keycloakRunning = docker ps --filter "name=keycloak" --format "{{.Names}}" | Select-String "keycloak"
if (-not $keycloakRunning) {
    Write-Host "Starting Keycloak container..." -ForegroundColor Yellow
    docker run -d --name keycloak -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:21.1.1 start-dev
    
    # Wait for Keycloak to start
    Write-Host "Waiting for Keycloak to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
} else {
    Write-Host "Keycloak is already running" -ForegroundColor Yellow
}

# Get the container ID
$containerId = docker ps -qf "name=keycloak"

if (-not $containerId) {
    Write-Host "Failed to find running Keycloak container" -ForegroundColor Red
    exit 1
}

# Create a temporary file with the Keycloak setup commands
$tempFile = New-TemporaryFile
@"
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Create a new realm
/opt/keycloak/bin/kcadm.sh create realms -s realm=sil -s enabled=true

# Create client
/opt/keycloak/bin/kcadm.sh create clients -r sil -s clientId=sil-api -s publicClient=false -s clientAuthenticatorType=client-secret -s secret=8ff1d3a8-e5c0-456d-9b2d-2a82c61a2c67 -s serviceAccountsEnabled=true -s standardFlowEnabled=true -s directAccessGrantsEnabled=true -s authorizationServicesEnabled=true -s 'redirectUris=["http://localhost:8000/*"]'

# Create roles
/opt/keycloak/bin/kcadm.sh create roles -r sil -s name=admin
/opt/keycloak/bin/kcadm.sh create roles -r sil -s name=user

# Create test user
/opt/keycloak/bin/kcadm.sh create users -r sil -s username=testuser -s email=testuser@example.com -s emailVerified=true -s enabled=true
/opt/keycloak/bin/kcadm.sh set-password -r sil --username testuser --new-password testuser

# Assign role to user
/opt/keycloak/bin/kcadm.sh add-roles -r sil --uusername testuser --rolename user

# Create admin user
/opt/keycloak/bin/kcadm.sh create users -r sil -s username=admin -s email=admin@example.com -s emailVerified=true -s enabled=true
/opt/keycloak/bin/kcadm.sh set-password -r sil --username admin --new-password admin

# Assign admin role
/opt/keycloak/bin/kcadm.sh add-roles -r sil --uusername admin --rolename admin
"@ | Out-File -FilePath $tempFile.FullName -Encoding ASCII

# Copy the temp file to the container and execute
$containerPath = "/tmp/keycloak_setup.sh"
Get-Content $tempFile.FullName | docker exec -i $containerId sh -c "cat > $containerPath && chmod +x $containerPath"
docker exec $containerId sh -c "sh $containerPath"

# Clean up
Remove-Item $tempFile.FullName

Write-Host ""
Write-Host "Keycloak setup complete!" -ForegroundColor Green
Write-Host "OIDC Issuer: http://localhost:8080/realms/sil" -ForegroundColor Cyan
Write-Host "OIDC Audience: sil-api" -ForegroundColor Cyan
Write-Host "OIDC JWKS URL: http://localhost:8080/realms/sil/protocol/openid-connect/certs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test User Credentials:" -ForegroundColor Yellow
Write-Host "Username: testuser" -ForegroundColor Yellow
Write-Host "Password: testuser" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin User Credentials:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor Yellow
Write-Host "Password: admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "Keycloak Admin Console: http://localhost:8080/admin" -ForegroundColor Green
Write-Host "Admin credentials: admin / admin" -ForegroundColor Green