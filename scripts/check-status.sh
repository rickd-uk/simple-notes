#!/bin/bash

echo "Checking container status..."
podman ps

echo -e "\nChecking PostgreSQL connection..."
# Try to connect to PostgreSQL using psql in the container
podman exec -it notes-postgres psql -U notesapp_user -d notesapp -c "\l" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "\nPostgreSQL connection successful!"
else
    echo -e "\nCould not connect to PostgreSQL. Make sure the container is running."
fi

# Check if the Node.js backend is running
if pgrep -f "node.*index.js" > /dev/null; then
    echo -e "\nNode.js backend is running."
    echo "You can access the Notes app at: http://localhost:3012"
else
    echo -e "\nNode.js backend is not running."
    echo "To start it, run: cd backend && npm start"
fi
