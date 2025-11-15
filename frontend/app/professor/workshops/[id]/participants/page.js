'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { workshopAPI } from '@/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import '@/app/dashboard.css';

export default function WorkshopParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (workshopId) {
      fetchParticipants();
    }
  }, [workshopId]);

  const fetchParticipants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workshopAPI.getParticipants(workshopId);
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to load participants');
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      paid: '#28a745',
      free: '#17a2b8',
      pending: '#ffc107',
      refunded: '#6c757d'
    };
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: colors[status] || '#6c757d', color: 'white' }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
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
            <li><Link href="/professor/workshops" className="active">🎨 My Workshops</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <div>
              <button
                onClick={() => router.back()}
                className="btn-secondary"
                style={{ marginBottom: '10px' }}
              >
                ← Back to Workshops
              </button>
              <h1>Workshop Participants 👥</h1>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading participants...</p>
            </div>
          ) : data ? (
            <>
              {/* Workshop Info Card */}
              <section className="section">
                <div className="info-card">
                  <h2>📚 {data.workshop.name}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                    <div>
                      <strong>📍 Location:</strong><br />
                      {data.workshop.location}
                    </div>
                    <div>
                      <strong>📅 Start Date:</strong><br />
                      {formatDate(data.workshop.start_date)}
                    </div>
                    <div>
                      <strong>📅 End Date:</strong><br />
                      {formatDate(data.workshop.end_date)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Stats Cards */}
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{data.stats.registered}</h3>
                    <p>Total Registered</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{data.stats.capacity}</h3>
                    <p>Total Capacity</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-info">
                    <h3>{data.stats.remaining}</h3>
                    <p>Remaining Spots</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <h3>{data.stats.percentage_filled}%</h3>
                    <p>Filled</p>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <section className="section">
                <h2>Registered Participants ({data.participants.length})</h2>
                
                {data.participants.length === 0 ? (
                  <div className="empty-state">
                    <p>👥 No participants registered yet</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>ID Number</th>
                          <th>Payment Status</th>
                          <th>Registered At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.participants.map((participant, index) => (
                          <tr key={participant._id}>
                            <td>{index + 1}</td>
                            <td><strong>{participant.name}</strong></td>
                            <td>{participant.email}</td>
                            <td>
                              <span className="role-badge">
                                {participant.role}
                              </span>
                            </td>
                            <td>{participant.id_number}</td>
                            <td>{getPaymentStatusBadge(participant.payment_status)}</td>
                            <td>{formatDate(participant.registered_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </main>
      </div>

      <style jsx>{`
        .info-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid #007bff;
        }

        .info-card h2 {
          margin: 0 0 15px 0;
          color: #1a1a1a;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          background: #e7f5ff;
          color: #1864ab;
        }
      `}</style>
    </div>
  );
}
