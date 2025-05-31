#!/bin/bash
set -e

# Use Railway's PORT or default to 8080
PORT=${PORT:-8080}

echo "Starting gunicorn on port $PORT"
exec gunicorn run:app --bind 0.0.0.0:$PORT --workers 1