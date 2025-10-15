'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function CreateGymSessionPage() {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    duration: '60',
    instructor: '',
    maxCapacity: '20',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/gym-sessions/create
    console.log('Create gym session:', formData);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">📋 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">� Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">� Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Manage Gym Sessions 🏋️</h1>

          <section className="section">
            <h2>Create New Session</h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="duration"
                    min="30"
                    max="180"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxCapacity">Max Capacity *</label>
                  <input
                    type="number"
                    id="maxCapacity"
                    min="1"
                    max="100"
                    required
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="instructor">Instructor Name *</label>
                <input
                  type="text"
                  id="instructor"
                  required
                  placeholder="Enter instructor name"
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="4"
                  placeholder="Add session details, focus areas, requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create Session</button>
                <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                  date: '', startTime: '', duration: '60', instructor: '', maxCapacity: '20', description: ''
                })}>
                  Reset
                </button>
              </div>
            </form>
          </section>

          <section className="section">
            <h2>Existing Sessions</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Instructor</th>
                    <th>Enrolled / Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🏋️ No gym sessions created yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/gym-sessions/schedule<br/>
                          POST /api/gym-sessions/create<br/>
                          PUT /api/gym-sessions/edit/:id<br/>
                          DELETE /api/gym-sessions/cancel/:id
                        </p>
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
