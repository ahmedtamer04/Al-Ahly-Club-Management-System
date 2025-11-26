'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { registrationAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function EventsOfficeRegistrationsPage() {
  const [filter, setFilter] = useState('all');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, Workshop: 0, Trip: 0, Bazaar: 0 });
  const [totalsBreakdown, setTotalsBreakdown] = useState({ all: 0, registered: 0, pending: 0, canceled: 0 });
  const [exporting, setExporting] = useState({});

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
      // breakdown by status/payment
      const breakdown = data.totals || { all: regs.length, registered: regs.filter(r => r.status === 'registered').length, pending: regs.filter(r => r.payment_status === 'pending').length, canceled: regs.filter(r => r.status === 'canceled').length };
      setTotalsBreakdown(breakdown);
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
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{loading ? '...' : totalsBreakdown.registered}</h3>
                    <p>Confirmed</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>{loading ? '...' : totalsBreakdown.pending}</h3>
                    <p>Pending</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🗑️</div>
                  <div className="stat-info">
                    <h3>{loading ? '...' : totalsBreakdown.canceled}</h3>
                    <p>Canceled</p>
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
                    // Group registrations by event so we can provide per-event export buttons
                    Object.values(registrations.reduce((acc, reg) => {
                      const ev = reg.event_id || reg.event || {};
                      const id = ev._id || ev.id || 'unknown';
                      if (!acc[id]) acc[id] = { event: ev, regs: [] };
                      acc[id].regs.push(reg);
                      return acc;
                    }, {})).filter(group => filter === 'all' || (group.event && group.event.type === filter)).map(group => (
                      <React.Fragment key={group.event._id || group.event.id || Math.random()}>
                        <tr style={{ background: '#f6f8fa' }}>
                          <td colSpan="3"><strong>{group.event.name || 'Unnamed Event'}</strong> <small style={{ color: '#666', marginLeft: '8px' }}>({group.event.type || 'Type N/A'})</small></td>
                          <td style={{ textAlign: 'right' }} colSpan="2">
                            {group.event.type === 'Conference' ? (
                              <button disabled className="btn-secondary" title="Exports disabled for conferences">📄 Export (disabled)</button>
                            ) : (
                              <button
                                className="btn-primary"
                                onClick={async () => {
                                  const id = group.event._id || group.event.id;
                                  try {
                                    setExporting(prev => ({ ...prev, [id]: true }));
                                    const blob = await registrationAPI.exportEventRegistrations(id);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    const safeName = (group.event.name || id).replace(/[^a-z0-9\-_. ]/gi, '').replace(/\s+/g, '_');
                                    a.download = `${safeName}_registrations.xlsx`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Export failed:', err);
                                    alert('Failed to export registrations: ' + (err.message || err));
                                  } finally {
                                    setExporting(prev => ({ ...prev, [group.event._id || group.event.id]: false }));
                                  }
                                }}
                                disabled={exporting[group.event._id || group.event.id]}
                                title="Export registrations to .xlsx"
                              >
                                {exporting[group.event._id || group.event.id] ? 'Exporting…' : 'Export .xlsx'}
                              </button>
                            )}
                          </td>
                        </tr>

                        {group.regs.map(reg => (
                          <tr key={reg._id}>
                            <td>{reg.name || reg.user_id?.first_name + ' ' + reg.user_id?.last_name}</td>
                            <td>{group.event.name || (reg.event_id && reg.event_id.name) || 'N/A' }</td>
                            <td>{group.event.type || (reg.event_id && reg.event_id.type) || 'N/A'}</td>
                            <td>{new Date(reg.registration_date || reg.createdAt || reg.created_at || reg.createdAt).toLocaleString()}</td>
                            <td>{reg.payment_status || reg.status || 'registered'}</td>
                          </tr>
                        ))}
                      </React.Fragment>
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
