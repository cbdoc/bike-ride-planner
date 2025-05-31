#!/bin/bash
set -e

# Debug: Print all environment variables
echo "=== Environment Variables ==="
env | sort

# Get port from environment without using $PORT directly
MYPORT=$(printenv PORT)
if [ -z "$MYPORT" ]; then
    echo "PORT is empty, setting to 8080"
    MYPORT=8080
else
    echo "PORT is set to: $MYPORT"
fi

echo "Starting gunicorn on port $MYPORT"
exec gunicorn run:app --bind 0.0.0.0:$MYPORT --workers 1