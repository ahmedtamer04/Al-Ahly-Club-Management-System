'use client';

import Link from 'next/link';
import '@/app/dashboard.css';

export default function ProfessorDashboard() {
  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/workshops/create">➕ Create Workshop</Link></li>
            <li><Link href="/professor/conferences">🎓 Conferences</Link></li>
            <li><Link href="/professor/create">➕ Create Conference</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Welcome, Professor! 👋</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">�</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>My Workshops</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>My Conferences</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">�</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Attendees</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <h2>My Workshops</h2>
              <Link href="/professor/workshops/create" className="btn-primary">➕ Create Workshop</Link>
            </div>
            <div className="empty-state">
              <p>🎨 You haven't created any workshops yet</p>
              <Link href="/professor/workshops/create" className="btn-primary" style={{ marginTop: '1rem' }}>
                Create Your First Workshop
              </Link>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h2>My Conferences</h2>
              <Link href="/professor/create" className="btn-primary">➕ Create Conference</Link>
            </div>
            <div className="empty-state">
              <p>🎓 You haven't created any conferences yet</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
