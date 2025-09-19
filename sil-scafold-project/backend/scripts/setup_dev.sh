#!/bin/bash

echo "Setting up development environment for SIL Backend..."

if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update the .env file with your actual configuration values."
fi

echo "Starting all services with Docker Compose..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 10

echo "Running database migrations..."
docker-compose exec web python manage.py migrate

echo "Would you like to load sample data? (y/n)"
read load_data
if [ "$load_data" == "y" ]; then
    echo "Loading sample data..."
    docker-compose exec web python manage.py loaddata sample_fixtures
    docker-compose exec web python upload_products.py sample_products.csv
fi

echo "Setting up Keycloak for OIDC authentication..."
echo "Would you like to set up Keycloak for OIDC? (y/n)"
read setup_keycloak
if [ "$setup_keycloak" == "y" ]; then
    bash scripts/setup_keycloak.sh
    echo "Keycloak setup complete. Please update your .env file with the correct OIDC configuration."
fi

echo "Setup complete! The API is now running at http://localhost:8000"
echo "Admin interface: http://localhost:8000/admin/"
echo "Mailhog (for emails): http://localhost:8025"
echo ""
echo "To create a superuser, run:"
echo "docker-compose exec web python manage.py createsuperuser"