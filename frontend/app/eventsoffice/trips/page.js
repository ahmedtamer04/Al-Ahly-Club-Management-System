'use client';

import Link from 'next/link';
import '@/app/dashboard.css';

export default function TripsPage() {
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
          <div className="page-header">
            <h1>Trips 🚌</h1>
            <Link href="/eventsoffice/create" className="btn-primary">➕ Create Trip</Link>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Trips</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Upcoming</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Travelers</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trip Destination</th>
                    <th>Date</th>
                    <th>Transportation</th>
                    <th>Travelers</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🚌 No trips organized yet</p>
                        <Link href="/eventsoffice/create" className="btn-primary">Organize Your First Trip</Link>
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
