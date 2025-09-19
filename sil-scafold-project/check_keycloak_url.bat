@echo off
echo Checking Keycloak Auth URL...

REM Run the command to generate the auth URL
docker exec keycloak bash -c '/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && echo "External Keycloak URL should be: http://localhost:8090"'

echo.
echo Done!
pause