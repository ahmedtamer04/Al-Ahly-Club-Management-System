'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';
import api from '@/utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    pendingApplications: 0,
    pendingUsers: 0,
    blockedUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersResponse = await api.get('/admin/users');
      const users = usersResponse.users || [];
      
      // Fetch pending users
      const pendingResponse = await api.get('/admin/pending-users');
      const pendingUsers = pendingResponse.users || [];
      
      // Fetch all events
      const eventsResponse = await api.get('/events/all');
      const events = Array.isArray(eventsResponse) ? eventsResponse : [];
      
      // Fetch all registrations
      const registrationsResponse = await api.get('/admin/registrations');
      const registrations = registrationsResponse.registrations || [];
      
      // Fetch vendor applications stats
      const vendorStatsResponse = await api.get('/admin/vendor-requests/stats');
      const vendorStats = vendorStatsResponse.statistics?.overall || {};
      
      // Fetch recent vendor applications
      const vendorAppsResponse = await api.get('/admin/vendor-requests?status=pending&limit=5');
      const recentApps = vendorAppsResponse.applications || [];
      
      // Calculate stats
      setStats({
        totalUsers: users.length,
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        pendingApplications: vendorStats.pending_requests || 0,
        pendingUsers: pendingUsers.length,
        blockedUsers: users.filter(u => u.status === 'blocked').length
      });
      
      // Set recent data
      setRecentUsers(users.slice(0, 5));
      setRecentApplications(recentApps);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Admin Dashboard ⚙️</h1>
          
          {loading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}>
              <p>⏳ Loading dashboard data...</p>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{stats.totalEvents}</h3>
                    <p>Total Events</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎫</div>
                  <div className="stat-info">
                    <h3>{stats.totalRegistrations}</h3>
                    <p>Total Registrations</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏪</div>
                  <div className="stat-info">
                    <h3>{stats.pendingApplications}</h3>
                    <p>Vendor Applications</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>{stats.pendingUsers}</h3>
                    <p>Pending Approvals</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🚫</div>
                  <div className="stat-info">
                    <h3>{stats.blockedUsers}</h3>
                    <p>Blocked Users</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem'}}>
            {/* Recent Pending Users */}
            <section className="section">
              <h2>Pending User Approvals ⏳</h2>
              {stats.pendingUsers === 0 ? (
                <p style={{color: '#999', padding: '1rem'}}>No pending user approvals</p>
              ) : (
                <>
                  <p style={{marginBottom: '1rem'}}>
                    <strong>{stats.pendingUsers}</strong> user(s) waiting for approval
                  </p>
                  <Link href="/admin/users" className="btn btn-primary">
                    View Pending Users →
                  </Link>
                </>
              )}
            </section>

            {/* Recent Vendor Applications */}
            <section className="section">
              <h2>Vendor Applications 🏪</h2>
              {stats.pendingApplications === 0 ? (
                <p style={{color: '#999', padding: '1rem'}}>No pending vendor applications</p>
              ) : (
                <>
                  <p style={{marginBottom: '1rem'}}>
                    <strong>{stats.pendingApplications}</strong> application(s) pending review
                  </p>
                  <Link href="/admin/vendors" className="btn btn-primary">
                    Review Applications →
                  </Link>
                </>
              )}
            </section>
          </div>

          <section className="section">
            <h2>Quick Actions</h2>
            <div className="admin-grid">
              <Link href="/admin/users" className="admin-card">
                <div className="admin-icon">👥</div>
                <h3>Manage Users</h3>
                <p>View and manage all system users</p>
              </Link>
              <Link href="/admin/events" className="admin-card">
                <div className="admin-icon">📅</div>
                <h3>All Events</h3>
                <p>Manage all events in the system</p>
              </Link>
              <Link href="/admin/vendors" className="admin-card">
                <div className="admin-icon">🏪</div>
                <h3>Vendor Applications</h3>
                <p>Review and approve vendor applications</p>
              </Link>
              <Link href="/admin/registrations" className="admin-card">
                <div className="admin-icon">🎫</div>
                <h3>Registrations</h3>
                <p>View all event registrations</p>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
