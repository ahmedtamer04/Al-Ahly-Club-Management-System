'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { tripAPI, eventAPI } from '@/utils/api';
import EventsOfficeLayout from '@/app/components/EventsOfficeLayout';
import '@/app/dashboard.css';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTrip, setEditingTrip] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const availableRoles = ['Student', 'Staff', 'TA', 'Professor'];

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await tripAPI.getMyTrips();
      setTrips(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trip) => {
    if (!canEdit(trip)) return;
    setEditingTrip(trip._id);
    setEditFormData({
      name: trip.name,
      location: trip.location,
      price: trip.trip?.price || '',
      start_date: trip.start_date?.split('T')[0] || '',
      end_date: trip.end_date?.split('T')[0] || '',
      time: trip.time,
      short_description: trip.short_description,
      capacity: trip.trip?.capacity || '',
      registration_deadline: trip.trip?.registration_deadline?.split('T')[0] || '',
      allowed_roles: Array.isArray(trip.allowed_roles) ? trip.allowed_roles : [],
    });
    setMessage({ text: '', type: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      await tripAPI.edit(editingTrip, editFormData);
      setMessage({ text: 'Trip updated successfully!', type: 'success' });
      setEditingTrip(null);
      setEditFormData({});
      fetchTrips();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update trip', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEdit = (trip) => {
    // Check if trip start date hasn't passed yet
    const tripStartDate = new Date(trip.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tripStartDate >= today;
  };

  const handleDelete = async (tripId, tripName) => {
    if (!confirm(`Are you sure you want to delete "${tripName}"? This action cannot be undone.`)) return;
    setMessage({ text: '', type: '' });

    try {
      await eventAPI.delete(tripId);
      setMessage({ text: 'Trip deleted successfully!', type: 'success' });
      fetchTrips();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to delete trip', type: 'error' });
    }
  };

  const canDelete = (trip) => {
    // Can delete only if no one has registered
    return (trip.registrations?.length || 0) === 0;
  };

  const upcomingTrips = trips.filter(trip => new Date(trip.start_date) > new Date()).length;
  const totalTravelers = trips.reduce((sum, trip) => sum + (trip.registrations?.length || 0), 0);

  if (loading) {
    return (
      <EventsOfficeLayout>
        <div className="loading">Loading trips...</div>
      </EventsOfficeLayout>
    );
  }

  return (
    <EventsOfficeLayout>
          <div className="page-header">
            <h1>Trips 🚌</h1>
            <Link href="/eventsoffice/trips/create" className="btn-primary">
              ➕ Create Trip
            </Link>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <h3>{trips.length}</h3>
                <p>Total Trips</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>{upcomingTrips}</h3>
                <p>Upcoming</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{totalTravelers}</h3>
                <p>Total Travelers</p>
              </div>
            </div>
          </div>

          <section className="section">
            {trips.length === 0 ? (
              <div className="empty-state">
                <p>🚌 No trips organized yet</p>
                <Link href="/eventsoffice/trips/create" className="btn-primary">
                  Create First Trip
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trip Name</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Price</th>
                      <th>Capacity</th>
                      <th>Restrictions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip._id}>
                        <td>{trip.name}</td>
                        <td>{trip.location}</td>
                        <td>{formatDate(trip.start_date)}</td>
                        <td>{trip.trip?.price || 'N/A'} EGP</td>
                        <td>{trip.registrations?.length || 0}/{trip.trip?.capacity || 0}</td>
                        <td>
                          {Array.isArray(trip.allowed_roles) && trip.allowed_roles.length > 0 ? (
                            <span style={{ 
                              fontSize: '11px', 
                              padding: '4px 8px', 
                              backgroundColor: '#fff3cd', 
                              color: '#856404',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }} title={`Restricted to: ${trip.allowed_roles.join(', ')}`}>
                              🔒 {trip.allowed_roles.length} role{trip.allowed_roles.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#6c757d' }}>All roles</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            new Date(trip.start_date) > new Date() ? 'badge-success' : 'badge-secondary'
                          }`}>
                            {new Date(trip.start_date) > new Date() ? 'Upcoming' : 'Past'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleEdit(trip)}
                            className="btn-secondary btn-sm"
                            disabled={!canEdit(trip)}
                            title={!canEdit(trip) ? 'Cannot edit a trip that has already started' : 'Edit trip'}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(trip._id, trip.name)}
                            className="btn-secondary btn-sm"
                            disabled={!canDelete(trip)}
                            title={!canDelete(trip) ? 'Cannot delete: users have registered' : 'Delete trip'}
                            style={{ backgroundColor: canDelete(trip) ? '#dc3545' : undefined, borderColor: canDelete(trip) ? '#dc3545' : undefined, color: canDelete(trip) ? 'white' : undefined }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Edit Modal */}
          {editingTrip && (
            <div className="modal-overlay" onClick={() => setEditingTrip(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Trip</h2>
                  <button onClick={() => setEditingTrip(null)} className="btn-close">
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="form">
                  <div className="form-group">
                    <label>Trip Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.time}
                        onChange={(e) => setEditFormData({...editFormData, time: e.target.value})}
                        placeholder="e.g., 8:00 AM"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      rows="3"
                      required
                      value={editFormData.short_description}
                      onChange={(e) => setEditFormData({...editFormData, short_description: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.start_date}
                        onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.end_date}
                        onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (EGP) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Capacity *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editFormData.capacity}
                        onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Registration Deadline *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.registration_deadline}
                      onChange={(e) => setEditFormData({...editFormData, registration_deadline: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Restrict to Specific Roles (Optional)</label>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                      Select which user roles can view and register for this event. Leave empty to allow all roles.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {availableRoles.map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editFormData.allowed_roles?.includes(role) || false}
                            onChange={(e) => {
                              const currentRoles = editFormData.allowed_roles || [];
                              if (e.target.checked) {
                                setEditFormData({...editFormData, allowed_roles: [...currentRoles, role]});
                              } else {
                                setEditFormData({...editFormData, allowed_roles: currentRoles.filter(r => r !== role)});
                              }
                            }}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                    {editFormData.allowed_roles?.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#28a745', marginTop: '8px' }}>
                        ✓ Restricted to: {editFormData.allowed_roles.join(', ')}
                      </p>
                    )}
                    {(!editFormData.allowed_roles || editFormData.allowed_roles.length === 0) && (
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        All roles can access this event
                      </p>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setEditingTrip(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </EventsOfficeLayout>
  );
}
