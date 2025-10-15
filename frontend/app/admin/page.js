'use client';

import Link from 'next/link';
import '../dashboard.css';

export default function AdminDashboard() {
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
          <h1>Admin Dashboard ⚙️</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Pending Applications</p>
              </div>
            </div>
          </div>

          <section className="section">
            <h2>System Overview</h2>
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
              <Link href="/admin/reports" className="admin-card">
                <div className="admin-icon">📊</div>
                <h3>Reports</h3>
                <p>Generate system reports and analytics</p>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
