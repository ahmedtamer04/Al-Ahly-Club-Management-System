'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../dashboard.css';

export default function MyRegistrationsPage() {
  const [filter, setFilter] = useState('upcoming');

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
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>My Registrations 🎫</h1>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Attended</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="filter-buttons">
              <button 
                className={filter === 'upcoming' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={filter === 'past' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('past')}
              >
                Past Events
              </button>
              <button 
                className={filter === 'cancelled' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('cancelled')}
              >
                Cancelled
              </button>
            </div>

            <div className="table-container" style={{marginTop: '1.5rem'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🎫 No registrations found</p>
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
