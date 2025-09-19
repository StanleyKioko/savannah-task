Write-Host "Clearing browser storage for Keycloak..." -ForegroundColor Green
Write-Host "Please follow these steps:" -ForegroundColor Yellow
Write-Host "1. In your web browser, open the Developer Tools (F12 or right-click and select 'Inspect')" -ForegroundColor Yellow
Write-Host "2. Go to the 'Application' tab" -ForegroundColor Yellow
Write-Host "3. Under 'Storage', expand 'Local Storage' and select your site" -ForegroundColor Yellow
Write-Host "4. Look for items related to authentication (access_token, refresh_token, oidc_state, etc.)" -ForegroundColor Yellow
Write-Host "5. Right-click and delete those items" -ForegroundColor Yellow
Write-Host "6. Also check 'Cookies' for any related auth cookies and delete them" -ForegroundColor Yellow
Write-Host "7. Refresh your page and try logging in again" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "Alternatively, you can click the 'Clear site data' button in the Application tab" -ForegroundColor Green
Write-Host "" -ForegroundColor Yellow
Write-Host "After clearing storage, make sure to:" -ForegroundColor Yellow
Write-Host "1. Verify Keycloak is running on port 8090: http://localhost:8090/admin/" -ForegroundColor Yellow
Write-Host "2. Set up the 'sil' realm and 'sil-api' client as described in the manual setup instructions" -ForegroundColor Yellow
Write-Host "3. Try logging in again" -ForegroundColor Yellow