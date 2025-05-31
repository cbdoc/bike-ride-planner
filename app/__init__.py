from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
import os

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///rides.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    CORS(app)
    login_manager.init_app(app)
    login_manager.login_view = 'main.admin_login'
    
    from app.routes import main
    app.register_blueprint(main)
    
    # Add visitor tracking middleware
    @app.before_request
    def track_visitor():
        from app.models import VisitorLog
        
        # Skip tracking for static files and admin routes
        if request.endpoint and (
            request.endpoint.startswith('static') or 
            request.path.startswith('/admin') or
            request.path.startswith('/api/admin')
        ):
            return
            
        # Get client IP (handle proxies)
        ip = request.headers.get('X-Forwarded-For', 
                               request.headers.get('X-Real-IP', 
                                                 request.remote_addr))
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        
        # Log the visit
        try:
            visit = VisitorLog(
                ip_address=ip,
                user_agent=request.headers.get('User-Agent', ''),
                page=request.path,
                method=request.method,
                referrer=request.headers.get('Referer', '')
            )
            db.session.add(visit)
            db.session.commit()
        except Exception as e:
            # Don't let logging errors break the app
            db.session.rollback()
            app.logger.error(f"Failed to log visitor: {e}")
    
    with app.app_context():
        db.create_all()
        
        # Create default admin if doesn't exist
        from app.models import Admin
        if not Admin.query.filter_by(username='admin').first():
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            admin = Admin(username='admin')
            admin.set_password(admin_password)
            db.session.add(admin)
            db.session.commit()
    
    return app