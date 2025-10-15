'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function VendorRequestsPage() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });

  const handleAccept = (applicationId) => {
    // TODO: POST /api/admin/vendor-requests/:applicationId/accept
    console.log('Accept vendor application:', applicationId);
  };

  const handleReject = (applicationId) => {
    // TODO: POST /api/admin/vendor-requests/:applicationId/reject
    console.log('Reject vendor application:', applicationId);
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
          <h1>Vendor Requests 🏪</h1>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Requests</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending Review</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.accepted}</h3>
                <p>Accepted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats.rejected}</h3>
                <p>Rejected</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <h2>Vendor Applications</h2>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('pending')}
                >
                  ⏳ Pending
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'accepted' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('accepted')}
                >
                  ✅ Accepted
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('rejected')}
                >
                  ❌ Rejected
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Event Type</th>
                    <th>Event Name</th>
                    <th>Business Type</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" className="empty-row">
                      <div className="empty-state">
                        <p>🏪 No vendor applications yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999', marginTop: '10px'}}>
                          TODO API Endpoints:<br/>
                          GET /api/admin/vendor-requests - Get all vendor applications<br/>
                          GET /api/admin/vendor-requests/stats - Get statistics<br/>
                          GET /api/admin/vendor-requests/:applicationId - Get specific application<br/>
                          POST /api/admin/vendor-requests/:applicationId/accept - Accept application<br/>
                          POST /api/admin/vendor-requests/:applicationId/reject - Reject application
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="section">
            <h2>Recent Activity</h2>
            <div className="activity-feed">
              <div className="empty-state">
                <p>📊 No recent vendor application activity</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
