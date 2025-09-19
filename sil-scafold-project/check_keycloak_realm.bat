@echo off
echo Checking Keycloak realm configuration...

REM Run the commands inside the container
docker exec keycloak bash -c "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && /opt/keycloak/bin/kcadm.sh get realms/sil"

echo.
echo Done!
pause