Write-Host "Updating Keycloak client redirect URIs and CORS settings..."

# Define Variables
$KEYCLOAK_URL="http://localhost:8090"
$REALM="sil"
$ADMIN_USERNAME="admin"
$ADMIN_PASSWORD="admin"
$CLIENT_ID="sil-api"
$FRONTEND_CLIENT_ID="sil-frontend"
$REDIRECT_URIS=@(
  "http://localhost:8081/auth/callback",
  "http://localhost:8082/auth/callback",
  "http://localhost:8083/auth/callback",
  "http://localhost:8084/auth/callback",
  "http://localhost:8085/auth/callback",
  "http://localhost:*/auth/callback"
)
$WEB_ORIGINS=@(
  "http://localhost:8081",
  "http://localhost:8082", 
  "http://localhost:8083",
  "http://localhost:8084",
  "http://localhost:8085",
  "+"
)

# Step 1: Get admin token
Write-Host "Getting admin token..."
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method Post `
    -Body "client_id=admin-cli&grant_type=password&username=$ADMIN_USERNAME&password=$ADMIN_PASSWORD" `
    -ContentType "application/x-www-form-urlencoded"

$adminToken = $tokenResponse.access_token

# Step 2: Update Client Settings
Write-Host "Updating client settings..."
$clientResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" `
    -Method Get `
    -Headers @{ Authorization = "Bearer $adminToken" }

$client = $clientResponse | Where-Object { $_.clientId -eq $CLIENT_ID }

if ($client) {
    $clientId = $client.id
    
    # Get client details
    $clientDetails = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientId" `
        -Method Get `
        -Headers @{ Authorization = "Bearer $adminToken" }
    
    # Update redirect URIs with all possible ports
    $clientDetails.redirectUris = $REDIRECT_URIS
    
    # Ensure standard flow enabled
    $clientDetails.standardFlowEnabled = $true

    # Enable direct access grants for testing
    $clientDetails.directAccessGrantsEnabled = $true
    
    # Add web origins for CORS
    $clientDetails.webOrigins = $WEB_ORIGINS
    
    # Update client
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientId" `
        -Method Put `
        -Headers @{ 
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json" 
        } `
        -Body ($clientDetails | ConvertTo-Json -Depth 10)
    
    Write-Host "Client updated successfully with redirect URIs:"
    $REDIRECT_URIS | ForEach-Object { Write-Host "- $_" }
    Write-Host "Web Origins for CORS:"
    $WEB_ORIGINS | ForEach-Object { Write-Host "- $_" }
} else {
    Write-Host "Client $CLIENT_ID not found."
}

# Step 3: Make sure registration is enabled
$realmSettings = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" `
    -Method Get `
    -Headers @{ Authorization = "Bearer $adminToken" }

# Enable registration
$realmSettings.registrationAllowed = $true
$realmSettings.registrationEmailAsUsername = $false
$realmSettings.verifyEmail = $false

# Update CORS settings at realm level
$corsEnabled = $true
if ($null -eq $realmSettings.attributes) {
    $realmSettings.attributes = @{}
}
$realmSettings.attributes["cors.allowed-origins"] = $WEB_ORIGINS -join ","
$realmSettings.attributes["cors.enabled"] = "$corsEnabled"
$realmSettings.attributes["cors.allow-credentials"] = "true"

# Update realm settings
Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" `
    -Method Put `
    -Headers @{ 
        Authorization = "Bearer $adminToken"
        "Content-Type" = "application/json" 
    } `
    -Body ($realmSettings | ConvertTo-Json -Depth 10)

Write-Host "Registration enabled in the realm."
Write-Host "CORS settings enabled at realm level."

# Step 4: Update frontend client if it exists
$frontendClientResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" `
    -Method Get `
    -Headers @{ Authorization = "Bearer $adminToken" }

$frontendClient = $frontendClientResponse | Where-Object { $_.clientId -eq $FRONTEND_CLIENT_ID }

if ($frontendClient) {
    $frontendClientId = $frontendClient.id
    
    # Get client details
    $frontendClientDetails = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$frontendClientId" `
        -Method Get `
        -Headers @{ Authorization = "Bearer $adminToken" }
    
    # Update redirect URIs with all possible ports
    $frontendClientDetails.redirectUris = $REDIRECT_URIS
    
    # Add web origins for CORS
    $frontendClientDetails.webOrigins = $WEB_ORIGINS
    
    # Update client
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$frontendClientId" `
        -Method Put `
        -Headers @{ 
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json" 
        } `
        -Body ($frontendClientDetails | ConvertTo-Json -Depth 10)
    
    Write-Host "Frontend client updated successfully with CORS settings."
}

Write-Host "Configuration completed."
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart your React application" -ForegroundColor White
Write-Host "2. Clear browser cookies and localStorage for your application domain" -ForegroundColor White
Write-Host "3. Try logging in again" -ForegroundColor White
Write-Host ""
Write-Host "If you still encounter CORS issues:" -ForegroundColor Yellow
Write-Host "- Remember that the frontend workaround in api.ts provides simulated tokens" -ForegroundColor White
Write-Host "- For production, you should implement a backend proxy for token exchange" -ForegroundColor White
Write-Host "- Your backend should handle the sensitive parts of the OIDC flow" -ForegroundColor White
Write-Host ""
Write-Host "For testing, you can use these credentials:" -ForegroundColor Green
Write-Host "Username: testuser123" -ForegroundColor White
Write-Host "Password: password123" -ForegroundColor White