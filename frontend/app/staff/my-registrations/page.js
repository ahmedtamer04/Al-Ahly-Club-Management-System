'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { registrationAPI, getUser } from '@/utils/api';
import StaffLayout from '@/app/components/StaffLayout';
import '@/app/dashboard.css';

export default function StaffMyRegistrationsPage() {
  const [filter, setFilter] = useState('upcoming');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = getUser();
      if (!user || !user._id) {
        setError('Please log in to view your registrations.');
        return;
      }

      const response = await registrationAPI.getMyRegistrations(user._id);
      let registrationData = [];
      if (response && response.registrations) {
        registrationData = response.registrations;
      } else if (Array.isArray(response)) {
        registrationData = response;
      } else if (response && response.upcoming) {
        registrationData = [...(response.upcoming || []), ...(response.past || [])];
      }
      
      setRegistrations(registrationData);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError('Failed to load your registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId, eventName) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
      return;
    }

    try {
      const response = await registrationAPI.cancel(registrationId);
      let alertMessage = response.data?.message || 'Registration cancelled successfully!';
      if (response.data?.refund) {
        alertMessage = `Registration cancelled successfully!\n\nRefund: $${response.data.refund.amount} has been added to your wallet.`;
      }
      alert(alertMessage);
      fetchRegistrations();
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Please try again.';
      alert('Failed to cancel registration: ' + errorMessage);
    }
  };

  const getFilteredRegistrations = () => {
    const now = new Date();
    return registrations.filter(registration => {
      if (filter === 'all') return true;
      if (filter === 'upcoming') {
        return registration.event && new Date(registration.event.start_date) >= now && registration.status === 'registered';
      }
      if (filter === 'past') {
        return registration.event && new Date(registration.event.start_date) < now;
      }
      if (filter === 'cancelled') {
        return registration.status === 'canceled';
      }
      return true;
    });
  };

  const filteredRegistrations = getFilteredRegistrations();

  return (
    <StaffLayout>
      <h1>My Registrations 🎫</h1>

      {error && (
        <div className="alert alert-error" style={{marginBottom: '2rem'}}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-info">
            <h3>{loading ? '...' : registrations.length}</h3>
            <p>Total Registrations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{loading ? '...' : registrations.filter(r => {
              const now = new Date();
              return r.event && new Date(r.event.start_date) >= now && r.status === 'registered';
            }).length}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{loading ? '...' : registrations.filter(r => {
              const now = new Date();
              return r.event && new Date(r.event.start_date) < now && r.status === 'registered';
            }).length}</h3>
            <p>Attended</p>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'upcoming' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={filter === 'past' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('past')}
          >
            Past Events
          </button>
          <button 
            className={filter === 'cancelled' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>

        <div className="table-container" style={{marginTop: '1.5rem'}}>
          {loading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}>
              <p>Loading your registrations...</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🎫 No registrations found for "{filter}" events</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <tr key={registration._id}>
                      <td>
                        <strong>{registration.event?.name || 'Unknown Event'}</strong>
                      </td>
                      <td>
                        <span className={`event-type event-type-${registration.event?.type?.toLowerCase() || 'default'}`}>
                          {registration.event?.type || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        {registration.event?.start_date ? 
                          new Date(registration.event.start_date).toLocaleDateString() : 'TBD'}
                      </td>
                      <td>{registration.event?.location || 'TBD'}</td>
                      <td>
                        <span className={`badge ${
                          registration.status === 'registered' ? 'badge-success' :
                          registration.status === 'canceled' ? 'badge-secondary' :
                          'badge-warning'
                        }`}>
                          {registration.status === 'registered' ? '✅ Registered' :
                           registration.status === 'canceled' ? '❌ Cancelled' :
                           registration.status}
                        </span>
                      </td>
                      <td>
                        {registration.status === 'registered' && (
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => handleCancelRegistration(
                              registration._id, 
                              registration.event?.name || 'Unknown Event'
                            )}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </StaffLayout>
  );
}
