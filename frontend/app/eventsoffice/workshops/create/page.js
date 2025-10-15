'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../../dashboard.css';

export default function CreateWorkshopPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    instructor: '',
    maxCapacity: '30',
    prerequisites: '',
    materials: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/workshops/create
    console.log('Create workshop:', formData);
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
          <h1>Create Workshop 🎓</h1>

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="title">Workshop Title *</label>
                <input
                  type="text"
                  id="title"
                  required
                  placeholder="e.g., Introduction to Web Development"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  rows="4"
                  required
                  placeholder="Describe the workshop content, learning objectives..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

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
                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    required
                    placeholder="Room/Building"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="instructor">Instructor *</label>
                  <input
                    type="text"
                    id="instructor"
                    required
                    placeholder="Instructor name"
                    value={formData.instructor}
                    onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxCapacity">Max Capacity *</label>
                  <input
                    type="number"
                    id="maxCapacity"
                    min="1"
                    max="200"
                    required
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prerequisites">Prerequisites</label>
                <textarea
                  id="prerequisites"
                  rows="3"
                  placeholder="List any prerequisites or requirements for participants"
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({...formData, prerequisites: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="materials">Materials Needed</label>
                <textarea
                  id="materials"
                  rows="3"
                  placeholder="List materials participants should bring"
                  value={formData.materials}
                  onChange={(e) => setFormData({...formData, materials: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create Workshop</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setFormData({
                    title: '', description: '', date: '', startTime: '', endTime: '',
                    location: '', instructor: '', maxCapacity: '30', prerequisites: '', materials: ''
                  })}
                >
                  Reset
                </button>
              </div>

              <small style={{color: '#999', marginTop: '1rem', display: 'block'}}>
                API: POST /api/workshops/create
              </small>
            </form>
          </section>

          <section className="section">
            <h2>My Workshops</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Enrolled / Capacity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🎓 No workshops created yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/workshops/my-workshops<br/>
                          PUT /api/workshops/edit/:id
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
