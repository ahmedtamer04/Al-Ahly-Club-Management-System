'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function StudentTripsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

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
            <li><Link href="/student/trips">🚌 Trips</Link></li>
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Available Trips 🚌</h1>

          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search trips by destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('all')}
                >
                  All Trips
                </button>
                <button 
                  className={filter === 'upcoming' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('upcoming')}
                >
                  Upcoming
                </button>
                <button 
                  className={filter === 'registered' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('registered')}
                >
                  My Trips
                </button>
              </div>
            </div>

            <div className="admin-grid" style={{marginTop: '1.5rem'}}>
              <div className="empty-state">
                <p>🚌 No trips available at the moment</p>
                <p style={{fontSize: '0.9rem', color: '#999'}}>
                  API: GET /api/trips/list<br/>
                  GET /api/trips/get/:id
                </p>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Trip Categories</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏖️</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Beach Trips</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏔️</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Mountain Trips</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏛️</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Cultural Trips</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎢</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Entertainment</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
