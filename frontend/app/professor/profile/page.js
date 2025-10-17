'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUser } from '@/utils/api';
import '@/app/dashboard.css';
import '@/app/utils/loading.css';

export default function ProfessorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = () => {
      const userData = getUser();
      if (userData) {
        setProfile({
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          phone: userData.phone || '',
          professorId: userData.id_number,
          department: userData.department || '',
          specialization: userData.specialization || '',
          officeHours: userData.office_hours || ''
        });
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

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
            <li><Link href="/professor/events">📅 Events</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
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
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
              </div>
            ) : error ? (
              <div className="alert alert-error">{error}</div>
            ) : profile ? (
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
                  <label>Professor ID</label>
                  <input type="text" value={profile.professorId} disabled style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', background: '#F5F5F5'}} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={profile.department} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input type="text" value={profile.specialization} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
                </div>
                <div className="form-group">
                  <label>Office Hours</label>
                  <input type="text" value={profile.officeHours} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
                </div>
              </div>
            ) : (
              <div className="alert alert-error">No profile data found</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
