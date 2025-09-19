@echo off
echo Checking Keycloak client configuration...

REM Run the commands inside the container
docker exec keycloak bash -c "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && /opt/keycloak/bin/kcadm.sh get clients/6180fe91-165e-47c1-9c72-18f0ad2fcf6b -r sil"

echo.
echo Done!
pause