# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# gcc is often needed for building some Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    # Clean up apt lists to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# --no-cache-dir reduces layer size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code into the container at /app
COPY . .

# Set environment variables
# FLASK_APP tells Flask where your application instance is
ENV FLASK_APP=run.py
# PYTHONUNBUFFERED ensures that Python output (like print statements)
# is sent straight to terminal without being buffered first, which is good for logging.
ENV PYTHONUNBUFFERED=1

# Expose the port the app runs on.
# This is documentation for the user and for tools like Docker.
# Railway will override this with its own $PORT, but it's good practice.
# We'll use 8080 as a common default, but Gunicorn will actually use $PORT.
EXPOSE 8080

# Command to run the application using Gunicorn
# This is the crucial change:
# We use $PORT (provided by Railway) instead of a hardcoded port.
# Gunicorn will listen on all available network interfaces (0.0.0.0)
# on the port specified by the $PORT environment variable.
CMD gunicorn run:app --bind 0.0.0.0:$PORT --workers 1