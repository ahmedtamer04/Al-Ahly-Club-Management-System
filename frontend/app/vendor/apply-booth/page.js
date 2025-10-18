'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function ApplyBoothPage() {
  const router = useRouter();
  // Initialize as null to match server-side rendering
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    business_description: '',
    booth_size: 'small',
    products_offered: '',
    contact_phone: '',
    contact_email: '',
    preferred_start_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load user data on client side only
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  useEffect(() => {
    // Pre-fill form with user data if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        business_name: user.vendor_info?.company_name || '',
        business_type: user.vendor_info?.business_type || '',
        business_description: user.vendor_info?.business_description || '',
        contact_phone: user.vendor_info?.phone || user.phone || '',
        contact_email: user.email || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await vendorAPI.applyToBoothEvent(formData);
      setSuccess(true);
      alert('Booth application submitted successfully! Check My Applications to track your request.');
      router.push('/vendor/applications');
    } catch (err) {
      console.error('Error submitting booth application:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      business_name: user?.vendor_info?.company_name || '',
      business_type: user?.vendor_info?.business_type || '',
      business_description: user?.vendor_info?.business_description || '',
      booth_size: 'small',
      products_offered: '',
      contact_phone: user?.vendor_info?.phone || user?.phone || '',
      contact_email: user?.email || '',
      preferred_start_date: '',
      notes: ''
    });
    setError('');
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 {user?.vendor_info?.company_name || 'Vendor'}</span>
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
            <li><Link href="/vendor/booths">� My Booths</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Apply for Booth Event 🎪</h1>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fee',
              color: '#dc3545',
              borderRadius: '8px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}

          <section className="section">
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>ℹ️ Booth Event Application</h3>
              <p style={{ margin: 0, color: '#555' }}>
                Apply for a booth at an upcoming event. This is independent of bazaar applications. 
                Admin will review your request and assign you to an appropriate event.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name *</label>
                  <input
                    type="text"
                    id="businessName"
                    required
                    placeholder="Your business name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessType">Business Type *</label>
                  <select
                    id="businessType"
                    required
                    value={formData.business_type}
                    onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                  >
                    <option value="">-- Select type --</option>
                    <option value="food">Food & Beverages</option>
                    <option value="retail">Retail & Products</option>
                    <option value="services">Services</option>
                    <option value="crafts">Arts & Crafts</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Business Description *</label>
                <textarea
                  id="description"
                  rows="4"
                  required
                  placeholder="Describe your business and what you'll showcase..."
                  value={formData.business_description}
                  onChange={(e) => setFormData({...formData, business_description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productsOffered">Products/Services Offered *</label>
                <textarea
                  id="productsOffered"
                  rows="3"
                  required
                  placeholder="List the products or services you will offer at your booth..."
                  value={formData.products_offered}
                  onChange={(e) => setFormData({...formData, products_offered: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="boothSize">Preferred Booth Size *</label>
                  <select
                    id="boothSize"
                    required
                    value={formData.booth_size}
                    onChange={(e) => setFormData({...formData, booth_size: e.target.value})}
                  >
                    <option value="small">Small (3m x 3m) - $200</option>
                    <option value="medium">Medium (6m x 3m) - $400</option>
                    <option value="large">Large (6m x 6m) - $600</option>
                    <option value="xl">Extra Large (9m x 6m) - $900</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="preferredDate">Preferred Start Date</label>
                  <input
                    type="date"
                    id="preferredDate"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.preferred_start_date}
                    onChange={(e) => setFormData({...formData, preferred_start_date: e.target.value})}
                  />
                  <small style={{color: '#999', marginTop: '0.3rem', display: 'block'}}>
                    Optional - When would you like to start?
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  rows="3"
                  placeholder="Any special requirements, equipment needs, setup requirements, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactPhone">Contact Phone *</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    required
                    placeholder="+20 xxx xxx xxxx"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail">Contact Email *</label>
                  <input
                    type="email"
                    id="contactEmail"
                    required
                    placeholder="vendor@example.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset Form
                </button>
                <Link href="/vendor/applications" className="btn btn-secondary">
                  View My Applications
                </Link>
              </div>
            </form>
          </section>

          <section className="section">
            <h2>Booth Pricing</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>$200</h3>
                  <p>Small Booth</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦📦</div>
                <div className="stat-info">
                  <h3>$400</h3>
                  <p>Medium Booth</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦📦📦</div>
                <div className="stat-info">
                  <h3>$600</h3>
                  <p>Large Booth</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦📦📦📦</div>
                <div className="stat-info">
                  <h3>$900</h3>
                  <p>XL Booth</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
