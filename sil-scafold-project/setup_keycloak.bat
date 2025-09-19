@echo off
echo Checking Keycloak status...

echo Setting up the SIL realm in Keycloak...

REM Create a temporary file with the Keycloak setup commands
echo /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin > keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Create a new realm >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh create realms -s realm=sil -s enabled=true >> keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Create client >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh create clients -r sil -s clientId=sil-api -s publicClient=false -s clientAuthenticatorType=client-secret -s secret=8ff1d3a8-e5c0-456d-9b2d-2a82c61a2c67 -s serviceAccountsEnabled=true -s standardFlowEnabled=true -s directAccessGrantsEnabled=true -s authorizationServicesEnabled=true -s "redirectUris=[\"http://localhost:5173/*\"]" >> keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Create roles >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh create roles -r sil -s name=admin >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh create roles -r sil -s name=user >> keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Create test user >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh create users -r sil -s username=testuser -s email=testuser@example.com -s emailVerified=true -s enabled=true >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh set-password -r sil --username testuser --new-password testuser >> keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Assign role to user >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh add-roles -r sil --uusername testuser --rolename user >> keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Create admin user >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh create users -r sil -s username=admin -s email=admin@example.com -s emailVerified=true -s enabled=true >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh set-password -r sil --username admin --new-password admin >> keycloak_setup.sh
echo. >> keycloak_setup.sh
echo # Assign admin role >> keycloak_setup.sh
echo /opt/keycloak/bin/kcadm.sh add-roles -r sil --uusername admin --rolename admin >> keycloak_setup.sh

REM Copy the script to the container and execute it
docker cp keycloak_setup.sh keycloak:/tmp/keycloak_setup.sh
docker exec keycloak chmod +x /tmp/keycloak_setup.sh
docker exec keycloak sh /tmp/keycloak_setup.sh

REM Clean up
del keycloak_setup.sh

echo.
echo Keycloak Information:
echo Admin Console: http://localhost:8090/admin
echo Admin Login: admin / admin
echo.
echo Test Users:
echo Regular User: testuser / testuser
echo Admin User: admin / admin
echo.
echo OIDC Configuration:
echo Issuer: http://localhost:8090/realms/sil
echo Client ID: sil-api
echo Client Secret: 8ff1d3a8-e5c0-456d-9b2d-2a82c61a2c67
echo.
echo Frontend Debugging:
echo Visit http://localhost:5173/auth/debug to verify authentication settings

pause