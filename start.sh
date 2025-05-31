#!/bin/bash
set -e

# Debug: Print all environment variables
echo "=== Environment Variables ==="
env | sort
echo "=== PORT Variable ==="
echo "PORT=$PORT"

# Use Railway's PORT or default to 8080
if [ -z "$PORT" ]; then
    echo "PORT is empty, setting to 8080"
    PORT=8080
else
    echo "PORT is set to: $PORT"
fi

echo "Starting gunicorn on port $PORT"
exec gunicorn run:app --bind 0.0.0.0:$PORT --workers 1