'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorProfilePage() {
  // Load user immediately to avoid transition flicker
  const getUserData = () => {
    if (typeof window !== 'undefined') {
      return getUser();
    }
    return null;
  };
  
  const initialUser = getUserData();
  const [user] = useState(initialUser);
  const [profile, setProfile] = useState({
    name: initialUser ? `${initialUser.first_name || ''} ${initialUser.last_name || ''}`.trim() : '',
    email: initialUser?.email || '',
    phone: initialUser?.vendor_info?.phone || initialUser?.phone || '',
    vendorId: initialUser?._id || '',
    businessName: initialUser?.vendor_info?.company_name || '',
    businessType: initialUser?.vendor_info?.business_type || '',
    businessDescription: initialUser?.vendor_info?.business_description || ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleInputChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = () => {
    // TODO: Implement API call to update profile
    // await api.put('/auth/profile', profile);
    setIsEditing(false);
    alert('Profile saved! (API integration pending)');
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 {profile.businessName || user?.vendor_info?.company_name || 'Vendor'}</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/profile" className="active">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          {loading ? (
            <div className="loading">Loading profile...</div>
          ) : (
            <>
              <div className="page-header">
                <h1>My Profile 👤</h1>
                {!isEditing ? (
                  <button className="btn-primary" onClick={() => setIsEditing(true)}>✏️ Edit</button>
                ) : (
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button className="btn-primary" onClick={handleSave}>💾 Save</button>
                    <button className="btn-secondary" onClick={() => {
                      setIsEditing(false);
                      // Reset to original user data
                      const userData = getUser();
                      if (userData) {
                        setProfile({
                          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
                          email: userData.email || '',
                          phone: userData.vendor_info?.phone || userData.phone || '',
                          vendorId: userData._id || '',
                          businessName: userData.vendor_info?.company_name || '',
                          businessType: userData.vendor_info?.business_type || '',
                          businessDescription: userData.vendor_info?.business_description || ''
                        });
                      }
                    }}>❌ Cancel</button>
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing} 
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing} 
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="tel" 
                      value={profile.phone} 
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing} 
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Vendor ID</label>
                    <input 
                      type="text" 
                      value={profile.vendorId} 
                      disabled 
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', background: '#F5F5F5'}} 
                    />
                  </div>
                </div>
              </section>

              <section className="section">
                <h2>Business Information</h2>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input 
                      type="text" 
                      value={profile.businessName} 
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      disabled={!isEditing} 
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Type</label>
                    <input 
                      type="text" 
                      value={profile.businessType} 
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      disabled={!isEditing} 
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Description</label>
                    <textarea
                      value={profile.businessDescription}
                      onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                      disabled={!isEditing}
                      rows="3"
                      style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <style jsx>{`
        .loading {
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.1rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #c41e3a;
          color: white;
        }

        .btn-primary:hover {
          background-color: #a01729;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #5a6268;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
        }

        .section {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .section h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #c41e3a;
        }
      `}</style>
    </div>
  );
}
