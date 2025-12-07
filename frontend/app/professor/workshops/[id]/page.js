'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { workshopAPI, getUser } from '@/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import EventResourcesTab from '@/app/components/EventResourcesTab';
import '@/app/dashboard.css';

export default function WorkshopDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workshop, setWorkshop] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (workshopId) {
      fetchWorkshopDetails();
    }
  }, [workshopId]);

  const fetchWorkshopDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workshopAPI.getById(workshopId);
      setWorkshop(response);
    } catch (err) {
      setError(err.message || 'Failed to load workshop details');
      console.error('Error fetching workshop:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const user = getUser();
  const canUpload = workshop && user && (
    workshop.workshop?.created_by === user._id || 
    user.role === 'Admin' || 
    user.role === 'EventsOffice'
  );

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
            <li><Link href="/professor/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/professor/workshops" className="active">🎨 My Workshops</Link></li>
            <li><Link href="/professor/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <div>
              <button
                onClick={() => router.push('/professor/workshops')}
                className="btn-secondary"
                style={{ marginBottom: '10px' }}
              >
                ← Back to My Workshops
              </button>
              {!loading && workshop && <h1>{workshop.name}</h1>}
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
              <p>Loading workshop...</p>
            </div>
          ) : workshop ? (
            <>
              {/* Tab Navigation */}
              <div className="tabs-container">
                <button
                  className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  📋 Details
                </button>
                <button
                  className={`tab ${activeTab === 'participants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('participants')}
                >
                  👥 Participants
                </button>
                <button
                  className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  📚 Resources
                </button>
              </div>

              {/* Details Tab */}
              {activeTab === 'details' && (
                <section className="section">
                  <div className="info-card">
                    <h2>Workshop Information</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                      <div>
                        <strong>📍 Location:</strong><br />
                        {workshop.location}
                      </div>
                      <div>
                        <strong>📅 Start Date:</strong><br />
                        {formatDate(workshop.start_date)}
                      </div>
                      <div>
                        <strong>📅 End Date:</strong><br />
                        {formatDate(workshop.end_date)}
                      </div>
                      <div>
                        <strong>🕐 Time:</strong><br />
                        {workshop.time}
                      </div>
                      <div>
                        <strong>👥 Capacity:</strong><br />
                        {workshop.workshop?.capacity || 'N/A'}
                      </div>
                      <div>
                        <strong>📊 Status:</strong><br />
                        <span className={`status-badge status-${workshop.status}`}>
                          {workshop.status}
                        </span>
                      </div>
                    </div>

                    {workshop.short_description && (
                      <div style={{ marginTop: '20px' }}>
                        <strong>📝 Description:</strong><br />
                        <p style={{ marginTop: '10px', lineHeight: '1.6' }}>{workshop.short_description}</p>
                      </div>
                    )}

                    {workshop.workshop && (
                      <>
                        {workshop.workshop.full_agenda && (
                          <div style={{ marginTop: '20px' }}>
                            <strong>📋 Full Agenda:</strong><br />
                            <p style={{ marginTop: '10px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                              {workshop.workshop.full_agenda}
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                          {workshop.workshop.faculty_responsible && (
                            <div>
                              <strong>🏛️ Faculty:</strong><br />
                              {workshop.workshop.faculty_responsible}
                            </div>
                          )}
                          {workshop.workshop.professors_participating && (
                            <div>
                              <strong>👨‍🏫 Professors:</strong><br />
                              {Array.isArray(workshop.workshop.professors_participating) 
                                ? workshop.workshop.professors_participating.join(', ')
                                : workshop.workshop.professors_participating}
                            </div>
                          )}
                          {workshop.workshop.required_budget && (
                            <div>
                              <strong>💰 Budget:</strong><br />
                              {workshop.workshop.required_budget} EGP
                            </div>
                          )}
                          {workshop.workshop.funding_source && (
                            <div>
                              <strong>💵 Funding:</strong><br />
                              {workshop.workshop.funding_source}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Participants Tab */}
              {activeTab === 'participants' && (
                <section className="section">
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ marginBottom: '20px' }}>View detailed participant information</p>
                    <button
                      onClick={() => router.push(`/professor/workshops/${workshopId}/participants`)}
                      className="btn-primary"
                    >
                      👥 View All Participants
                    </button>
                  </div>
                </section>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div>
                  <EventResourcesTab 
                    eventId={workshopId}
                    canUpload={true}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Workshop not found</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
