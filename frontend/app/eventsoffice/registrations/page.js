'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../dashboard.css';

export default function EventsOfficeRegistrationsPage() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">🎨 Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🎪 Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>All Registrations 🎫</h1>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎨</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Workshop Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Trip Registrations</p>
              </div>
            </div>
          </div>

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
                className={filter === 'Trip' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Trip')}
              >
                Trips
              </button>
              <button 
                className={filter === 'Bazaar' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('Bazaar')}
              >
                Bazaars
              </button>
            </div>

            <div className="table-container" style={{marginTop: '1.5rem'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Event</th>
                    <th>Event Type</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="5" className="empty-row">
                      <div className="empty-state">
                        <p>🎫 No registrations yet</p>
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
