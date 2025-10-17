'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/student">🏠 Dashboard</Link></li>
            <li><Link href="/student/events">📅 Browse Events</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        {/* Main Area */}
        <main className="main-content">
          <h1>Welcome, Student! 👋</h1>
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>My Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Attended Events</p>
              </div>
            </div>
          </div>

          {/* Available Events */}
          <section className="section">
            <h2>Available Events</h2>
            <div className="events-grid">
              <div className="empty-state">
                <p>🎪 No events available at the moment</p>
                <Link href="/student/events" className="btn-primary">Browse All Events</Link>
              </div>
            </div>
          </section>

          {/* My Registrations */}
          <section className="section">
            <h2>My Registrations</h2>
            <div className="registrations-list">
              <div className="empty-state">
                <p>🎫 You haven't registered for any events yet</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
