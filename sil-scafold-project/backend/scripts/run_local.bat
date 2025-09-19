@echo off
REM This script runs the SIL backend locally with Docker Compose

echo [34m==^>[0m [1mStarting Docker containers...[0m
docker-compose up -d --build

if %ERRORLEVEL% neq 0 (
    echo [31m==^>[0m [1mFailed to start Docker containers. Please check the error messages above.[0m
    exit /b 1
)

echo [34m==^>[0m [1mWaiting for database to be ready...[0m
timeout /t 10 /nobreak > nul

echo [34m==^>[0m [1mRunning database migrations...[0m
docker-compose exec web python manage.py migrate

if %ERRORLEVEL% neq 0 (
    echo [31m==^>[0m [1mFailed to run migrations. Please check the error messages above.[0m
    exit /b 1
)

echo [34m==^>[0m [1mSetting up Keycloak for OIDC authentication...[0m
echo You may need to run this manually in a Git Bash terminal:
echo bash scripts/setup_keycloak.sh

echo [32m==^>[0m [1mSIL backend is now running![0m
echo.
echo Next steps:
echo 1. Create a superuser to access the admin panel:
echo    docker-compose exec web python manage.py createsuperuser
echo.
echo 2. Import sample products:
echo    docker-compose exec web python upload_products.py
echo.
echo 3. Setup Keycloak for authentication:
echo    bash scripts/setup_keycloak.sh
echo.
echo 4. Get a test token from Keycloak:
echo    curl -X POST ^
echo      http://localhost:8080/realms/sil/protocol/openid-connect/token ^
echo      -H "Content-Type: application/x-www-form-urlencoded" ^
echo      -d "client_id=sil-backend" ^
echo      -d "client_secret=sil-backend-secret" ^
echo      -d "grant_type=password" ^
echo      -d "username=testuser" ^
echo      -d "password=password"
echo.
echo 5. Access the API at:
echo    http://localhost:8000/api/ (with Authorization: Bearer YOUR_TOKEN header)
echo.
echo 6. Access the admin panel at:
echo    http://localhost:8000/admin/
echo.
echo To stop the services, run: docker-compose down