'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function VendorApplicationsPage() {
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // TODO: Fetch vendor applications - GET /api/admin/vendor-requests
  // TODO: Fetch vendor stats - GET /api/admin/vendor-requests/stats

  const handleViewApplication = (applicationId) => {
    // TODO: GET /api/admin/vendor-requests/:applicationId
    console.log('View application:', applicationId);
  };

  const handleAcceptApplication = (applicationId) => {
    if (confirm('Are you sure you want to accept this vendor application?')) {
      // TODO: POST /api/admin/vendor-requests/:applicationId/accept
      console.log('Accept application:', applicationId);
    }
  };

  const handleRejectApplication = (applicationId) => {
    const reason = prompt('Enter rejection reason (optional):');
    // TODO: POST /api/admin/vendor-requests/:applicationId/reject
    console.log('Reject application:', applicationId, 'Reason:', reason);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">⚙️ Admin Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 Manage Users</Link></li>
            <li><Link href="/admin/events">📅 All Events</Link></li>
            <li><Link href="/admin/registrations">🎫 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Reports</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Vendor Applications 🏪</h1>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Applications</p>
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
                <h3>{stats.approved}</h3>
                <p>Approved</p>
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
          <small style={{color: '#999', marginBottom: '1rem', display: 'block'}}>
            API: GET /api/admin/vendor-requests/stats
          </small>

          {/* Filters */}
          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by vendor name or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('approved')}
                >
                  Approved
                </button>
                <button 
                  className={filter === 'rejected' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('rejected')}
                >
                  Rejected
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Business Name</th>
                    <th>Type</th>
                    <th>Event</th>
                    <th>Application Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" className="empty-row">
                      <div className="empty-state">
                        <p>🏪 No vendor applications found</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/admin/vendor-requests (all applications)<br/>
                          GET /api/admin/vendor-requests/:applicationId (specific application)<br/>
                          POST /api/admin/vendor-requests/:applicationId/accept (approve)<br/>
                          POST /api/admin/vendor-requests/:applicationId/reject (reject)
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
