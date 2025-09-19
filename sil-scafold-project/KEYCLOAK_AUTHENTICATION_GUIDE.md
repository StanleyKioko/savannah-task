# Keycloak Authentication Setup Guide

This guide will help you set up and test Keycloak authentication for both the backend and frontend applications.

## 1. Start Keycloak

Open a PowerShell terminal and run:

```powershell
cd d:\sil-scafold-project\sil-backend-scaffold\scripts
.\setup_keycloak.ps1
```

This script will:
- Start a Keycloak container on port 8080
- Create a 'sil' realm
- Set up a client with ID 'sil-api'
- Create test users (testuser/testuser and admin/admin)

## 2. Verify Keycloak is Running

Open a browser and go to http://localhost:8080/admin

You should see the Keycloak login page. Log in with:
- Username: admin
- Password: admin

## 3. Start the Backend

Open a new PowerShell terminal and run:

```powershell
cd d:\sil-scafold-project\sil-backend-scaffold
python manage.py runserver
```

## 4. Start the Frontend

Open another PowerShell terminal and run:

```powershell
cd d:\sil-scafold-project\neo-cartel
npm run dev
```

The frontend will be available at http://localhost:5173

## 5. Testing Authentication

1. Navigate to the frontend at http://localhost:5173
2. Click "Login" or "Sign in with Keycloak"
3. You will be redirected to the Keycloak login page
4. Log in with either:
   - Regular user: testuser/testuser
   - Admin user: admin/admin
5. After successful login, you will be redirected back to the application

## Troubleshooting

### Issue: Keycloak redirect loop or error

1. Ensure Keycloak is running on port 8080
2. Verify in the browser console that the redirect URL is correct
3. Make sure the client ID and secret match between frontend and Keycloak setup

### Issue: Authentication not persisting

1. Check browser console for any CORS errors
2. Ensure localStorage is accessible and not being blocked
3. Verify that tokens are being stored properly (check Application tab in Chrome DevTools)

### Issue: API calls failing after authentication

1. Verify that the access token is included in API requests (check Network tab)
2. Check that the token is not expired
3. Ensure the backend is correctly validating the token

## Keycloak Configuration Details

- **Keycloak URL**: http://localhost:8080
- **Realm**: sil
- **Client ID**: sil-api
- **Client Secret**: 8ff1d3a8-e5c0-456d-9b2d-2a82c61a2c67

## Frontend Authentication Flow

1. User clicks "Sign in with Keycloak"
2. Frontend builds an authorization URL and redirects
3. User authenticates on Keycloak
4. Keycloak redirects back to `/auth/callback` with an authorization code
5. Frontend exchanges code for tokens
6. User info is extracted from tokens and stored in state

## Logout Process

1. User clicks "Logout"
2. Frontend makes a request to Keycloak to invalidate the session
3. Local tokens are cleared
4. User is redirected to the home page