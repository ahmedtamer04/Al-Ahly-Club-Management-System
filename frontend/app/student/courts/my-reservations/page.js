'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { courtReservationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function MyCourtReservationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = getUser();
      if (userData) {
        setUser(userData);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isClient && user) {
      fetchReservations();
    }
  }, [isClient, user]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await courtReservationAPI.getMyReservations();
      setReservations(response.reservations || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await courtReservationAPI.cancelReservation(reservationId);
      alert('Reservation cancelled successfully!');
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
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
            <li><Link href="/student/courts/reserve">🏀 Reserve Court</Link></li>
            <li><Link href="/student/courts/my-reservations" className="active">📋 My Reservations</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>My Court Reservations 📋</h1>
            <Link href="/student/courts/reserve" className="btn-primary">
              + Reserve Court
            </Link>
          </div>

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

          {loading ? (
            <div className="loading">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="empty-state">
              <p>📋 You don't have any court reservations</p>
              <Link href="/student/courts/reserve" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Reserve a Court
              </Link>
            </div>
          ) : (
            <section className="section">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '1.5rem'
              }}>
                {reservations.map((reservation) => {
                  const reservationDate = new Date(reservation.reservation_date);
                  const isPast = reservationDate < new Date();
                  
                  return (
                    <div
                      key={reservation._id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: isPast ? '2px solid #6c757d' : '2px solid #28a745',
                        opacity: isPast ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                            {reservation.facility.name}
                          </h3>
                          <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                            📍 {reservation.facility.location || 'Location not specified'}
                          </p>
                          <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                            🏀 {reservation.facility.sport}
                            {reservation.facility.indoor && ' (Indoor)'}
                          </p>
                        </div>
                        {isPast && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: '#6c757d',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            Past
                          </span>
                        )}
                      </div>

                      <div style={{
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>Date:</strong> {formatDate(reservation.reservation_date)}
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>Time:</strong> {reservation.reservation_time}
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>Reserved by:</strong> {reservation.student_name}
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>GUC ID:</strong> {reservation.guc_id}
                        </p>
                      </div>

                      {!isPast && (
                        <button
                          onClick={() => handleCancel(reservation._id)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}
                        >
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

