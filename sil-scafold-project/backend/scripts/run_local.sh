#!/bin/bash
# This script runs the SIL backend locally with Docker Compose

# Function to print colored output
print_step() {
  echo -e "\e[1;34m==>\e[0m \e[1m$1\e[0m"
}

print_success() {
  echo -e "\e[1;32m==>\e[0m \e[1m$1\e[0m"
}

print_error() {
  echo -e "\e[1;31m==>\e[0m \e[1m$1\e[0m"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  print_error "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start containers
print_step "Starting Docker containers..."
docker-compose up -d --build

# Check if the containers started successfully
if [ $? -ne 0 ]; then
  print_error "Failed to start Docker containers. Please check the error messages above."
  exit 1
fi

# Wait for database to be ready
print_step "Waiting for database to be ready..."
sleep 10

# Run migrations
print_step "Running database migrations..."
docker-compose exec web python manage.py migrate

# Check if migrations were successful
if [ $? -ne 0 ]; then
  print_error "Failed to run migrations. Please check the error messages above."
  exit 1
fi

# Setup Keycloak
print_step "Setting up Keycloak for OIDC authentication..."
bash scripts/setup_keycloak.sh &

# Success message and next steps
print_success "SIL backend is now running!"
echo ""
echo "Next steps:"
echo "1. Create a superuser to access the admin panel:"
echo "   docker-compose exec web python manage.py createsuperuser"
echo ""
echo "2. Import sample products:"
echo "   docker-compose exec web python upload_products.py"
echo ""
echo "3. Setup Keycloak for authentication:"
echo "   bash scripts/setup_keycloak.sh"
echo ""
echo "4. Get a test token from Keycloak:"
echo "   curl -X POST \\"
echo "     http://localhost:8080/realms/sil/protocol/openid-connect/token \\"
echo "     -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "     -d \"client_id=sil-backend\" \\"
echo "     -d \"client_secret=sil-backend-secret\" \\"
echo "     -d \"grant_type=password\" \\"
echo "     -d \"username=testuser\" \\"
echo "     -d \"password=password\""
echo ""
echo "5. Access the API at:"
echo "   http://localhost:8000/api/ (with Authorization: Bearer YOUR_TOKEN header)"
echo ""
echo "6. Access the admin panel at:"
echo "   http://localhost:8000/admin/"
echo ""
echo "To stop the services, run: docker-compose down"