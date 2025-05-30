# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bike Ride Planner - A Flask web application for planning and managing group mountain biking rides. Despite the directory name "pool-club", this is actually a mountain biking application.

## Development Setup

- Python virtual environment: `python -m venv venv`
- Activate virtual environment: `source venv/bin/activate` (macOS/Linux)
- Install dependencies: `pip install -r requirements.txt`

## Common Commands

- Run development server: `python run.py`
- Run with Docker: `docker-compose up --build`
- Run production server: `gunicorn --bind 0.0.0.0:5000 --workers 4 run:app`

## Project Structure

```
/app
  /__init__.py      - Flask app factory
  /models.py        - SQLAlchemy models (Ride, Rider, RideParticipant)
  /routes.py        - API endpoints and views
  /static
    /css/style.css  - Main stylesheet
    /js/app.js      - Frontend JavaScript
  /templates
    /index.html     - Single page application template
```

## Architecture

- Backend: Flask with SQLAlchemy ORM
- Database: SQLite (configurable via DATABASE_URL)
- Frontend: Vanilla JavaScript SPA with modern CSS
- Deployment: Docker/Docker Compose ready

## Key API Endpoints

- GET/POST `/api/rides` - List all rides or create new ride
- GET/DELETE `/api/rides/<id>` - Get ride details or delete ride
- POST `/api/rides/<id>/join` - Join a ride
- POST `/api/rides/<id>/leave` - Leave a ride
- GET/POST `/api/riders` - List riders or create new rider