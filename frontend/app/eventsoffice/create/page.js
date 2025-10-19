'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function CreateEventPage() {
  const [eventType, setEventType] = useState('Workshop');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    capacity: 50
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`${eventType} created successfully!`);
  };

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
          <h1>Create New Event ➕</h1>

          <section className="section">
            <div className="form-group">
              <label>Select Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', maxWidth: '300px'}}
              >
                <option value="Workshop">🎨 Workshop</option>
                <option value="Trip">🚌 Trip</option>
                <option value="Bazaar">🎪 Bazaar</option>
                <option value="Booth">🏟️ Booth</option>
                <option value="Conference">🎓 Conference</option>
                <option value="GymSession">🏋️ Gym Session</option>
              </select>
            </div>

            <form onSubmit={handleSubmit} className="settings-form" style={{marginTop: '2rem'}}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder={`e.g., ${eventType === 'Workshop' ? 'Photography Workshop' : eventType === 'Trip' ? 'Cairo Museum Trip' : 'Spring Bazaar 2025'}`}
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the event..."
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
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Event location"
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Maximum Capacity *</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  min="1"
                  required
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              {/* Event Type Specific Fields */}
              {eventType === 'Trip' && (
                <div className="form-group">
                  <label>Transportation Type</label>
                  <select style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}>
                    <option>Bus</option>
                    <option>Van</option>
                    <option>Train</option>
                  </select>
                </div>
              )}

              {eventType === 'Workshop' && (
                <div className="form-group">
                  <label>Instructor Name</label>
                  <input
                    type="text"
                    placeholder="Workshop instructor"
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                  />
                </div>
              )}

              {eventType === 'Bazaar' && (
                <div className="form-group">
                  <label>Number of Booth Spaces</label>
                  <input
                    type="number"
                    placeholder="e.g., 20"
                    min="1"
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                  />
                </div>
              )}

              {eventType === 'GymSession' && (
                <>
                  <div className="form-group">
                    <label>Session Date *</label>
                    <input
                      type="date"
                      placeholder="Select date"
                      required
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                    />
                  </div>

                  <div className="form-group">
                    <label>Session Time *</label>
                    <input
                      type="time"
                      placeholder="e.g., 14:00"
                      required
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      placeholder="e.g., 60"
                      min="15"
                      max="180"
                      step="15"
                      required
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                    />
                    <small style={{color: '#666', fontSize: '0.85rem'}}>Duration in minutes (15 min intervals)</small>
                  </div>

                  <div className="form-group">
                    <label>Session Type *</label>
                    <select 
                      required
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                    >
                      <option value="">Select session type...</option>
                      <option value="Cardio">🏃 Cardio</option>
                      <option value="Strength">💪 Strength Training</option>
                      <option value="Yoga">🧘 Yoga</option>
                      <option value="Pilates">🤸 Pilates</option>
                      <option value="CrossFit">🏋️ CrossFit</option>
                      <option value="Zumba">💃 Zumba</option>
                      <option value="Spinning">🚴 Spinning</option>
                      <option value="HIIT">⚡ HIIT</option>
                      <option value="General">🏋️ General Gym Session</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Maximum Participants *</label>
                    <input
                      type="number"
                      placeholder="e.g., 20"
                      min="1"
                      max="100"
                      required
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                    />
                    <small style={{color: '#666', fontSize: '0.85rem'}}>Maximum number of participants allowed</small>
                  </div>
                </>
              )}

              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button type="submit" className="btn-primary">
                  ✅ Create {eventType}
                </button>
                <Link href="/eventsoffice" className="btn-secondary">
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
