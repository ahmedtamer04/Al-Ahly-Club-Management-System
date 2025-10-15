'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function GymSchedulePage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [selectedDay, setSelectedDay] = useState(null);

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
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Gym Schedule 🏋️</h1>

          <section className="section">
            <div className="form-group" style={{maxWidth: '300px'}}>
              <label>Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
              />
            </div>

            <div style={{marginTop: '2rem'}}>
              <h3>Available Sessions</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Instructor</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <div className="empty-state">
                          <p>🏋️ No gym sessions scheduled for this month</p>
                          <p style={{fontSize: '0.9rem', color: '#999'}}>
                            API: GET /api/gym-sessions/schedule?month={selectedMonth}
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Session Details</h2>
            <div className="empty-state">
              <p>Select a session to view details</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
