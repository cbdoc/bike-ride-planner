let allRides = [];
let currentUserEmail = localStorage.getItem('userEmail') || '';
let isAdmin = false;

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.querySelector('.nav-toggle');
    
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.querySelector('.nav-toggle');
    
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
}

async function checkAdminStatus() {
    try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        isAdmin = data.authenticated;
        
        document.getElementById('adminLink').style.display = isAdmin ? 'inline' : 'none';
        document.getElementById('loginLink').style.display = isAdmin ? 'none' : 'inline';
        document.getElementById('logoutLink').style.display = isAdmin ? 'inline' : 'none';
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

async function fetchRides() {
    try {
        const response = await fetch('/api/rides');
        allRides = await response.json();
        displayRides(allRides);
    } catch (error) {
        showNotification('Error fetching rides', 'error');
    }
}

function displayRides(rides) {
    const ridesList = document.getElementById('ridesList');
    
    if (rides.length === 0) {
        ridesList.innerHTML = `
            <div class="empty-state">
                <h3>No rides scheduled yet</h3>
                <p>Be the first to create a ride!</p>
                <button class="btn btn-primary" onclick="showCreateRideForm()">Create Ride</button>
            </div>
        `;
        return;
    }
    
    ridesList.innerHTML = rides.map(ride => `
        <div class="ride-card" onclick="showRideDetails(${ride.id})">
            <div class="ride-header">
                <div>
                    <h3 class="ride-title">${ride.title}</h3>
                    <p class="trail-name">${ride.trail_name}</p>
                </div>
                <span class="difficulty-badge difficulty-${ride.difficulty}">${ride.difficulty}</span>
            </div>
            <div class="ride-info">
                <p><strong>Date:</strong> ${formatDate(ride.date)}</p>
                <p><strong>Meeting Point:</strong> ${ride.meeting_point}</p>
                <p><strong>Organizer:</strong> ${ride.created_by}</p>
            </div>
            <div class="ride-stats">
                ${ride.distance ? `<div class="stat"><div class="stat-value">${ride.distance} km</div><div class="stat-label">Distance</div></div>` : ''}
                ${ride.elevation_gain ? `<div class="stat"><div class="stat-value">${ride.elevation_gain} m</div><div class="stat-label">Elevation</div></div>` : ''}
                <div class="stat">
                    <div class="stat-value">${ride.current_riders}/${ride.max_riders}</div>
                    <div class="stat-label">Riders</div>
                </div>
            </div>
            <div class="ride-footer">
                <div class="spots-indicator">
                    ${ride.spots_available > 0 
                        ? `<span class="spots-available">${ride.spots_available} spots available</span>`
                        : `<span class="spots-full">Ride Full</span>`
                    }
                </div>
                <div class="ride-type-info">
                    <span class="ride-type-badge ${ride.ride_type}">${ride.ride_type.charAt(0).toUpperCase() + ride.ride_type.slice(1)}</span>
                    ${ride.ebikes_allowed 
                        ? `<span class="ebike-allowed">E-bikes OK${ride.ebike_count > 0 ? ` (${ride.ebike_count})` : ''}</span>`
                        : `<span class="ebike-not-allowed">No E-bikes</span>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

async function showRideDetails(rideId) {
    try {
        const response = await fetch(`/api/rides/${rideId}`);
        const ride = await response.json();
        
        const isOrganizer = ride.created_by === currentUserEmail;
        const isParticipant = ride.participants.some(p => p.email === currentUserEmail);
        
        let actionButtons = '';
        if (isOrganizer) {
            actionButtons = `
                <button class="btn btn-secondary" onclick="showEditRideForm(${ride.id})">Edit Ride</button>
                <button class="btn btn-danger" onclick="deleteRide(${ride.id})">Delete Ride</button>
            `;
        } else if (isParticipant) {
            actionButtons = `<button class="btn btn-warning" onclick="leaveRide(${ride.id})">Leave Ride</button>`;
        } else if (ride.spots_available > 0) {
            actionButtons = `<button class="btn btn-success" onclick="showJoinRideForm(${ride.id}, ${ride.ebikes_allowed})">Join Ride</button>`;
        }
        
        const modalContent = `
            <h2>${ride.title}</h2>
            <div class="ride-details">
                <p><strong>Trail:</strong> ${ride.trail_name}</p>
                <p><strong>Ride Type:</strong> <span class="ride-type-badge ${ride.ride_type}">${ride.ride_type.charAt(0).toUpperCase() + ride.ride_type.slice(1)}</span></p>
                <p><strong>Difficulty:</strong> <span class="difficulty-badge difficulty-${ride.difficulty}">${ride.difficulty}</span></p>
                <p><strong>E-bikes:</strong> ${ride.ebikes_allowed ? `<span class="ebike-allowed">Allowed</span>` : `<span class="ebike-not-allowed">Not Allowed</span>`}</p>
                <p><strong>Date & Time:</strong> ${formatDate(ride.date)}</p>
                <p><strong>Meeting Point:</strong> ${ride.meeting_point}</p>
                ${ride.distance ? `<p><strong>Distance:</strong> ${ride.distance} km</p>` : ''}
                ${ride.elevation_gain ? `<p><strong>Elevation Gain:</strong> ${ride.elevation_gain} m</p>` : ''}
                <p><strong>Organizer:</strong> ${ride.created_by}</p>
                ${ride.description ? `<p><strong>Description:</strong> ${ride.description}</p>` : ''}
                
                <div class="participants-list">
                    <h3>Participants (${ride.current_riders}/${ride.max_riders})</h3>
                    ${ride.participants.length > 0 
                        ? ride.participants.map(p => `
                            <div class="participant">
                                <div class="participant-info">
                                    <span>${p.name}</span>
                                    <span class="skill-badge">${p.skill_level}</span>
                                    ${p.using_ebike ? '<span class="ebike-indicator">E-bike</span>' : ''}
                                </div>
                            </div>
                        `).join('')
                        : '<p>No participants yet</p>'
                    }
                </div>
                
                <div style="margin-top: 2rem;">
                    ${actionButtons}
                </div>
            </div>
        `;
        
        showModal(modalContent);
    } catch (error) {
        showNotification('Error loading ride details', 'error');
    }
}

async function showEditRideForm(rideId) {
    try {
        const response = await fetch(`/api/rides/${rideId}`);
        const ride = await response.json();
        
        // Format date for datetime-local input
        const dateForInput = new Date(ride.date).toISOString().slice(0, 16);
        
        const modalContent = `
            <h2>Edit Ride</h2>
            <form id="editRideForm" onsubmit="editRide(event, ${rideId})">
                <div class="form-group">
                    <label for="edit_title">Ride Title</label>
                    <input type="text" id="edit_title" value="${ride.title}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit_trail_name">Trail Name</label>
                    <input type="text" id="edit_trail_name" value="${ride.trail_name}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_ride_type">Ride Type</label>
                        <select id="edit_ride_type" required>
                            <option value="mountain" ${ride.ride_type === 'mountain' ? 'selected' : ''}>Mountain</option>
                            <option value="gravel" ${ride.ride_type === 'gravel' ? 'selected' : ''}>Gravel</option>
                            <option value="road" ${ride.ride_type === 'road' ? 'selected' : ''}>Road</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit_difficulty">Difficulty</label>
                        <select id="edit_difficulty" required>
                            <option value="beginner" ${ride.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="intermediate" ${ride.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="advanced" ${ride.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                            <option value="expert" ${ride.difficulty === 'expert' ? 'selected' : ''}>Expert</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_max_riders">Max Riders</label>
                        <input type="number" id="edit_max_riders" min="2" max="50" value="${ride.max_riders}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit_ebikes_allowed">E-bikes Allowed</label>
                        <select id="edit_ebikes_allowed" required>
                            <option value="true" ${ride.ebikes_allowed ? 'selected' : ''}>Yes</option>
                            <option value="false" ${!ride.ebikes_allowed ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit_distance">Distance (km)</label>
                        <input type="number" id="edit_distance" step="0.1" min="0" value="${ride.distance || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit_elevation_gain">Elevation Gain (m)</label>
                        <input type="number" id="edit_elevation_gain" min="0" value="${ride.elevation_gain || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit_date">Date & Time</label>
                    <input type="datetime-local" id="edit_date" value="${dateForInput}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit_meeting_point">Meeting Point</label>
                    <input type="text" id="edit_meeting_point" value="${ride.meeting_point}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit_description">Description (optional)</label>
                    <textarea id="edit_description" rows="3">${ride.description || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary">Update Ride</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        `;
        
        showModal(modalContent);
    } catch (error) {
        showNotification('Error loading ride details for editing', 'error');
    }
}

function showCreateRideForm() {
    closeMobileMenu();
    const modalContent = `
        <h2>Create New Ride</h2>
        <form id="createRideForm" onsubmit="createRide(event)">
            <div class="form-group">
                <label for="title">Ride Title</label>
                <input type="text" id="title" required>
            </div>
            
            <div class="form-group">
                <label for="trail_name">Trail Name</label>
                <input type="text" id="trail_name" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="ride_type">Ride Type</label>
                    <select id="ride_type" required>
                        <option value="mountain" selected>Mountain</option>
                        <option value="gravel">Gravel</option>
                        <option value="road">Road</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="difficulty">Difficulty</label>
                    <select id="difficulty" required>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate" selected>Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="max_riders">Max Riders</label>
                    <input type="number" id="max_riders" min="2" max="50" value="10" required>
                </div>
                
                <div class="form-group">
                    <label for="ebikes_allowed">E-bikes Allowed</label>
                    <select id="ebikes_allowed" required>
                        <option value="true" selected>Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="distance">Distance (km)</label>
                    <input type="number" id="distance" step="0.1" min="0">
                </div>
                
                <div class="form-group">
                    <label for="elevation_gain">Elevation Gain (m)</label>
                    <input type="number" id="elevation_gain" min="0">
                </div>
            </div>
            
            <div class="form-group">
                <label for="date">Date & Time</label>
                <input type="datetime-local" id="date" required>
            </div>
            
            <div class="form-group">
                <label for="meeting_point">Meeting Point</label>
                <input type="text" id="meeting_point" placeholder="e.g., Parking lot at trailhead" required>
            </div>
            
            <div class="form-group">
                <label for="description">Description (optional)</label>
                <textarea id="description" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label for="created_by">Your Name or Email</label>
                <input type="text" id="created_by" value="${currentUserEmail}" placeholder="Enter your name or email" required>
                <small class="form-note">This will be used to track your rides and allow you to edit them in the future.</small>
            </div>
            
            <button type="submit" class="btn btn-primary">Create Ride</button>
        </form>
    `;
    
    showModal(modalContent);
}

async function createRide(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        trail_name: document.getElementById('trail_name').value,
        ride_type: document.getElementById('ride_type').value,
        difficulty: document.getElementById('difficulty').value,
        ebikes_allowed: document.getElementById('ebikes_allowed').value === 'true',
        max_riders: parseInt(document.getElementById('max_riders').value),
        distance: parseFloat(document.getElementById('distance').value) || null,
        elevation_gain: parseInt(document.getElementById('elevation_gain').value) || null,
        date: document.getElementById('date').value,
        meeting_point: document.getElementById('meeting_point').value,
        description: document.getElementById('description').value,
        created_by: document.getElementById('created_by').value
    };
    
    currentUserEmail = formData.created_by;
    localStorage.setItem('userEmail', currentUserEmail);
    
    try {
        const response = await fetch('/api/rides', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Ride created successfully!', 'success');
            closeModal();
            fetchRides();
        } else {
            showNotification('Error creating ride', 'error');
        }
    } catch (error) {
        showNotification('Error creating ride', 'error');
    }
}

async function editRide(event, rideId) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('edit_title').value,
        trail_name: document.getElementById('edit_trail_name').value,
        ride_type: document.getElementById('edit_ride_type').value,
        difficulty: document.getElementById('edit_difficulty').value,
        ebikes_allowed: document.getElementById('edit_ebikes_allowed').value === 'true',
        max_riders: parseInt(document.getElementById('edit_max_riders').value),
        distance: parseFloat(document.getElementById('edit_distance').value) || null,
        elevation_gain: parseInt(document.getElementById('edit_elevation_gain').value) || null,
        date: document.getElementById('edit_date').value,
        meeting_point: document.getElementById('edit_meeting_point').value,
        description: document.getElementById('edit_description').value
    };
    
    try {
        const response = await fetch(`/api/rides/${rideId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Ride updated successfully!', 'success');
            closeModal();
            fetchRides();
        } else {
            showNotification('Error updating ride', 'error');
        }
    } catch (error) {
        showNotification('Error updating ride', 'error');
    }
}

function showJoinRideForm(rideId, ebikesAllowed) {
    const modalContent = `
        <h2>Join Ride</h2>
        <form id="joinRideForm" onsubmit="joinRide(event, ${rideId})">
            <div class="form-group">
                <label for="name">Your Name</label>
                <input type="text" id="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Your Email</label>
                <input type="email" id="email" value="${currentUserEmail}" required>
            </div>
            
            <div class="form-group">
                <label for="phone">Phone (optional)</label>
                <input type="tel" id="phone">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="skill_level">Skill Level</label>
                    <select id="skill_level" required>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate" selected>Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="using_ebike">Using E-bike?</label>
                    <select id="using_ebike" required ${!ebikesAllowed ? 'disabled' : ''}>
                        <option value="false" selected>No</option>
                        <option value="true" ${!ebikesAllowed ? 'disabled' : ''}>Yes</option>
                    </select>
                    ${!ebikesAllowed ? '<small class="form-note">E-bikes not allowed on this ride</small>' : ''}
                </div>
            </div>
            
            <button type="submit" class="btn btn-success">Join Ride</button>
        </form>
    `;
    
    showModal(modalContent);
}

async function joinRide(event, rideId) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        skill_level: document.getElementById('skill_level').value,
        using_ebike: document.getElementById('using_ebike').value === 'true'
    };
    
    currentUserEmail = formData.email;
    localStorage.setItem('userEmail', currentUserEmail);
    
    try {
        const response = await fetch(`/api/rides/${rideId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Successfully joined the ride!', 'success');
            closeModal();
            fetchRides();
        } else {
            showNotification(result.message || 'Error joining ride', 'error');
        }
    } catch (error) {
        showNotification('Error joining ride', 'error');
    }
}

async function leaveRide(rideId) {
    if (!confirm('Are you sure you want to leave this ride?')) return;
    
    try {
        const response = await fetch(`/api/rides/${rideId}/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: currentUserEmail })
        });
        
        if (response.ok) {
            showNotification('Successfully left the ride', 'success');
            closeModal();
            fetchRides();
        } else {
            showNotification('Error leaving ride', 'error');
        }
    } catch (error) {
        showNotification('Error leaving ride', 'error');
    }
}

async function deleteRide(rideId) {
    if (!confirm('Are you sure you want to delete this ride?')) return;
    
    try {
        const response = await fetch(`/api/rides/${rideId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Ride deleted successfully', 'success');
            closeModal();
            fetchRides();
        } else {
            showNotification('Error deleting ride', 'error');
        }
    } catch (error) {
        showNotification('Error deleting ride', 'error');
    }
}

function filterRides() {
    const rideTypeFilter = document.getElementById('rideTypeFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredRides = allRides;
    
    if (rideTypeFilter) {
        filteredRides = filteredRides.filter(ride => ride.ride_type === rideTypeFilter);
    }
    
    if (difficultyFilter) {
        filteredRides = filteredRides.filter(ride => ride.difficulty === difficultyFilter);
    }
    
    if (dateFilter) {
        filteredRides = filteredRides.filter(ride => {
            const rideDate = new Date(ride.date).toDateString();
            const filterDate = new Date(dateFilter).toDateString();
            return rideDate === filterDate;
        });
    }
    
    displayRides(filteredRides);
}

function clearFilters() {
    document.getElementById('rideTypeFilter').value = '';
    document.getElementById('difficultyFilter').value = '';
    document.getElementById('dateFilter').value = '';
    displayRides(allRides);
}

function showAllRides() {
    clearFilters();
    fetchRides();
    closeMobileMenu();
}

function showMyRides() {
    if (!currentUserEmail) {
        showNotification('Please join or create a ride first', 'warning');
        return;
    }
    
    const myRides = allRides.filter(ride => 
        ride.created_by === currentUserEmail || 
        ride.participants?.some(p => p.email === currentUserEmail)
    );
    
    displayRides(myRides);
    closeMobileMenu();
}

function showModal(content) {
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
    // Lock body scroll
    document.body.classList.add('modal-open');
    // Save current scroll position
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    // Unlock body scroll and restore position
    document.body.classList.remove('modal-open');
    const scrollY = document.body.style.top;
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return date.toLocaleString('en-US', options);
}

// Modal can only be closed with X button, Cancel button, or Escape key

async function showAdminLogin() {
    closeMobileMenu();
    const modalContent = `
        <h2>Admin Login</h2>
        <form id="adminLoginForm" onsubmit="adminLogin(event)">
            <div class="form-group">
                <label for="admin_username">Username</label>
                <input type="text" id="admin_username" required>
            </div>
            
            <div class="form-group">
                <label for="admin_password">Password</label>
                <input type="password" id="admin_password" required>
            </div>
            
            <button type="submit" class="btn btn-primary">Login</button>
        </form>
    `;
    
    showModal(modalContent);
}

async function adminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('admin_username').value;
    const password = document.getElementById('admin_password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            showNotification('Login successful!', 'success');
            closeModal();
            await checkAdminStatus();
            fetchRides();
        } else {
            showNotification('Invalid username or password', 'error');
        }
    } catch (error) {
        showNotification('Login failed', 'error');
    }
}

async function adminLogout() {
    closeMobileMenu();
    try {
        const response = await fetch('/api/admin/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Logged out successfully', 'success');
            await checkAdminStatus();
            fetchRides();
        }
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

async function showAdminPanel() {
    closeMobileMenu();
    try {
        const response = await fetch('/api/admin/rides');
        const rides = await response.json();
        
        const modalContent = `
            <h2>Admin Panel - All Rides</h2>
            <div class="admin-rides-list">
                ${rides.map(ride => `
                    <div class="admin-ride-item ${ride.is_expired ? 'expired' : ''}">
                        <div class="ride-info">
                            <h4>${ride.title}</h4>
                            <p>${ride.trail_name} - ${formatDate(ride.date)}</p>
                            <p>Created by: ${ride.created_by}</p>
                            <p>Riders: ${ride.current_riders}/${ride.max_riders}</p>
                            ${ride.is_expired ? '<p class="expired-label">EXPIRED (will auto-delete after 24hrs)</p>' : ''}
                        </div>
                        <button class="btn btn-danger btn-small" onclick="adminDeleteRide(${ride.id})">Delete</button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 2rem;">
                <p class="admin-note">Note: Rides are automatically removed 24 hours after their scheduled date.</p>
            </div>
        `;
        
        showModal(modalContent);
    } catch (error) {
        showNotification('Error loading admin panel', 'error');
    }
}

async function adminDeleteRide(rideId) {
    if (!confirm('Are you sure you want to delete this ride?')) return;
    
    try {
        const response = await fetch(`/api/admin/rides/${rideId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Ride deleted successfully', 'success');
            closeModal();
            fetchRides();
            // Refresh admin panel
            setTimeout(showAdminPanel, 500);
        } else {
            showNotification('Error deleting ride', 'error');
        }
    } catch (error) {
        showNotification('Error deleting ride', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus();
    fetchRides();
    
    // Modal can only be closed with X button, Cancel button, or Escape key
    // Removed click-outside-to-close functionality to prevent accidental data loss
    
    // Add escape key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('modal').style.display === 'block') {
            closeModal();
        }
    });
});