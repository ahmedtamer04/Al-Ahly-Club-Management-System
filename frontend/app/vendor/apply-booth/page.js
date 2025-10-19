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
    booth_size: 'small',
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
      booth_size: 'small',
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
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Apply for Booth Event 🎪</h1>
            <p className="page-subtitle">Set up your booth and showcase your business at our events</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <section className="section">
            <div className="info-banner">
              <div className="info-banner-icon">ℹ️</div>
              <div className="info-banner-content">
                <h3>About Booth Event Applications</h3>
                <p>
                  Apply for a booth at an upcoming event. This is independent of bazaar applications. 
                  Our admin team will review your request and assign you to an appropriate event based on your business type and preferences.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="form enhanced-form">
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">🏢</span>
                  <h3>Business Information</h3>
                </div>
                
                <div className="form-group">
                  <label htmlFor="businessName">
                    <span className="label-icon">🏪</span>
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={formData.business_name}
                    readOnly
                    style={{
                      backgroundColor: '#f0f0f0',
                      cursor: 'not-allowed',
                      color: '#666'
                    }}
                  />
                  <small className="field-hint">
                    This is your registered business name and cannot be changed here
                  </small>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">🎯</span>
                  <h3>Booth Preferences</h3>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="boothSize">
                      <span className="label-icon">📐</span>
                      Preferred Booth Size *
                    </label>
                    <select
                      id="boothSize"
                      required
                      value={formData.booth_size}
                      onChange={(e) => setFormData({...formData, booth_size: e.target.value})}
                      className="select-enhanced"
                    >
                      <option value="small">📦 Small (3m × 3m) - $200</option>
                      <option value="medium">📦📦 Medium (6m × 3m) - $400</option>
                      <option value="large">📦📦📦 Large (6m × 6m) - $600</option>
                      <option value="xl">📦📦📦📦 Extra Large (9m × 6m) - $900</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferredDate">
                      <span className="label-icon">📅</span>
                      Preferred Start Date
                    </label>
                    <input
                      type="date"
                      id="preferredDate"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.preferred_start_date}
                      onChange={(e) => setFormData({...formData, preferred_start_date: e.target.value})}
                    />
                    <small className="field-hint">
                      Optional - When would you like to start?
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">
                    <span className="label-icon">💬</span>
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    rows="3"
                    placeholder="Any special requirements, equipment needs, setup requirements, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">📞</span>
                  <h3>Contact Information</h3>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactPhone">
                      <span className="label-icon">📱</span>
                      Contact Phone *
                    </label>
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
                    <label htmlFor="contactEmail">
                      <span className="label-icon">📧</span>
                      Contact Email *
                    </label>
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
              </div>

              <div className="form-actions-enhanced">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-large"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Submit Application
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  🔄 Reset Form
                </button>
                <Link href="/vendor/applications" className="btn btn-outline">
                  📋 View My Applications
                </Link>
              </div>
            </form>
          </section>

          <section className="section">
            <div className="pricing-header">
              <h2>💰 Booth Pricing Guide</h2>
              <p>Choose the booth size that fits your business needs</p>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="pricing-badge">Small</div>
                <div className="pricing-icon">📦</div>
                <div className="pricing-size">3m × 3m</div>
                <div className="pricing-amount">$200</div>
                <div className="pricing-features">
                  <div className="pricing-feature">✓ Basic setup space</div>
                  <div className="pricing-feature">✓ Perfect for startups</div>
                  <div className="pricing-feature">✓ 1-2 staff members</div>
                </div>
              </div>
              <div className="pricing-card">
                <div className="pricing-badge">Medium</div>
                <div className="pricing-icon">📦📦</div>
                <div className="pricing-size">6m × 3m</div>
                <div className="pricing-amount">$400</div>
                <div className="pricing-features">
                  <div className="pricing-feature">✓ Extended display area</div>
                  <div className="pricing-feature">✓ Growing businesses</div>
                  <div className="pricing-feature">✓ 2-3 staff members</div>
                </div>
              </div>
              <div className="pricing-card pricing-card-popular">
                <div className="pricing-badge pricing-badge-popular">Large ⭐</div>
                <div className="pricing-icon">📦📦📦</div>
                <div className="pricing-size">6m × 6m</div>
                <div className="pricing-amount">$600</div>
                <div className="pricing-features">
                  <div className="pricing-feature">✓ Spacious layout</div>
                  <div className="pricing-feature">✓ Most popular choice</div>
                  <div className="pricing-feature">✓ 3-4 staff members</div>
                </div>
              </div>
              <div className="pricing-card">
                <div className="pricing-badge">Extra Large</div>
                <div className="pricing-icon">📦📦📦📦</div>
                <div className="pricing-size">9m × 6m</div>
                <div className="pricing-amount">$900</div>
                <div className="pricing-features">
                  <div className="pricing-feature">✓ Premium showcase</div>
                  <div className="pricing-feature">✓ Maximum visibility</div>
                  <div className="pricing-feature">✓ 4-5 staff members</div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .page-header h1 {
          margin-bottom: 0.5rem;
          color: #c41e3a;
        }

        .page-subtitle {
          color: #666;
          font-size: 1.1rem;
          margin: 0;
        }

        .info-banner {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-radius: 12px;
          margin-bottom: 2rem;
          border-left: 4px solid #1976d2;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .info-banner-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .info-banner-content h3 {
          margin: 0 0 0.5rem 0;
          color: #1976d2;
          font-size: 1.1rem;
        }

        .info-banner-content p {
          margin: 0;
          color: #333;
          line-height: 1.6;
        }

        .alert {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background: #fee;
          border: 1px solid #dc3545;
          color: #721c24;
        }

        .alert-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .alert-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .alert-content p {
          margin: 0;
        }

        .enhanced-form {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .form-section {
          padding: 2rem;
          border-bottom: 1px solid #eee;
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .form-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .form-section-icon {
          font-size: 1.5rem;
        }

        .form-section-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.2rem;
        }

        .label-icon {
          margin-right: 0.5rem;
        }

        .field-hint {
          display: block;
          color: #999;
          font-size: 0.85rem;
          margin-top: 0.3rem;
        }

        .form-actions-enhanced {
          display: flex;
          gap: 1rem;
          padding: 2rem;
          background: #f8f9fa;
          border-top: 1px solid #eee;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .btn-outline {
          background: white;
          border: 2px solid #c41e3a;
          color: #c41e3a;
        }

        .btn-outline:hover {
          background: #c41e3a;
          color: white;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 0.6s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .pricing-header h2 {
          margin-bottom: 0.5rem;
          color: #c41e3a;
        }

        .pricing-header p {
          color: #666;
          margin: 0;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .pricing-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 2rem 1.5rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .pricing-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          border-color: #c41e3a;
        }

        .pricing-card-popular {
          border-color: #c41e3a;
          box-shadow: 0 4px 16px rgba(196, 30, 58, 0.2);
        }

        .pricing-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          background: #f0f0f0;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
          margin-bottom: 1rem;
        }

        .pricing-badge-popular {
          background: linear-gradient(135deg, #c41e3a, #e74c3c);
          color: white;
        }

        .pricing-icon {
          font-size: 3rem;
          margin: 1rem 0;
        }

        .pricing-size {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .pricing-amount {
          font-size: 2.5rem;
          font-weight: bold;
          color: #c41e3a;
          margin: 1rem 0;
        }

        .pricing-features {
          margin-top: 1.5rem;
          text-align: left;
        }

        .pricing-feature {
          padding: 0.5rem 0;
          color: #555;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
          
          .form-actions-enhanced {
            flex-direction: column;
          }
          
          .info-banner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
