'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function TAFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventComments, setEventComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // ADD these registration states:
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

      const response = await fetch('http://localhost:5000/api/favorites', {
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

      const response = await fetch(`http://localhost:5000/api/favorites/${eventId}`, {
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

      const response = await fetch(`http://localhost:5000/api/events/${eventId}/comments`, {
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

  // ADD these registration functions:
  const handleRegisterClick = (event) => {
    if (event.type !== 'Workshop' && event.type !== 'Trip') {
      alert('Registration is only available for Workshops and Trips');
      return;
    }
    setRegistrationEvent(event);
    setShowRegistrationModal(true);
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/registration/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: registrationEvent._id,
          role: 'TA',
          ...registrationForm
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      alert('Registration successful! Check "My Events" to see your registration.');
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
            <span className="nav-user">👨‍🏫 TA Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/ta">🏠 Dashboard</Link></li>
            <li><Link href="/ta/events">📅 Browse Events</Link></li>
            <li><Link href="/ta/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/ta/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>My Favorites ⭐</h1>

          <section className="section">
            {loading && <p>Loading favorites...</p>}

            {!loading && favorites.length === 0 ? (
              <div className="empty-state">
                <p>⭐ You haven't added any favorites yet</p>
                <Link href="/ta/events">
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

                      {/* ADD Register button for Workshop and Trip */}
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

      {/* Modal - Same as events page */}
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
            <p><strong>Description:</strong> {selectedEvent.short_description}</p>
            
            <hr style={{margin: '1.5rem 0'}} />
            
            {selectedEvent.type === 'Conference' && selectedEvent.conference && (
              <div>
                <h3>Conference Details</h3>
                <p><strong>Campus:</strong> {selectedEvent.conference.campus}</p>
                <p><strong>Professors:</strong> {selectedEvent.conference.professors_participating?.join(', ')}</p>
                <p><strong>Website:</strong> <a href={selectedEvent.conference.conference_website} target="_blank" rel="noopener noreferrer">{selectedEvent.conference.conference_website}</a></p>
                <p><strong>Budget:</strong> ${selectedEvent.conference.required_budget}</p>
                <p><strong>Funding Source:</strong> {selectedEvent.conference.funding_source}</p>
                <p><strong>Agenda:</strong></p>
                <p style={{whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px'}}>
                  {selectedEvent.conference.full_agenda}
                </p>
              </div>
            )}

            {selectedEvent.type === 'Workshop' && selectedEvent.workshop && (
              <div>
                <h3>Workshop Details</h3>
                <p><strong>Campus:</strong> {selectedEvent.workshop.campus}</p>
                <p><strong>Professors:</strong> {selectedEvent.workshop.professors_participating?.join(', ')}</p>
                <p><strong>Max Attendees:</strong> {selectedEvent.workshop.max_attendees}</p>
                <p><strong>Materials Needed:</strong> {selectedEvent.workshop.materials_needed?.join(', ')}</p>
                <p><strong>Budget:</strong> ${selectedEvent.workshop.required_budget}</p>
              </div>
            )}

            {selectedEvent.type === 'Trip' && selectedEvent.trip && (
              <div>
                <h3>Trip Details</h3>
                <p><strong>Destination:</strong> {selectedEvent.trip.destination}</p>
                <p><strong>Transportation:</strong> {selectedEvent.trip.transportation_method}</p>
                <p><strong>Max Attendees:</strong> {selectedEvent.trip.max_attendees}</p>
                <p><strong>Price per Person:</strong> ${selectedEvent.trip.price_per_person}</p>
                <p><strong>Itinerary:</strong></p>
                <p style={{whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px'}}>
                  {selectedEvent.trip.full_itinerary}
                </p>
              </div>
            )}

            {selectedEvent.type === 'Bazaar' && (
              <div>
                <h3>Bazaar Details</h3>
                {selectedEvent.bazaar && (
                  <>
                    <p><strong>Theme:</strong> {selectedEvent.bazaar.theme}</p>
                    <p><strong>Total Booths:</strong> {selectedEvent.bazaar.total_booths}</p>
                    <p><strong>Booth Price:</strong> ${selectedEvent.bazaar.booth_price}</p>
                  </>
                )}
                
                {selectedEvent.vendors && selectedEvent.vendors.length > 0 && (
                  <>
                    <h4 style={{marginTop: '1.5rem'}}>Participating Vendors ({selectedEvent.vendors.length})</h4>
                    <div style={{display: 'grid', gap: '1rem', marginTop: '1rem'}}>
                      {selectedEvent.vendors.map((vendor, idx) => (
                        <div key={idx} style={{
                          border: '1px solid #ddd',
                          padding: '1rem',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9'
                        }}>
                          <p><strong>🏪 {vendor.business_name}</strong></p>
                          <p><strong>Booth:</strong> {vendor.booth_number || 'TBA'}</p>
                          <p><strong>Products/Services:</strong> {vendor.products_services}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <hr style={{margin: '1.5rem 0'}} />

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

      {/* ADD Registration Modal */}
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