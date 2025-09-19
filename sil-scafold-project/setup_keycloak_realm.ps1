# PowerShell script to set up Keycloak realms and clients

Write-Host "Checking Keycloak status..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} 
catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if Keycloak container is running
$keycloakRunning = docker ps --filter "name=keycloak" --format "{{.Names}}" | Select-String "keycloak"
if (-not $keycloakRunning) {
    Write-Host "✗ Keycloak container is not running. Please start it first." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "✓ Keycloak container is running" -ForegroundColor Green
}

# Get the container ID
$containerId = docker ps -qf "name=keycloak"
if (-not $containerId) {
    Write-Host "✗ Failed to find running Keycloak container" -ForegroundColor Red
    exit 1
}

# Try to connect to Keycloak
try {
    Invoke-WebRequest -Uri "http://localhost:8090/realms/master" -Method GET -ErrorAction Stop | Out-Null
    Write-Host "✓ Keycloak is accessible" -ForegroundColor Green
} 
catch {
    Write-Host "✗ Keycloak is not accessible. Is it running on port 8090?" -ForegroundColor Red
    exit 1
}

# Check if the SIL realm exists
try {
    Invoke-WebRequest -Uri "http://localhost:8090/realms/sil" -Method GET -ErrorAction Stop | Out-Null
    Write-Host "✓ SIL realm exists" -ForegroundColor Green
} 
catch {
    Write-Host "SIL realm doesn't exist. Creating it now..." -ForegroundColor Yellow
    
    # Create a temporary file with the Keycloak setup commands
    $tempFile = New-TemporaryFile
@"
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Create a new realm
/opt/keycloak/bin/kcadm.sh create realms -s realm=sil -s enabled=true

# Create client
/opt/keycloak/bin/kcadm.sh create clients -r sil -s clientId=sil-api -s publicClient=false -s clientAuthenticatorType=client-secret -s secret=8ff1d3a8-e5c0-456d-9b2d-2a82c61a2c67 -s serviceAccountsEnabled=true -s standardFlowEnabled=true -s directAccessGrantsEnabled=true -s authorizationServicesEnabled=true -s 'redirectUris=["http://localhost:5173/*"]'

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
    
    Write-Host "Keycloak setup completed" -ForegroundColor Green
    
    # Verify the SIL realm was created
    try {
        Invoke-WebRequest -Uri "http://localhost:8090/realms/sil" -Method GET -ErrorAction Stop | Out-Null
        Write-Host "✓ SIL realm is now accessible" -ForegroundColor Green
    } 
    catch {
        Write-Host "✗ Failed to create SIL realm. Please check Keycloak logs for details." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Keycloak Information:" -ForegroundColor Cyan
Write-Host "Admin Console: http://localhost:8090/admin" -ForegroundColor Yellow
Write-Host "Admin Login: admin / admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test Users:" -ForegroundColor Cyan
Write-Host "Regular User: testuser / testuser" -ForegroundColor Yellow
Write-Host "Admin User: admin / admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "OIDC Configuration:" -ForegroundColor Cyan
Write-Host "Issuer: http://localhost:8090/realms/sil" -ForegroundColor Yellow
Write-Host "Client ID: sil-api" -ForegroundColor Yellow
Write-Host "Client Secret: 8ff1d3a8-e5c0-456d-9b2d-2a82c61a2c67" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend Debugging:" -ForegroundColor Cyan
Write-Host "Visit http://localhost:5173/auth/debug to verify authentication settings" -ForegroundColor Yellow