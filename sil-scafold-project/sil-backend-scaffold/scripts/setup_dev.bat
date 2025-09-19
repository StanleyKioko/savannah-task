@echo off
REM This script sets up the development environment for the SIL Backend project

echo Setting up development environment for SIL Backend...

REM Check if .env file exists, if not create from example
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please update the .env file with your actual configuration values.
)

REM Build and start all services
echo Starting all services with Docker Compose...
docker-compose up -d

REM Wait for services to be healthy
echo Waiting for services to be ready...
timeout /t 10 /nobreak > nul

REM Run migrations
echo Running database migrations...
docker-compose exec web python manage.py migrate

REM Load initial data if needed
echo Would you like to load sample data? (y/n)
set /p load_data=
if "%load_data%"=="y" (
    echo Loading sample data...
    docker-compose exec web python manage.py loaddata sample_fixtures
    REM Load sample products
    docker-compose exec web python upload_products.py sample_products.csv
)

echo Setting up Keycloak for OIDC authentication...
echo Would you like to set up Keycloak for OIDC? (y/n)
set /p setup_keycloak=
if "%setup_keycloak%"=="y" (
    echo Running Keycloak setup...
    powershell -ExecutionPolicy Bypass -File .\scripts\setup_keycloak.ps1
    echo Keycloak setup complete. Please update your .env file with the correct OIDC configuration.
)

echo Setup complete! The API is now running at http://localhost:8000
echo Admin interface: http://localhost:8000/admin/
echo Mailhog (for emails): http://localhost:8025
echo.
echo To create a superuser, run:
echo docker-compose exec web python manage.py createsuperuser