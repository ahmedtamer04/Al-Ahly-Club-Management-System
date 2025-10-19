'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function FacilitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/student/workshops">🔧 Workshops</Link></li>
            <li><Link href="/student/trips">🚌 Trips</Link></li>
            <li><Link href="/student/register">📝 Event Registration</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Available Facilities 🏟️</h1>

          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={filterType === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button 
                  className={filterType === 'court' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('court')}
                >
                  Courts
                </button>
                <button 
                  className={filterType === 'field' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('field')}
                >
                  Fields
                </button>
                <button 
                  className={filterType === 'hall' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('hall')}
                >
                  Halls
                </button>
              </div>
            </div>

            <div className="admin-grid" style={{marginTop: '1.5rem'}}>
              <div className="empty-state">
                <p>🏟️ No facilities available</p>
                <p style={{fontSize: '0.9rem', color: '#999'}}>
                  API: GET /api/facilities/getAll
                </p>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Facility Types</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏀</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Basketball Courts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚽</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Football Fields</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎾</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Tennis Courts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏛️</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Multi-purpose Halls</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
