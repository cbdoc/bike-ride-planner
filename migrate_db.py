#!/usr/bin/env python3

import os
from app import create_app, db
from app.models import Admin
from sqlalchemy import inspect

def init_database():
    """Initialize database safely for production deployment"""
    app = create_app()
    
    with app.app_context():
        # Check if database/tables exist
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables:
            print("Creating database tables...")
            db.create_all()
            print("Database tables created successfully!")
        else:
            print(f"Database already exists with tables: {existing_tables}")
        
        # Create admin user if it doesn't exist
        try:
            admin = Admin.query.filter_by(username='admin').first()
            if not admin:
                admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
                admin = Admin(username='admin')
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()
                print("Admin user created successfully!")
            else:
                print("Admin user already exists")
        except Exception as e:
            print(f"Admin user creation failed: {e}")

if __name__ == '__main__':
    init_database()