'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authAPI, getUser } from '@/utils/api';
import StudentLayout from '@/app/components/StudentLayout';
import '@/app/dashboard.css';

export default function StudentProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    major: '',
    year: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const userData = getUser();
    console.log('User data loaded:', userData);
    
    if (userData) {
      setUser(userData);
      setProfile({
        name: userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '',
        email: userData.email || '',
        phone: userData.phone || '',
        studentId: userData.id_number || userData.student_id || userData._id || '',
        major: userData.major || userData.student_info?.major || '',
        year: userData.year || userData.student_info?.year || 'Freshman'
      });
    } else {
      // Redirect to login if no user data
      console.log('No user data found, redirecting to login');
      window.location.href = '/';
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update profile
      // await api.put('/auth/profile', profile);
      console.log('Saving profile:', profile);
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <StudentLayout>
      {loading ? (
        <div className="loading-state">
          <p>🔄 Loading profile...</p>
        </div>
      ) : (
        <>
          <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
            <h1>My Profile 👤</h1>
            {!isEditing ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{display: 'flex', gap: '1rem'}}>
                <button className="btn-primary" onClick={handleSave}>💾 Save</button>
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>❌ Cancel</button>
              </div>
            )}
          </div>

          <section className="section">
            <h2>Personal Information</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  disabled={!isEditing}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  disabled={!isEditing}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  disabled={!isEditing}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    value={profile.studentId}
                    disabled
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', background: '#F5F5F5', color: '#666'}}
                  />
                  <small style={{color: '#666', fontSize: '0.8rem'}}>Student ID cannot be changed</small>
                </div>

              <div className="form-group">
                <label>Major</label>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => setProfile({...profile, major: e.target.value})}
                  disabled={!isEditing}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Academic Year</label>
                <select
                  value={profile.year}
                  onChange={(e) => setProfile({...profile, year: e.target.value})}
                  disabled={!isEditing}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                >
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                </select>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Change Password</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>
              <button className="btn-primary">🔒 Update Password</button>
            </div>
          </section>
        </>
      )}
    </StudentLayout>
  );
}
