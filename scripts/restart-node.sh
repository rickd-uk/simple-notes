#!/bin/bash

PORT=3012
PID=$(lsof -t -i :$PORT)

if [ -n "$PID" ]; then
  CMD=$(ps -p $PID -o comm=)
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
npm --prefix ./backend/ start

