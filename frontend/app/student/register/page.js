'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function RegisterEventPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    notes: '',
    specialRequirements: ''
  });

  const handleRegister = (e) => {
    e.preventDefault();
    // TODO: POST /api/registration/register
    alert('Registration submitted successfully!');
  };

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
            <li><Link href="/student/register">✍️ Register for Event</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Register for Event ✍️</h1>

          <section className="section">
            <h2>Step 1: Select Event</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search for events..."
              />
            </div>

            <div className="events-grid" style={{marginTop: '1.5rem'}}>
              <div className="empty-state">
                <p>📅 No events available for registration</p>
                <p style={{fontSize: '0.9rem', color: '#999'}}>
                  Browse upcoming events or check back later
                </p>
                <Link href="/student/events" className="btn-primary">Browse Events</Link>
              </div>
            </div>
          </section>

          {selectedEvent && (
            <section className="section">
              <h2>Step 2: Complete Registration</h2>
              <form onSubmit={handleRegister} className="settings-form">
                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any special requests or information..."
                    rows="3"
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                  />
                </div>

                <div className="form-group">
                  <label>Special Requirements</label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
                    placeholder="Dietary restrictions, accessibility needs, etc..."
                    rows="3"
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                  />
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <button type="submit" className="btn-primary">
                    ✅ Complete Registration
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setSelectedEvent(null)}>
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
