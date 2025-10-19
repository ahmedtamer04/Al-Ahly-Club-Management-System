'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function TAProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    personalId: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        personalId: user.personalId || '',
        role: user.role || 'TA'
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setError('Not authenticated. Please login again.');
        return;
      }

      const user = JSON.parse(userStr);

      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update localStorage with new data
      const updatedUser = {
        ...user,
        name: data.user.name,
        phone: data.user.phone
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    }
  };

  const handleCancel = () => {
    loadProfile(); // Reload original data
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
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
              <li><Link href="/ta/favorites">⭐ My Favorites</Link></li>
              <li><Link href="/ta/my-events">✏️ My Events</Link></li>
              <li><Link href="/ta/gym">💪 Gym Schedule</Link></li>
              <li><Link href="/ta/profile">👤 Profile</Link></li>
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
            <li><Link href="/ta/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/gym">💪 Gym Schedule</Link></li>
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
                <button className="btn-primary" onClick={handleSave}>💾 Save</button>
                <button className="btn-secondary" onClick={handleCancel}>❌ Cancel</button>
              </div>
            )}
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

          {success && (
            <div style={{ 
              backgroundColor: '#e6ffe6', 
              color: '#27ae60', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem' 
            }}>
              ✅ {success}
            </div>
          )}

          <section className="section">
            <h2>Personal Information</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing} 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%',
                    background: isEditing ? 'white' : '#F5F5F5'
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
                    background: '#F5F5F5'
                  }} 
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Email cannot be changed
                </small>
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="tel" 
                  value={profile.phone} 
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing} 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%',
                    background: isEditing ? 'white' : '#F5F5F5'
                  }} 
                />
              </div>

              <div className="form-group">
                <label>Personal ID</label>
                <input 
                  type="text" 
                  value={profile.personalId} 
                  disabled 
                  style={{
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #E5E5E5', 
                    width: '100%', 
                    background: '#F5F5F5'
                  }} 
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Personal ID cannot be changed
                </small>
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
                    background: '#F5F5F5'
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
