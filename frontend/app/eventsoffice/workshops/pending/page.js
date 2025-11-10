'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { workshopAPI } from '@/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import '@/app/dashboard.css';

export default function PendingWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingWorkshops();
  }, []);

  const fetchPendingWorkshops = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workshopAPI.getPending();
      setWorkshops(response.workshops || []);
    } catch (err) {
      setError(err.message || 'Failed to load pending workshops');
      console.error('Error fetching pending workshops:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/events">📅 View All Events</Link></li>
            <li><Link href="/eventsoffice/workshops/pending" className="active">🎨 Pending Workshops</Link></li>
            <li><Link href="/eventsoffice/conferences">🎓 Conferences</Link></li>
            <li><Link href="/eventsoffice/conferences/create">➕ Create Conference</Link></li>
            <li><Link href="/eventsoffice/trips">✈️ Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🛍️ Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">💪 Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/facilities">🏢 Facilities</Link></li>
            <li><Link href="/eventsoffice/vendors">👥 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/registrations">📋 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Pending Workshop Submissions 🎨</h1>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading pending workshops...</p>
              </div>
            ) : workshops.length === 0 ? (
              <div className="empty-state">
                <p>📭 No pending workshop submissions</p>
                <small>All workshop submissions have been reviewed</small>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workshop Name</th>
                      <th>Submitted By</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Capacity</th>
                      <th>Budget</th>
                      <th>Submitted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshops.map((workshop) => (
                      <tr key={workshop._id}>
                        <td>
                          <strong>{workshop.name}</strong>
                          <br />
                          <small style={{ color: '#666' }}>
                            {workshop.short_description?.substring(0, 60)}...
                          </small>
                        </td>
                        <td>
                          {workshop.created_by?.first_name} {workshop.created_by?.last_name}
                          <br />
                          <small>{workshop.created_by?.email}</small>
                        </td>
                        <td>
                          {formatDate(workshop.start_date)}
                          {workshop.start_date !== workshop.end_date && (
                            <> - {formatDate(workshop.end_date)}</>
                          )}
                          <br />
                          <small>{workshop.time}</small>
                        </td>
                        <td>{workshop.location}</td>
                        <td>{workshop.workshop?.capacity || 'N/A'}</td>
                        <td>
                          ${workshop.workshop?.required_budget || 0}
                          <br />
                          <small>({workshop.workshop?.funding_source})</small>
                        </td>
                        <td>{formatDate(workshop.createdAt)}</td>
                        <td>
                          <Link
                            href={`/eventsoffice/workshops/review/${workshop._id}`}
                            className="btn-primary"
                            style={{ fontSize: '14px', padding: '6px 12px' }}
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
