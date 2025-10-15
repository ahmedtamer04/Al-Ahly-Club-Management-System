'use client';

import Link from 'next/link';
import '@/app/dashboard.css';

export default function EventsOfficeDashboard() {
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
          <h1>Events Office Dashboard 🎯</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎨</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Workshops</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Trips</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎪</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Bazaars</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Registrations</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <h2>Quick Actions</h2>
              <Link href="/eventsoffice/create" className="btn-primary">➕ Create New Event</Link>
            </div>
            <div className="admin-grid">
              <Link href="/eventsoffice/workshops" className="admin-card">
                <div className="admin-icon">🎨</div>
                <h3>Manage Workshops</h3>
                <p>Create and manage workshop events</p>
              </Link>
              <Link href="/eventsoffice/trips" className="admin-card">
                <div className="admin-icon">🚌</div>
                <h3>Manage Trips</h3>
                <p>Organize and manage trip events</p>
              </Link>
              <Link href="/eventsoffice/bazaars" className="admin-card">
                <div className="admin-icon">🎪</div>
                <h3>Manage Bazaars</h3>
                <p>Create bazaars and review vendor applications</p>
              </Link>
            </div>
          </section>

          <section className="section">
            <h2>Recent Events</h2>
            <div className="empty-state">
              <p>📅 No events created yet</p>
              <Link href="/eventsoffice/create" className="btn-primary">Create Your First Event</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
