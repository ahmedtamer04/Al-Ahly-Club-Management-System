'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function TAProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@university.edu',
    phone: '+20 123 456 7890',
    taId: 'TA-2025-001',
    department: 'Computer Science',
    coursesTaught: 'Data Structures, Algorithms'
  });

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 TA Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/ta">🏠 Dashboard</Link></li>
            <li><Link href="/ta/events">📅 Browse Events</Link></li>
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/profile">👤 Profile</Link></li>
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
                <label>TA ID</label>
                <input type="text" value={profile.taId} disabled style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', background: '#F5F5F5'}} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={profile.department} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Courses</label>
                <input type="text" value={profile.coursesTaught} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
