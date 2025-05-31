#!/bin/bash
# Startup script for Railway deployment
PORT=${PORT:-8080}
echo "Starting gunicorn on port $PORT"
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 run:app