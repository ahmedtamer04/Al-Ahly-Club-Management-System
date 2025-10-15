'use client';

import Link from 'next/link';
import '@/app/dashboard.css';

export default function ProfessorConferencesPage() {
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
          <div className="page-header">
            <h1>My Conferences 🎓</h1>
            <Link href="/professor/create" className="btn-primary">➕ Create Conference</Link>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Conferences</p>
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
                <p>Total Attendees</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Conference Title</th>
                    <th>Date</th>
                    <th>Campus</th>
                    <th>Attendees</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🎓 No conferences yet</p>
                        <Link href="/professor/create" className="btn-primary">Create Your First Conference</Link>
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
