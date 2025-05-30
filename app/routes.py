from flask import Blueprint, render_template, jsonify, request, session
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import Ride, Rider, RideParticipant, Admin
from datetime import datetime, timedelta
from functools import wraps

main = Blueprint('main', __name__)

def remove_expired_rides():
    """Remove rides that are more than 24 hours past their scheduled date"""
    expired_date = datetime.utcnow() - timedelta(hours=24)
    expired_rides = Ride.query.filter(Ride.date < expired_date).all()
    for ride in expired_rides:
        db.session.delete(ride)
    db.session.commit()
    return len(expired_rides)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'message': 'Admin authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    admin = Admin.query.filter_by(username=username).first()
    if admin and admin.check_password(password):
        login_user(admin)
        return jsonify({'message': 'Login successful', 'username': admin.username}), 200
    
    return jsonify({'message': 'Invalid username or password'}), 401

@main.route('/api/admin/logout', methods=['POST'])
@login_required
def admin_logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@main.route('/api/admin/check', methods=['GET'])
def check_admin():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'username': current_user.username}), 200
    return jsonify({'authenticated': False}), 200

@main.route('/api/rides', methods=['GET', 'POST'])
def rides():
    # Auto-remove expired rides on each request
    remove_expired_rides()
    
    if request.method == 'POST':
        data = request.json
        new_ride = Ride(
            title=data['title'],
            description=data.get('description', ''),
            trail_name=data['trail_name'],
            difficulty=data['difficulty'],
            ride_type=data.get('ride_type', 'mountain'),
            ebikes_allowed=data.get('ebikes_allowed', True),
            distance=data.get('distance'),
            elevation_gain=data.get('elevation_gain'),
            date=datetime.fromisoformat(data['date']),
            meeting_point=data['meeting_point'],
            max_riders=data.get('max_riders', 10),
            created_by=data['created_by']
        )
        db.session.add(new_ride)
        db.session.commit()
        return jsonify({'message': 'Ride created successfully', 'id': new_ride.id}), 201
    
    upcoming_rides = Ride.query.filter(Ride.date >= datetime.utcnow()).order_by(Ride.date).all()
    rides_data = []
    for ride in upcoming_rides:
        rides_data.append({
            'id': ride.id,
            'title': ride.title,
            'description': ride.description,
            'trail_name': ride.trail_name,
            'difficulty': ride.difficulty,
            'ride_type': ride.ride_type,
            'ebikes_allowed': ride.ebikes_allowed,
            'ebike_count': ride.ebike_count,
            'distance': ride.distance,
            'elevation_gain': ride.elevation_gain,
            'date': ride.date.isoformat(),
            'meeting_point': ride.meeting_point,
            'max_riders': ride.max_riders,
            'current_riders': ride.current_riders,
            'spots_available': ride.spots_available,
            'created_by': ride.created_by
        })
    return jsonify(rides_data)

@main.route('/api/rides/<int:ride_id>', methods=['GET', 'PUT', 'DELETE'])
def ride_detail(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    
    if request.method == 'DELETE':
        db.session.delete(ride)
        db.session.commit()
        return jsonify({'message': 'Ride deleted successfully'}), 200
    
    if request.method == 'PUT':
        data = request.json
        
        # Update ride fields
        ride.title = data.get('title', ride.title)
        ride.description = data.get('description', ride.description)
        ride.trail_name = data.get('trail_name', ride.trail_name)
        ride.difficulty = data.get('difficulty', ride.difficulty)
        ride.ride_type = data.get('ride_type', ride.ride_type)
        ride.ebikes_allowed = data.get('ebikes_allowed', ride.ebikes_allowed)
        ride.distance = data.get('distance', ride.distance)
        ride.elevation_gain = data.get('elevation_gain', ride.elevation_gain)
        ride.meeting_point = data.get('meeting_point', ride.meeting_point)
        ride.max_riders = data.get('max_riders', ride.max_riders)
        
        if 'date' in data:
            ride.date = datetime.fromisoformat(data['date'])
        
        db.session.commit()
        return jsonify({'message': 'Ride updated successfully'}), 200
    
    participants = []
    for p in ride.participants:
        participants.append({
            'id': p.rider.id,
            'name': p.rider.name,
            'email': p.rider.email,
            'skill_level': p.rider.skill_level,
            'status': p.status,
            'using_ebike': p.using_ebike
        })
    
    return jsonify({
        'id': ride.id,
        'title': ride.title,
        'description': ride.description,
        'trail_name': ride.trail_name,
        'difficulty': ride.difficulty,
        'ride_type': ride.ride_type,
        'ebikes_allowed': ride.ebikes_allowed,
        'ebike_count': ride.ebike_count,
        'distance': ride.distance,
        'elevation_gain': ride.elevation_gain,
        'date': ride.date.isoformat(),
        'meeting_point': ride.meeting_point,
        'max_riders': ride.max_riders,
        'current_riders': ride.current_riders,
        'spots_available': ride.spots_available,
        'created_by': ride.created_by,
        'participants': participants
    })

@main.route('/api/riders', methods=['GET', 'POST'])
def riders():
    if request.method == 'POST':
        data = request.json
        
        existing_rider = Rider.query.filter_by(email=data['email']).first()
        if existing_rider:
            return jsonify({'message': 'Rider with this email already exists', 'id': existing_rider.id}), 200
        
        new_rider = Rider(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            skill_level=data.get('skill_level', 'intermediate')
        )
        db.session.add(new_rider)
        db.session.commit()
        return jsonify({'message': 'Rider created successfully', 'id': new_rider.id}), 201
    
    all_riders = Rider.query.all()
    riders_data = []
    for rider in all_riders:
        riders_data.append({
            'id': rider.id,
            'name': rider.name,
            'email': rider.email,
            'phone': rider.phone,
            'skill_level': rider.skill_level
        })
    return jsonify(riders_data)

@main.route('/api/rides/<int:ride_id>/join', methods=['POST'])
def join_ride(ride_id):
    ride = Ride.query.get_or_404(ride_id)
    data = request.json
    
    if ride.spots_available <= 0:
        return jsonify({'message': 'No spots available for this ride'}), 400
    
    if not ride.ebikes_allowed and data.get('using_ebike', False):
        return jsonify({'message': 'E-bikes are not allowed on this ride'}), 400
    
    rider = Rider.query.filter_by(email=data['email']).first()
    if not rider:
        rider = Rider(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            skill_level=data.get('skill_level', 'intermediate')
        )
        db.session.add(rider)
        db.session.commit()
    
    existing_participant = RideParticipant.query.filter_by(
        ride_id=ride_id,
        rider_id=rider.id
    ).first()
    
    if existing_participant:
        return jsonify({'message': 'Already registered for this ride'}), 400
    
    participant = RideParticipant(
        ride_id=ride_id,
        rider_id=rider.id,
        status='confirmed',
        using_ebike=data.get('using_ebike', False)
    )
    db.session.add(participant)
    db.session.commit()
    
    return jsonify({'message': 'Successfully joined the ride'}), 201

@main.route('/api/rides/<int:ride_id>/leave', methods=['POST'])
def leave_ride(ride_id):
    data = request.json
    rider = Rider.query.filter_by(email=data['email']).first()
    
    if not rider:
        return jsonify({'message': 'Rider not found'}), 404
    
    participant = RideParticipant.query.filter_by(
        ride_id=ride_id,
        rider_id=rider.id
    ).first()
    
    if not participant:
        return jsonify({'message': 'Not registered for this ride'}), 400
    
    db.session.delete(participant)
    db.session.commit()
    
    return jsonify({'message': 'Successfully left the ride'}), 200

@main.route('/api/admin/rides', methods=['GET'])
@admin_required
def admin_get_all_rides():
    """Admin endpoint to get all rides including past ones"""
    all_rides = Ride.query.order_by(Ride.date.desc()).all()
    rides_data = []
    for ride in all_rides:
        rides_data.append({
            'id': ride.id,
            'title': ride.title,
            'trail_name': ride.trail_name,
            'difficulty': ride.difficulty,
            'ride_type': ride.ride_type,
            'date': ride.date.isoformat(),
            'meeting_point': ride.meeting_point,
            'created_by': ride.created_by,
            'current_riders': ride.current_riders,
            'max_riders': ride.max_riders,
            'is_expired': ride.date < datetime.utcnow()
        })
    return jsonify(rides_data)

@main.route('/api/admin/rides/<int:ride_id>', methods=['DELETE'])
@admin_required
def admin_delete_ride(ride_id):
    """Admin endpoint to delete any ride"""
    ride = Ride.query.get_or_404(ride_id)
    db.session.delete(ride)
    db.session.commit()
    return jsonify({'message': 'Ride deleted successfully by admin'}), 200