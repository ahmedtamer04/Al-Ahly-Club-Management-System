'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function StudentFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventComments, setEventComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationEvent, setRegistrationEvent] = useState(null);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    personalId: ''
  });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/favorites', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (eventId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/favorites/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav._id !== eventId));
        alert('Removed from favorites!');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove favorite');
    }
  };

  const fetchEventComments = async (eventId) => {
    try {
      setLoadingComments(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setEventComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setEventComments({ comments: [], totalComments: 0, averageRating: null });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setEventComments(null);
    fetchEventComments(event._id);
  };

  const handleRegisterClick = (event) => {
    if (event.type !== 'Workshop' && event.type !== 'Trip') {
      alert('Registration is only available for Workshops and Trips');
      return;
    }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRegistrationForm({
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        personalId: user.id_number
      });
    }
    
    setRegistrationEvent(event);
    setShowRegistrationModal(true);
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        alert('User data not found. Please login again.');
        setRegistering(false);
        return;
      }

      const user = JSON.parse(userStr);
      
      const response = await fetch('/api/registration/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: registrationEvent._id,
          name: registrationForm.name,
          email: registrationForm.email,
          personalId: registrationForm.personalId,
          role: user.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      alert('Registration successful! Check "My Workshops" to see your registration.');
      setShowRegistrationModal(false);
      setRegistrationForm({ name: '', email: '', personalId: '' });
      
    } catch (err) {
      alert(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#ffd700' : '#ddd', fontSize: '1.2rem' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/events">📅 Events</Link></li>
            <li><Link href="/professor/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>My Favorites ⭐</h1>

          <section className="section">
            {loading && <p>Loading favorites...</p>}

            {!loading && favorites.length === 0 ? (
              <div className="empty-state">
                <p>⭐ You haven't added any favorites yet</p>
                <Link href="/professor/events">
                  <button className="btn-primary" style={{ marginTop: '1rem' }}>
                    Browse Events
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  You have {favorites.length} favorite event{favorites.length !== 1 ? 's' : ''}
                </p>
                <div className="events-grid">
                  {favorites.map(event => (
                    <div key={event._id} className="event-card">
                      <h3>{event.name}</h3>
                      <p><strong>Type:</strong> {event.type}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>Date:</strong> {formatDate(event.start_date)}</p>
                      <p style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {event.short_description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleViewDetails(event)}
                          style={{ flex: 1 }}
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => removeFavorite(event._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                          title="Remove from favorites"
                        >
                          🗑️
                        </button>
                      </div>

                      {(event.type === 'Workshop' || event.type === 'Trip') && (
                        <button 
                          onClick={() => handleRegisterClick(event)}
                          style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}
                        >
                          📝 Register for Event
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {/* Event Details Modal - Same as before */}
      {selectedEvent && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedEvent(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              color: '#333'
            }}
          >
            <button 
              onClick={() => setSelectedEvent(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <h2>{selectedEvent.name}</h2>
            <p><strong>Type:</strong> {selectedEvent.type}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            <p><strong>Start Date:</strong> {formatDate(selectedEvent.start_date)}</p>
            <p><strong>End Date:</strong> {formatDate(selectedEvent.end_date)}</p>
            <p><strong>Time:</strong> {selectedEvent.time}</p>
            <p><strong>Status:</strong> <span style={{
              color: selectedEvent.status === 'upcoming' ? '#28a745' : '#6c757d',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}>{selectedEvent.status}</span></p>
            <p><strong>Description:</strong> {selectedEvent.short_description}</p>
            
            <hr style={{margin: '1.5rem 0'}} />
            
            {/* Workshop Details */}
            {selectedEvent.type === 'Workshop' && selectedEvent.workshop && (
              <div>
                <h3>Workshop Details</h3>
                {selectedEvent.workshop.faculty_responsible && (
                  <p><strong>Faculty Responsible:</strong> {selectedEvent.workshop.faculty_responsible}</p>
                )}
                {selectedEvent.workshop.professors_participating && selectedEvent.workshop.professors_participating.length > 0 && (
                  <p><strong>Professors:</strong> {selectedEvent.workshop.professors_participating.join(', ')}</p>
                )}
                {selectedEvent.workshop.capacity && (
                  <p><strong>Capacity:</strong> {selectedEvent.workshop.capacity} attendees</p>
                )}
                {selectedEvent.workshop.registration_deadline && (
                  <p><strong>Registration Deadline:</strong> {formatDate(selectedEvent.workshop.registration_deadline)}</p>
                )}
                {selectedEvent.workshop.required_budget && (
                  <p><strong>Budget:</strong> ${selectedEvent.workshop.required_budget}</p>
                )}
                {selectedEvent.workshop.funding_source && (
                  <p><strong>Funding Source:</strong> {selectedEvent.workshop.funding_source}</p>
                )}
                {selectedEvent.workshop.extra_resources && (
                  <p><strong>Extra Resources:</strong> {selectedEvent.workshop.extra_resources}</p>
                )}
                {selectedEvent.workshop.full_agenda && (
                  <>
                    <p><strong>Full Agenda:</strong></p>
                    <p style={{whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px'}}>
                      {selectedEvent.workshop.full_agenda}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Trip Details */}
            {selectedEvent.type === 'Trip' && selectedEvent.trip && (
              <div>
                <h3>Trip Details</h3>
                {selectedEvent.trip.price && (
                  <p><strong>Price:</strong> ${selectedEvent.trip.price}</p>
                )}
                {selectedEvent.trip.capacity && (
                  <p><strong>Capacity:</strong> {selectedEvent.trip.capacity} attendees</p>
                )}
                {selectedEvent.trip.registration_deadline && (
                  <p><strong>Registration Deadline:</strong> {formatDate(selectedEvent.trip.registration_deadline)}</p>
                )}
              </div>
            )}

            {/* Conference Details */}
            {selectedEvent.type === 'Conference' && selectedEvent.conference && (
              <div>
                <h3>Conference Details</h3>
                {selectedEvent.conference.campus && (
                  <p><strong>Campus:</strong> {selectedEvent.conference.campus}</p>
                )}
                {selectedEvent.conference.professors_participating && selectedEvent.conference.professors_participating.length > 0 && (
                  <p><strong>Professors:</strong> {selectedEvent.conference.professors_participating.join(', ')}</p>
                )}
                {selectedEvent.conference.conference_website && (
                  <p><strong>Website:</strong> <a href={selectedEvent.conference.conference_website} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}>{selectedEvent.conference.conference_website}</a></p>
                )}
                {selectedEvent.conference.required_budget && (
                  <p><strong>Budget:</strong> ${selectedEvent.conference.required_budget}</p>
                )}
                {selectedEvent.conference.funding_source && (
                  <p><strong>Funding Source:</strong> {selectedEvent.conference.funding_source}</p>
                )}
                {selectedEvent.conference.extra_required_sources && (
                  <p><strong>Extra Required Sources:</strong> {selectedEvent.conference.extra_required_sources}</p>
                )}
                {selectedEvent.conference.full_agenda && (
                  <>
                    <p><strong>Full Agenda:</strong></p>
                    <p style={{whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px'}}>
                      {selectedEvent.conference.full_agenda}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Bazaar Details */}
            {selectedEvent.type === 'Bazaar' && selectedEvent.bazaar && (
              <div>
                <h3>Bazaar Details</h3>
                {selectedEvent.bazaar.registration_deadline && (
                  <p><strong>Vendor Registration Deadline:</strong> {formatDate(selectedEvent.bazaar.registration_deadline)}</p>
                )}
                
                {selectedEvent.bazaar.vendors_participating && selectedEvent.bazaar.vendors_participating.length > 0 && (
                  <>
                    <h4 style={{marginTop: '1.5rem'}}>Participating Vendors ({selectedEvent.bazaar.vendors_participating.length})</h4>
                    <div style={{display: 'grid', gap: '1rem', marginTop: '1rem'}}>
                      {selectedEvent.bazaar.vendors_participating.map((vendor, idx) => (
                        <div key={idx} style={{
                          border: '1px solid #ddd',
                          padding: '1rem',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9'
                        }}>
                          {vendor.vendor_name && (
                            <p><strong>🏪 Vendor:</strong> {vendor.vendor_name}</p>
                          )}
                          {vendor.booth_number && (
                            <p><strong>Booth Number:</strong> {vendor.booth_number}</p>
                          )}
                          {vendor.products && vendor.products.length > 0 && (
                            <p><strong>Products:</strong> {vendor.products.join(', ')}</p>
                          )}
                          {vendor.payment_status && (
                            <p><strong>Payment Status:</strong> <span style={{
                              color: vendor.payment_status === 'paid' ? '#28a745' : vendor.payment_status === 'pending' ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}>{vendor.payment_status}</span></p>
                          )}
                          {vendor.registration_date && (
                            <p style={{fontSize: '0.9rem', color: '#666'}}><strong>Registered:</strong> {formatDate(vendor.registration_date)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {(!selectedEvent.bazaar.vendors_participating || selectedEvent.bazaar.vendors_participating.length === 0) && (
                  <p style={{fontStyle: 'italic', color: '#888', marginTop: '1rem'}}>No vendors registered yet</p>
                )}
              </div>
            )}

            {/* Booth Details */}
            {selectedEvent.type === 'Booth' && selectedEvent.booth && (
              <div>
                <h3>Booth Details</h3>
                
                {selectedEvent.booth.vendors && selectedEvent.booth.vendors.length > 0 && (
                  <>
                    <h4 style={{marginTop: '1.5rem'}}>Vendors ({selectedEvent.booth.vendors.length})</h4>
                    <div style={{display: 'grid', gap: '1rem', marginTop: '1rem'}}>
                      {selectedEvent.booth.vendors.map((vendor, idx) => (
                        <div key={idx} style={{
                          border: '1px solid #ddd',
                          padding: '1rem',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9'
                        }}>
                          {vendor.vendor_name && (
                            <p><strong>🏪 Vendor:</strong> {vendor.vendor_name}</p>
                          )}
                          {vendor.company_name && (
                            <p><strong>Company:</strong> {vendor.company_name}</p>
                          )}
                          {vendor.booth_assignment && (
                            <p><strong>Booth Assignment:</strong> {vendor.booth_assignment}</p>
                          )}
                          {vendor.setup_time && (
                            <p><strong>Setup Time:</strong> {vendor.setup_time}</p>
                          )}
                          {vendor.contact_info && (
                            <div style={{marginTop: '0.5rem'}}>
                              {vendor.contact_info.phone && (
                                <p><strong>Phone:</strong> {vendor.contact_info.phone}</p>
                              )}
                              {vendor.contact_info.email && (
                                <p><strong>Email:</strong> {vendor.contact_info.email}</p>
                              )}
                            </div>
                          )}
                          {vendor.assigned_date && (
                            <p style={{fontSize: '0.9rem', color: '#666'}}><strong>Assigned:</strong> {formatDate(vendor.assigned_date)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {(!selectedEvent.booth.vendors || selectedEvent.booth.vendors.length === 0) && (
                  <p style={{fontStyle: 'italic', color: '#888', marginTop: '1rem'}}>No vendors assigned yet</p>
                )}
              </div>
            )}

            <hr style={{margin: '1.5rem 0'}} />

            {/* Comments Section */}
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Ratings & Comments</h3>
              
              {loadingComments && <p>Loading comments...</p>}

              {!loadingComments && eventComments && (
                <>
                  {eventComments.averageRating && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                          {eventComments.averageRating}
                        </div>
                        <div>{renderStars(Math.round(eventComments.averageRating))}</div>
                      </div>
                      <div style={{ color: '#666' }}>
                        <p>{eventComments.totalRatings} ratings</p>
                        <p>{eventComments.totalComments} comments</p>
                      </div>
                    </div>
                  )}

                  {eventComments.comments && eventComments.comments.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {eventComments.comments.map((comment) => (
                        <div
                          key={comment._id}
                          style={{
                            border: '1px solid #e0e0e0',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>{comment.user_id?.name || 'Anonymous'}</strong>
                            {comment.rating && (
                              <div>{renderStars(comment.rating)}</div>
                            )}
                          </div>
                          {comment.comment && (
                            <p style={{ margin: '0.5rem 0', color: '#333' }}>{comment.comment}</p>
                          )}
                          <small style={{ color: '#888' }}>
                            {formatDateTime(comment.createdAt)}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#888' }}>No comments yet</p>
                  )}
                </>
              )}
            </div>
            
            <button 
              className="btn-primary" 
              style={{marginTop: '1.5rem', width: '100%'}}
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && registrationEvent && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowRegistrationModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              color: '#333'
            }}
          >
            <h2>Register for {registrationEvent.name}</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              <strong>Type:</strong> {registrationEvent.type}
            </p>
            
            <form onSubmit={handleRegistrationSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Name:
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Email:
                </label>
                <input
                  type="email"
                  required
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Personal ID:
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.personalId}
                  onChange={(e) => setRegistrationForm({...registrationForm, personalId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="submit"
                  disabled={registering}
                  className="btn-primary"
                  style={{ 
                    flex: 1,
                    opacity: registering ? 0.7 : 1,
                    cursor: registering ? 'not-allowed' : 'pointer'
                  }}
                >
                  {registering ? 'Registering...' : 'Register'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  disabled={registering}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: registering ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}