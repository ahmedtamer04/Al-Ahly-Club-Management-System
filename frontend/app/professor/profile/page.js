'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function ProfessorProfilePage() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    id_number: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    try {
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        setError('No user data found. Please login again.');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      console.log('User data from localStorage:', user); // Debug log
      
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        id_number: user.id_number || '',
        role: user.role || 'Professor'
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  if (loading) {
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
              <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
              <li><Link href="/professor/profile">👤 Profile</Link></li>
            </ul>
          </aside>

          <main className="main-content">
            <p>Loading profile...</p>
          </main>
        </div>
      </div>
    );
  }

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
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>My Profile 👤</h1>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#ffe6e6', 
              color: '#e74c3c', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem' 
            }}>
              ⚠️ {error}
            </div>
          )}

          <section className="section">
            <h2>Personal Information</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={profile.first_name} 
                  disabled 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%',
                    background: '#F5F5F5',
                    cursor: 'not-allowed'
                  }} 
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={profile.last_name} 
                  disabled 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%',
                    background: '#F5F5F5',
                    cursor: 'not-allowed'
                  }} 
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%', 
                    background: '#F5F5F5',
                    cursor: 'not-allowed'
                  }} 
                />
              </div>

              <div className="form-group">
                <label>ID Number</label>
                <input 
                  type="text" 
                  value={profile.id_number} 
                  disabled 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%', 
                    background: '#F5F5F5',
                    cursor: 'not-allowed'
                  }} 
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <input 
                  type="text" 
                  value={profile.role.toUpperCase()} 
                  disabled 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%', 
                    background: '#F5F5F5',
                    cursor: 'not-allowed'
                  }} 
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
