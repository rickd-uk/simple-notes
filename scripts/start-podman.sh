#!/bin/bash

# Make sure the init-db directory exists
mkdir -p init-db

# Start the Podman containers
podman-compose up -d

echo "PostgreSQL container is starting..."
echo "Wait a few seconds for the database to initialize..."
sleep 5

# Check if the PostgreSQL container is running
if podman ps | grep -q notes-postgres; then
    echo "PostgreSQL container is now running"
    echo "Database Name: notesapp"
    echo "Username: notesapp_user"
    echo "Password: cherry2025"
    echo "Port: 5432"
    echo ""
    echo "To start the Notes app:"
    echo "1. cd backend"
    echo "2. npm start"
else
    echo "Error: PostgreSQL container failed to start"
fi
