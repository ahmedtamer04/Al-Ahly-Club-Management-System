'use client';

import Link from 'next/link';
import '@/app/dashboard.css';

export default function StaffDashboard() {
  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍💼 Staff Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/staff">🏠 Dashboard</Link></li>
            <li><Link href="/staff/events">📅 Browse Events</Link></li>
            <li><Link href="/staff/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Welcome, Staff Member! 👋</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Registered Events</p>
              </div>
            </div>
          </div>

          <section className="section">
            <h2>Available Events</h2>
            <div className="empty-state">
              <p>🎪 No events available</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
