Write-Host "Updating Keycloak client redirect URIs..."

# Define Variables
$KEYCLOAK_URL="http://localhost:8090"
$REALM="sil"
$ADMIN_USERNAME="admin"
$ADMIN_PASSWORD="admin"
$CLIENT_ID="sil-api"
$REDIRECT_URI="http://localhost:8085/auth/callback"

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
    
    # Update redirect URIs - add new one while keeping existing ones
    if ($clientDetails.redirectUris -notcontains $REDIRECT_URI) {
        $clientDetails.redirectUris += $REDIRECT_URI
    }
    
    # Update client
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientId" `
        -Method Put `
        -Headers @{ 
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json" 
        } `
        -Body ($clientDetails | ConvertTo-Json -Depth 10)
    
    Write-Host "Client updated successfully with redirect URI: $REDIRECT_URI"
    Write-Host "All redirect URIs: $($clientDetails.redirectUris -join ', ')"
} else {
    Write-Host "Client $CLIENT_ID not found."
}