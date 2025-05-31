from flask import Flask
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
    
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.warning(f"Database tables may already exist: {e}")
        
        # Create default admin if doesn't exist
        from app.models import Admin
        try:
            if not Admin.query.filter_by(username='admin').first():
                admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
                admin = Admin(username='admin')
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()
        except Exception as e:
            app.logger.warning(f"Could not create default admin: {e}")
    
    return app