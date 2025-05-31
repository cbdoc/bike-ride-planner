# Bike Ride Planner

A beautiful and functional web application for planning mountain biking rides with friends. Built with Flask, SQLite, and modern JavaScript.

## Features

- 🚵 Create and manage mountain biking rides
- 👥 Join rides and see who's participating
- 🎯 Filter rides by difficulty and date
- 📱 Responsive design for mobile and desktop
- 🏔️ Track ride details like distance, elevation gain, and difficulty
- 👤 Manage rider profiles with skill levels
- 🔐 Admin authentication system
- 🚀 Multiple deployment options

## Quick Start

### Using Docker (Recommended)

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

2. Open your browser to http://localhost:8080

### Using Virtual Environment

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python run.py
```

4. Open your browser to http://localhost:8080

## Usage

1. **Create a Ride**: Click "Create Ride" to schedule a new mountain biking adventure
2. **Join a Ride**: Browse available rides and click to see details, then join if spots are available
3. **Filter Rides**: Use the difficulty and date filters to find rides that match your preferences
4. **My Rides**: View rides you've created or joined

## Ride Difficulty Levels

- **Beginner**: Easy trails, minimal technical features
- **Intermediate**: Moderate trails with some technical sections
- **Advanced**: Challenging trails requiring good bike handling skills
- **Expert**: Very difficult trails with significant technical challenges

## Development

The application uses:
- Flask for the backend API
- SQLite for data storage
- Vanilla JavaScript for the frontend
- CSS3 for beautiful, responsive styling

## Deployment

### Railway (Recommended - Simplest)

1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo" 
3. Connect your GitHub account and select this repository
4. Set environment variable: `ADMIN_PASSWORD=your-secure-password`
5. Deploy automatically!

Railway will:
- Auto-detect your Docker setup
- Handle persistent storage
- Provide HTTPS automatically
- Deploy on every GitHub push

### Other Options

**Render**: Connect GitHub repo, uses `render.yaml`
**Heroku**: `git push heroku main`
**Docker on VPS**: `docker-compose up -d`

## Admin Access

To set up admin access, create a `.env` file with:
```
ADMIN_PASSWORD=your-secure-password-here
```

Then run the password setup script:
```bash
python update_admin_password.py
```

Default admin username is `admin`.

## Environment Variables

- `SECRET_KEY`: Flask secret key (required in production)
- `DATABASE_URL`: Database connection string (defaults to SQLite)
- `PORT`: Application port (defaults to 8080)

## Technology Stack

- **Backend**: Flask with SQLAlchemy ORM
- **Database**: SQLite (configurable via DATABASE_URL)
- **Frontend**: Vanilla JavaScript with modern CSS
- **Authentication**: Flask-Login with Werkzeug password hashing
- **Deployment**: Docker/Docker Compose ready