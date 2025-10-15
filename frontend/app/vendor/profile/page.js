'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function VendorProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Mohamed Ali',
    email: 'mohamed.ali@business.com',
    phone: '+20 123 456 7890',
    vendorId: 'VND-2025-001',
    businessName: 'Ali\'s Crafts',
    businessType: 'Handmade Crafts',
    businessDescription: 'Quality handmade crafts and accessories'
  });

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 Vendor Dashboard</span>
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
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
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
                <label>Vendor ID</label>
                <input type="text" value={profile.vendorId} disabled style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', background: '#F5F5F5'}} />
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Business Information</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Business Name</label>
                <input type="text" value={profile.businessName} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Business Type</label>
                <input type="text" value={profile.businessType} disabled={!isEditing} style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}} />
              </div>
              <div className="form-group">
                <label>Business Description</label>
                <textarea
                  value={profile.businessDescription}
                  disabled={!isEditing}
                  rows="3"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
