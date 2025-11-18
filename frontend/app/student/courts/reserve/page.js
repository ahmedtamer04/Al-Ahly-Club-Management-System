'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { courtReservationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function ReserveCourtPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [reserving, setReserving] = useState({});

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = getUser();
      if (userData) {
        setUser(userData);
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isClient && user && selectedDate) {
      fetchAvailableCourts();
    }
  }, [isClient, user, selectedDate, selectedSport]);

  const fetchAvailableCourts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { date: selectedDate };
      if (selectedSport !== 'all') {
        params.sport = selectedSport;
      }
      const response = await courtReservationAPI.getAvailableCourts(params);
      setCourts(response.courts || []);
    } catch (err) {
      console.error('Error fetching available courts:', err);
      setError(err.response?.data?.message || 'Failed to load available courts');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (facilityId, time) => {
    const key = `${facilityId}-${time}`;
    setReserving(prev => ({ ...prev, [key]: true }));
    setError('');
    setSuccess('');

    try {
      const response = await courtReservationAPI.createReservation({
        facility_id: facilityId,
        reservation_date: selectedDate,
        reservation_time: time
      });
      
      setSuccess(`Court reserved successfully for ${time}!`);
      fetchAvailableCourts(); // Refresh to show updated availability
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve court');
    } finally {
      setReserving(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isClient || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/student">🏠 Dashboard</Link></li>
            <li><Link href="/student/events">📅 Browse Events</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/payment-history">💰 Payment History</Link></li>
            <li><Link href="/student/courts/reserve" className="active">🏀 Reserve Court</Link></li>
            <li><Link href="/student/courts/my-reservations">📋 My Reservations</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Reserve a Court 🏀</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Reserve a basketball, tennis, or football court by selecting an available date and time slot.
            Your name and GUC ID will be automatically included in the reservation.
          </p>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fee',
              color: '#dc3545',
              borderRadius: '8px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              border: '1px solid #28a745'
            }}>
              ✅ {success}
            </div>
          )}

          {/* Filters */}
          <section className="section" style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div>
                <label htmlFor="date" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Select Date:
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label htmlFor="sport" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Filter by Sport:
                </label>
                <select
                  id="sport"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Sports</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Football">Football</option>
                </select>
              </div>
            </div>
            {selectedDate && (
              <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                📅 Showing availability for: <strong>{formatDate(selectedDate)}</strong>
              </p>
            )}
          </section>

          {/* Available Courts */}
          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
              Loading available courts...
            </div>
          ) : courts.length === 0 ? (
            <div className="empty-state">
              <p>🏀 No courts available for the selected date and filters</p>
              <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                This could mean:
              </p>
              <ul style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem', textAlign: 'left', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                <li>All time slots for this date are already reserved</li>
                <li>No courts match your selected sport filter</li>
                <li>Try selecting a different date</li>
              </ul>
            </div>
          ) : (
            <section className="section">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '1.5rem'
              }}>
                {courts.map((court) => (
                  <div
                    key={court._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '2px solid #e0e0e0'
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{court.name}</h3>
                      <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        📍 {court.location || 'Location not specified'}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        🏀 {court.sport} {court.indoor ? '(Indoor)' : '(Outdoor)'}
                      </p>
                    </div>

                    {court.available_times.length === 0 ? (
                      <div style={{
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        textAlign: 'center',
                        color: '#999'
                      }}>
                        No available time slots for this date
                      </div>
                    ) : (
                      <div>
                        <p style={{ marginBottom: '1rem', fontWeight: '600', color: '#333' }}>
                          Available Times:
                        </p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {court.available_times.map((time) => {
                            const key = `${court._id}-${time}`;
                            const isReserving = reserving[key];
                            return (
                              <button
                                key={time}
                                onClick={() => handleReserve(court._id, time)}
                                disabled={isReserving}
                                style={{
                                  padding: '0.75rem 1.25rem',
                                  background: isReserving ? '#ccc' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: isReserving ? 'not-allowed' : 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isReserving) {
                                    e.currentTarget.style.background = '#218838';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isReserving) {
                                    e.currentTarget.style.background = '#28a745';
                                  }
                                }}
                              >
                                {isReserving ? 'Reserving...' : time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

