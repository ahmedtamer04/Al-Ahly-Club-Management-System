'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { registrationAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function EventsOfficeRegistrationsPage() {
  const [filter, setFilter] = useState('all');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, Workshop: 0, Trip: 0, Bazaar: 0 });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await registrationAPI.getRegistrationsForMyEvents();
      const regs = data.registrations || data.registrations || [];
      setRegistrations(regs);

      // compute stats
      const s = { total: regs.length, Workshop: 0, Trip: 0, Bazaar: 0 };
      regs.forEach(r => {
        const t = (r.event_id && r.event_id.type) || (r.event && r.event.type) || (r.event?.type);
        if (t && s[t] !== undefined) s[t] += 1;
      });
      setStats(s);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setError(err.message || 'Failed to load registrations');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">🎨 Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🎪 Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>All Registrations 🎫</h1>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.total}</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎨</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.Workshop}</h3>
                <p>Workshop Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.Trip}</h3>
                <p>Trip Registrations</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('all')}
              >
                All Events
              </button>
              <button 
                className={filter === 'Workshop' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Workshop')}
              >
                Workshops
              </button>
              <button 
                className={filter === 'Trip' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Trip')}
              >
                Trips
              </button>
              <button 
                className={filter === 'Bazaar' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Bazaar')}
              >
                Bazaars
              </button>
            </div>

            <div className="table-container" style={{marginTop: '1.5rem'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Event</th>
                    <th>Event Type</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        <div className="empty-state">Loading registrations…</div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        <div className="empty-state" style={{ color: 'red' }}>{error}</div>
                      </td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        <div className="empty-state">
                          <p>🎫 No registrations found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    registrations.filter(r => filter === 'all' || (r.event_id && r.event_id.type === filter) || (r.event && r.event.type === filter)).map(reg => (
                      <tr key={reg._id}>
                        <td>{reg.name || reg.user_id?.first_name + ' ' + reg.user_id?.last_name}</td>
                        <td>{(reg.event_id && reg.event_id.name) || (reg.event && reg.event.name) || 'N/A' }</td>
                        <td>{(reg.event_id && reg.event_id.type) || (reg.event && reg.event.type) || 'N/A'}</td>
                        <td>{new Date(reg.registration_date || reg.createdAt || reg.created_at || reg.createdAt).toLocaleString()}</td>
                        <td>{reg.payment_status || reg.status || 'registered'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
