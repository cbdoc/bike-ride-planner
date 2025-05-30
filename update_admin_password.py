#!/usr/bin/env python3

from app import create_app, db
from app.models import Admin
from werkzeug.security import generate_password_hash

def update_admin_password():
    app = create_app()
    
    with app.app_context():
        # Try to find existing admin user
        admin = Admin.query.filter_by(username='admin').first()
        
        if admin:
            # Update existing admin password
            admin.set_password('Rt@nmin8aNivcci4yq9C')
            db.session.commit()
            print("Admin password updated successfully!")
        else:
            # Create new admin user
            admin = Admin(username='admin')
            admin.set_password('Rt@nmin8aNivcci4yq9C')
            db.session.add(admin)
            db.session.commit()
            print("New admin user created successfully!")

if __name__ == '__main__':
    update_admin_password()