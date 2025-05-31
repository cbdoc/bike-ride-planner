# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code into the container at /app
COPY . .

# Set environment variables
ENV FLASK_APP=run.py
ENV PYTHONUNBUFFERED=1

# Create a startup script
RUN echo '#!/bin/sh\n\
echo "PORT environment variable is: $PORT"\n\
echo "All environment variables:"\n\
env | grep -i port\n\
if [ -z "$PORT" ]; then\n\
    echo "PORT is not set, using 8080"\n\
    export PORT=8080\n\
fi\n\
echo "Starting gunicorn on port $PORT"\n\
exec gunicorn run:app --bind 0.0.0.0:$PORT --workers 1' > /app/start.sh && \
chmod +x /app/start.sh

# Use the startup script
CMD ["/app/start.sh"]