@echo off
echo Creating roles in Keycloak...

REM Run commands inside the container to create the roles
docker exec keycloak bash -c "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && /opt/keycloak/bin/kcadm.sh create roles -r sil -s name=user && /opt/keycloak/bin/kcadm.sh create roles -r sil -s name=admin"

echo.
echo Assigning role to user...
docker exec keycloak bash -c "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && /opt/keycloak/bin/kcadm.sh add-roles -r sil --uusername testuser123 --rolename user"

echo.
echo Roles created and assigned successfully!
echo.
echo You can now try logging in with the credentials in the frontend.
pause