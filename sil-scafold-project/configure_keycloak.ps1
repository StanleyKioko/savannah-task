Write-Host "Configuring Keycloak for registration..."

# Define Variables
$KEYCLOAK_URL="http://localhost:8090"
$REALM="sil"
$ADMIN_USERNAME="admin"
$ADMIN_PASSWORD="admin"
$CLIENT_ID="sil-api"
$REDIRECT_URI="http://localhost:8083/auth/callback"

# Step 1: Get admin token
Write-Host "Getting admin token..."
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method Post `
    -Body "client_id=admin-cli&grant_type=password&username=$ADMIN_USERNAME&password=$ADMIN_PASSWORD" `
    -ContentType "application/x-www-form-urlencoded"

$adminToken = $tokenResponse.access_token

# Step 2: Enable User Registration in Realm Settings
Write-Host "Enabling user registration..."
$realmSettings = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" `
    -Method Get `
    -Headers @{ Authorization = "Bearer $adminToken" }

# Enable registration
$realmSettings.registrationAllowed = $true
$realmSettings.registrationEmailAsUsername = $false
$realmSettings.verifyEmail = $false

# Update realm settings
Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM" `
    -Method Put `
    -Headers @{ 
        Authorization = "Bearer $adminToken"
        "Content-Type" = "application/json" 
    } `
    -Body ($realmSettings | ConvertTo-Json -Depth 10)

# Step 3: Update Client Settings
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
    
    # Update redirect URIs
    if ($clientDetails.redirectUris -notcontains $REDIRECT_URI) {
        $clientDetails.redirectUris += $REDIRECT_URI
    }
    
    # Ensure standard flow enabled
    $clientDetails.standardFlowEnabled = $true
    
    # Update client
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientId" `
        -Method Put `
        -Headers @{ 
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json" 
        } `
        -Body ($clientDetails | ConvertTo-Json -Depth 10)
    
    Write-Host "Client updated successfully."
} else {
    Write-Host "Client $CLIENT_ID not found."
}

Write-Host "Keycloak configuration completed."
Write-Host "Registration should now be enabled at: $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/auth?client_id=$CLIENT_ID&redirect_uri=$([Uri]::EscapeDataString($REDIRECT_URI))&response_type=code&scope=openid&kc_action=register"