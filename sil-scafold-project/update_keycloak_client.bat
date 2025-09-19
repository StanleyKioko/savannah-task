@echo off
echo Updating Keycloak client configuration for port 8081...

REM Prepare the JSON data file
echo {> client_update.json
echo   "redirectUris": ["http://localhost:8081/*"],>> client_update.json
echo   "webOrigins": ["http://localhost:8081"],>> client_update.json
echo   "rootUrl": "http://localhost:8081",>> client_update.json
echo   "baseUrl": "http://localhost:8081/",>> client_update.json
echo   "attributes": {>> client_update.json
echo     "post.logout.redirect.uris": "http://localhost:8081/">> client_update.json
echo   }>> client_update.json
echo }>> client_update.json

REM Copy the file to the container
docker cp client_update.json keycloak:/tmp/client_update.json

REM Run the commands inside the container
docker exec -it keycloak bash -c "/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin && /opt/keycloak/bin/kcadm.sh update clients/6180fe91-165e-47c1-9c72-18f0ad2fcf6b -r sil -f /tmp/client_update.json"

REM Clean up the JSON file
del client_update.json

echo Done!
pause