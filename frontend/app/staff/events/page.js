'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function StaffEventsPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          <h1>Browse Events 📅</h1>

          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
            </div>

            <div className="events-grid">
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
