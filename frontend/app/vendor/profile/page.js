'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUser, setUser, api } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorProfilePage() {
  // Initialize as null to match server-side rendering
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    vendorId: '',
    businessName: '',
    businessType: '',
    businessDescription: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [taxCardFile, setTaxCardFile] = useState(null);
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [taxCardPreview, setTaxCardPreview] = useState('');
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load user data on client side only
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = getUser();
      if (userData) {
        setUser(userData);
        setProfile({
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          email: userData.email || '',
          phone: userData.vendor_info?.phone || userData.phone || '',
          vendorId: userData._id || '',
          businessName: userData.vendor_info?.company_name || '',
          businessType: userData.vendor_info?.business_type || '',
          businessDescription: userData.vendor_info?.business_description || ''
        });
        // set previews if URLs available
        if (userData.vendor_info?.tax_card_url) setTaxCardPreview(userData.vendor_info.tax_card_url);
        if (userData.vendor_info?.company_logo_url) setCompanyLogoPreview(userData.vendor_info.company_logo_url);
      }
    }
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
            <li><Link href="/vendor/polls">📊 Polls</Link></li>
            <li><Link href="/vendor/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile" className="active">👤 Profile</Link></li>
            <li><Link href="/vendor/email-preferences">📧 Email Preferences</Link></li>
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

              <section className="section">
                <h2>Vendor Documents</h2>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Tax Card (PDF / Image)</label>
                    {taxCardPreview && (
                      <div style={{marginBottom: '0.5rem'}}>
                        <a href={taxCardPreview} target="_blank" rel="noreferrer">View current tax card</a>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setTaxCardFile(file || null);
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setTaxCardPreview(url);
                        }
                      }}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label>Company Logo (PNG / JPG)</label>
                    {companyLogoPreview && (
                      <div style={{marginBottom: '0.5rem'}}>
                        <img src={companyLogoPreview} alt="company logo" style={{height: 80, objectFit: 'contain'}} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setCompanyLogoFile(file || null);
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setCompanyLogoPreview(url);
                        }
                      }}
                      disabled={!isEditing}
                    />
                  </div>

                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button className="btn-primary" onClick={async () => {
                      // upload files
                      if (!taxCardFile && !companyLogoFile) {
                        alert('Please choose at least one file to upload.');
                        return;
                      }

                      setUploading(true);
                      try {
                        const formData = new FormData();
                        if (taxCardFile) formData.append('tax_card', taxCardFile);
                        if (companyLogoFile) formData.append('company_logo', companyLogoFile);

                        const res = await api.upload('/vendor/documents/upload', formData);
                        alert(res.message || 'Documents uploaded');

                        // update local user vendor_info if available
                        const localUser = getUser();
                        if (localUser) {
                          localUser.vendor_info = localUser.vendor_info || {};
                          if (res.documents?.tax_card?.file_url) localUser.vendor_info.tax_card_url = res.documents.tax_card.file_url;
                          if (res.documents?.company_logo?.file_url) localUser.vendor_info.company_logo_url = res.documents.company_logo.file_url;
                          setUser(localUser);
                        }
                        setTaxCardFile(null);
                        setCompanyLogoFile(null);
                      } catch (err) {
                        console.error(err);
                        alert(err.message || 'Upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }} disabled={!isEditing || uploading}>
                      {uploading ? 'Uploading...' : 'Upload Documents'}
                    </button>

                    <button className="btn-secondary" onClick={() => {
                      setTaxCardFile(null);
                      setCompanyLogoFile(null);
                      const userData = getUser();
                      if (userData) {
                        setTaxCardPreview(userData.vendor_info?.tax_card_url || '');
                        setCompanyLogoPreview(userData.vendor_info?.company_logo_url || '');
                      }
                    }} disabled={!isEditing || uploading}>
                      Reset
                    </button>
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
