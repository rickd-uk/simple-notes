#!/bin/bash

PORT=3012
PID=$(lsof -t -i :$PORT 2>/dev/null)

# Check if PostgreSQL container is running
if ! podman ps | grep -q notes-postgres; then
  echo "PostgreSQL container is not running. Starting it now..."
  
  # Start the PostgreSQL container if it's not running
  ./scripts/start-podman.sh
  
  # Give PostgreSQL time to start up
  echo "Waiting for PostgreSQL to start up..."
  sleep 5
fi

# Kill existing Node process on PORT
if [ -n "$PID" ]; then
  CMD=$(ps -p $PID -o comm= 2>/dev/null)
  if [[ "$CMD" == "node" ]]; then
    echo "Killing Node process on port $PORT (PID: $PID)"
    kill -9 $PID
  else
    echo "Process on port $PORT is not Node (found: $CMD). Not killing."
  fi
else
  echo "No process found on port $PORT"
fi

echo "Starting backend..."
cd backend
npm start
