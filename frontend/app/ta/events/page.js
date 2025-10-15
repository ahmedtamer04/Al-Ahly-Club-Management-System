'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../dashboard.css';

export default function TAEventsPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 TA Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/ta">🏠 Dashboard</Link></li>
            <li><Link href="/ta/events">📅 Browse Events</Link></li>
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Events 📅</h1>

          <section className="section">
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('all')}
              >
                All Events
              </button>
              <button 
                className={filter === 'Workshop' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Workshop')}
              >
                Workshops
              </button>
              <button 
                className={filter === 'Conference' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Conference')}
              >
                Conferences
              </button>
            </div>

            <div className="events-grid" style={{marginTop: '1.5rem'}}>
              <div className="empty-state">
                <p>📅 No events available</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
