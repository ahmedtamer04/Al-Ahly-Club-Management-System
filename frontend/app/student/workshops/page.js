'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function StudentWorkshopsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/student">🏠 Dashboard</Link></li>
            <li><Link href="/student/events">📅 Browse Events</Link></li>
            <li><Link href="/student/workshops">🎓 Workshops</Link></li>
            <li><Link href="/student/trips">🚌 Trips</Link></li>
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Available Workshops 🎓</h1>

          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search workshops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Instructor</th>
                    <th>Location</th>
                    <th>Available Seats</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" className="empty-row">
                      <div className="empty-state">
                        <p>🎓 No workshops available</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/events/upcoming (filter by type: workshop)
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="section">
            <h2>Popular Workshop Topics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💻</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Tech Workshops</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎨</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Creative Arts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💼</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Professional Dev</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏃</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Fitness & Sports</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
