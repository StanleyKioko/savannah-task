Write-Host "Setting up Keycloak on port 8090..." -ForegroundColor Green

# Use the container's internal port for the commands
$KEYCLOAK_URL="http://localhost:8080"
$HOST_KEYCLOAK_URL="http://localhost:8090"

Write-Host "1. Create a realm called 'sil' in Keycloak" -ForegroundColor Yellow
Write-Host "   Go to $HOST_KEYCLOAK_URL/admin/" -ForegroundColor Yellow
Write-Host "   Login with admin/admin" -ForegroundColor Yellow
Write-Host "   Click on 'Create Realm' and name it 'sil'" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. Create a client:" -ForegroundColor Yellow
Write-Host "   In the 'sil' realm, go to Clients → Create client" -ForegroundColor Yellow
Write-Host "   Client ID: sil-api" -ForegroundColor Yellow
Write-Host "   Client Authentication: ON (Confidential)" -ForegroundColor Yellow
Write-Host "   Valid redirect URIs: http://localhost:3000/* (or your frontend URL)" -ForegroundColor Yellow
Write-Host ""

Write-Host "3. Get the client secret:" -ForegroundColor Yellow
Write-Host "   Go to the 'Credentials' tab of the client" -ForegroundColor Yellow
Write-Host "   Note the secret value" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. Create a test user:" -ForegroundColor Yellow
Write-Host "   Go to Users → Add user" -ForegroundColor Yellow
Write-Host "   Username: testuser" -ForegroundColor Yellow
Write-Host "   Email: testuser@example.com" -ForegroundColor Yellow
Write-Host "   Go to the Credentials tab and set password: testuser" -ForegroundColor Yellow
Write-Host "   Disable 'Temporary'" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. Update your frontend configuration:" -ForegroundColor Yellow
Write-Host "   Make sure the Keycloak URL in your code is: $HOST_KEYCLOAK_URL" -ForegroundColor Yellow
Write-Host "   Make sure the realm is: sil" -ForegroundColor Yellow
Write-Host "   Make sure the client ID is: sil-api" -ForegroundColor Yellow
Write-Host ""

Write-Host "Setup instructions completed!" -ForegroundColor Green