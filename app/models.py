from app import db, login_manager
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Rider(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    skill_level = db.Column(db.String(20), default='intermediate')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    participations = db.relationship('RideParticipant', back_populates='rider', cascade='all, delete-orphan')

class Ride(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    trail_name = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    ride_type = db.Column(db.String(20), nullable=False, default='mountain')
    ebikes_allowed = db.Column(db.Boolean, default=True)
    distance = db.Column(db.Float)
    elevation_gain = db.Column(db.Integer)
    date = db.Column(db.DateTime, nullable=False)
    meeting_point = db.Column(db.String(200), nullable=False)
    max_riders = db.Column(db.Integer, default=10)
    created_by = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    participants = db.relationship('RideParticipant', back_populates='ride', cascade='all, delete-orphan')
    
    @property
    def current_riders(self):
        return len(self.participants)
    
    @property
    def spots_available(self):
        return self.max_riders - self.current_riders
    
    @property
    def ebike_count(self):
        return sum(1 for p in self.participants if p.using_ebike)

class RideParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ride_id = db.Column(db.Integer, db.ForeignKey('ride.id'), nullable=False)
    rider_id = db.Column(db.Integer, db.ForeignKey('rider.id'), nullable=False)
    status = db.Column(db.String(20), default='confirmed')
    using_ebike = db.Column(db.Boolean, default=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    ride = db.relationship('Ride', back_populates='participants')
    rider = db.relationship('Rider', back_populates='participations')

class VisitorLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45))  # IPv6 can be up to 45 chars
    user_agent = db.Column(db.Text)
    page = db.Column(db.String(200))
    method = db.Column(db.String(10))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    referrer = db.Column(db.String(500))
    
    def __repr__(self):
        return f'<Visit {self.ip_address} -> {self.page} at {self.timestamp}>'