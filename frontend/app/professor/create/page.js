'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../dashboard.css';

export default function CreateConferencePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    campus: 'Main Campus',
    location: '',
    maxAttendees: 100,
    topic: '',
    speakers: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit to backend
    alert('Conference created successfully!');
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/conferences">🎓 Conferences</Link></li>
            <li><Link href="/professor/create">➕ Create Conference</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Create New Conference 🎓</h1>

          <section className="section">
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-group">
                <label>Conference Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., AI in Education Conference 2025"
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your conference..."
                  rows="4"
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Campus *</label>
                <select
                  value={formData.campus}
                  onChange={(e) => setFormData({...formData, campus: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                >
                  <option>Main Campus</option>
                  <option>Downtown Campus</option>
                  <option>New Cairo Campus</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location/Room *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Auditorium Hall A"
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Maximum Attendees *</label>
                <input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({...formData, maxAttendees: e.target.value})}
                  min="1"
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Main Topic</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="e.g., Artificial Intelligence, Machine Learning"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Featured Speakers</label>
                <textarea
                  value={formData.speakers}
                  onChange={(e) => setFormData({...formData, speakers: e.target.value})}
                  placeholder="List the main speakers (one per line)"
                  rows="3"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                />
              </div>

              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button type="submit" className="btn-primary">
                  ✅ Create Conference
                </button>
                <Link href="/professor/conferences" className="btn-secondary">
                  ❌ Cancel
                </Link>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
