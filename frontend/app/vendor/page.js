'use client';

import Link from 'next/link';
import '../dashboard.css';

export default function VendorDashboard() {
  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 Vendor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Welcome, Vendor! 👋</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Pending Applications</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Approved Booths</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎪</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Available Bazaars</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <h2>Available Bazaars</h2>
              <Link href="/vendor/bazaars" className="btn-primary">Browse All</Link>
            </div>
            <div className="empty-state">
              <p>🎪 No bazaars available for applications</p>
            </div>
          </section>

          <section className="section">
            <h2>My Applications</h2>
            <div className="empty-state">
              <p>📋 You haven't submitted any booth applications yet</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
