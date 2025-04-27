#!/bin/bash

# Create a new .env file for the backend
cat > backend/.env << EOL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notesapp
DB_USER=notesapp_user
DB_PASSWORD=cherry2025
PORT=3012

AUTH_USERNAME=admin
AUTH_PASSWORD_HASH=\$2b\$10\$qa2CKQIRH.MkrDD7dtjOUuzknnU/hxFLTUjfvylHbnSV9wkTjGr7.
JWT_SECRET=8f2a0e9d47c5b6a3d1f8e7c6b5a4d3e2f1c0b9a8d7e6f5c4b3a2d1e0f9c8b7a
EOL

echo "Updated backend/.env file"
chmod +x ./scripts/update-env.sh
