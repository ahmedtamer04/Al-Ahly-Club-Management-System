'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function EventsOfficeProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@university.edu',
    phone: '+20 123 456 7890',
    staffId: 'EO-2025-001',
    department: 'Events Office',
    position: 'Events Coordinator'
  });

  const [isEditing, setIsEditing] = useState(false);

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
          <div className="page-header">
            <h1>My Profile 👤</h1>
            {!isEditing ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>✏️ Edit</button>
            ) : (
              <div style={{display: 'flex', gap: '1rem'}}>
                <button className="btn-primary" onClick={() => setIsEditing(false)}>💾 Save</button>
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>❌ Cancel</button>
              </div>
            )}
          </div>

          <section className="section">
            <h2>Personal Information</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={profile.name} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile.email} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={profile.phone} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Staff ID</label>
                <input type="text" value={profile.staffId} disabled style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', background: '#F5F5F5'}} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={profile.department} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input type="text" value={profile.position} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
