'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function LoyaltyProgramPage() {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [loyaltyStatus, setLoyaltyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    discount_rate: '',
    promo_code: '',
    terms_and_conditions: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

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
    if (isClient) {
      fetchLoyaltyStatus();
    }
  }, [isClient]);

  const fetchLoyaltyStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await vendorAPI.getLoyaltyProgramStatus();
      setLoyaltyStatus(response);
    } catch (err) {
      console.error('Error fetching loyalty status:', err);
      setError(err.response?.data?.message || 'Failed to load loyalty program status');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.discount_rate || !formData.promo_code || !formData.terms_and_conditions) {
      setError('All fields are required');
      return;
    }

    const discountRate = parseFloat(formData.discount_rate);
    if (isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
      setError('Discount rate must be a number between 0 and 100');
      return;
    }

    if (formData.promo_code.length < 4 || formData.promo_code.length > 20) {
      setError('Promo code must be between 4 and 20 characters');
      return;
    }

    if (formData.terms_and_conditions.length > 2000) {
      setError('Terms and conditions cannot exceed 2000 characters');
      return;
    }

    try {
      setSubmitting(true);
      const response = await vendorAPI.applyToLoyaltyProgram({
        discount_rate: discountRate,
        promo_code: formData.promo_code,
        terms_and_conditions: formData.terms_and_conditions
      });
      
      setSuccess('Application submitted successfully! It will be reviewed by admin.');
      setShowApplyForm(false);
      setFormData({
        discount_rate: '',
        promo_code: '',
        terms_and_conditions: ''
      });
      fetchLoyaltyStatus(); // Refresh status
    } catch (err) {
      console.error('Error applying to loyalty program:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your participation in the GUC Loyalty Program? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      setError('');
      await vendorAPI.cancelLoyaltyProgram(cancellationReason);
      setSuccess('Loyalty program participation cancelled successfully');
      setCancellationReason('');
      fetchLoyaltyStatus(); // Refresh status
    } catch (err) {
      console.error('Error cancelling loyalty program:', err);
      setError(err.response?.data?.message || 'Failed to cancel participation');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'active': return '#28a745';
      case 'cancelled': return '#6c757d';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'active': return '✅';
      case 'cancelled': return '🚫';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 {user?.vendor_info?.company_name || 'Vendor Dashboard'}</span>
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
            <li><Link href="/vendor/loyalty-program" className="active">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>GUC Loyalty Program 🎁</h1>

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

          {success && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              border: '1px solid #28a745'
            }}>
              ✅ {success}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading loyalty program status...</div>
          ) : (
            <>
              {/* Info Banner */}
              <section className="section" style={{marginBottom: '2rem'}}>
                <div style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <h2 style={{margin: '0 0 1rem 0', fontSize: '1.5rem'}}>🎁 About GUC Loyalty Program</h2>
                  <p style={{margin: 0, lineHeight: '1.6', fontSize: '1rem'}}>
                    Join the GUC Loyalty Program to offer special discounts to GUC students and staff. 
                    Set your discount rate, create a unique promo code, and define your terms & conditions. 
                    Once approved by admin, your discount will be available to all GUC community members.
                  </p>
                </div>
              </section>

              {/* Current Status */}
              {loyaltyStatus?.has_application && loyaltyStatus.application ? (
                <section className="section">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <h2>My Loyalty Program Status</h2>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${getStatusColor(loyaltyStatus.application.status)}`
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem'}}>
                      <div>
                        <h3 style={{margin: '0 0 0.5rem 0', color: '#333'}}>Status</h3>
                        <span style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          background: getStatusColor(loyaltyStatus.application.status),
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}>
                          {getStatusIcon(loyaltyStatus.application.status)} {loyaltyStatus.application.status.charAt(0).toUpperCase() + loyaltyStatus.application.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem'}}>
                      <div>
                        <label style={{display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem'}}>Discount Rate</label>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#c41e3a'}}>
                          {loyaltyStatus.application.discount_rate}%
                        </div>
                      </div>
                      <div>
                        <label style={{display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem'}}>Promo Code</label>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#1976d2',
                          fontFamily: 'monospace',
                          padding: '0.5rem',
                          background: '#e3f2fd',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {loyaltyStatus.application.promo_code}
                        </div>
                      </div>
                      <div>
                        <label style={{display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem'}}>Applied On</label>
                        <div>{formatDate(loyaltyStatus.application.applied_at)}</div>
                      </div>
                      {loyaltyStatus.application.approved_at && (
                        <div>
                          <label style={{display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem'}}>Approved On</label>
                          <div>{formatDate(loyaltyStatus.application.approved_at)}</div>
                        </div>
                      )}
                      {loyaltyStatus.application.cancelled_at && (
                        <div>
                          <label style={{display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem'}}>Cancelled On</label>
                          <div>{formatDate(loyaltyStatus.application.cancelled_at)}</div>
                        </div>
                      )}
                    </div>

                    <div style={{marginBottom: '1.5rem'}}>
                      <label style={{display: 'block', fontWeight: '600', color: '#666', marginBottom: '0.5rem'}}>Terms & Conditions</label>
                      <div style={{
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6'
                      }}>
                        {loyaltyStatus.application.terms_and_conditions}
                      </div>
                    </div>

                    {loyaltyStatus.application.cancellation_reason && (
                      <div style={{
                        padding: '1rem',
                        background: '#fff3cd',
                        borderRadius: '6px',
                        border: '1px solid #ffc107',
                        marginBottom: '1rem'
                      }}>
                        <label style={{display: 'block', fontWeight: '600', color: '#856404', marginBottom: '0.5rem'}}>Cancellation Reason</label>
                        <div style={{color: '#856404'}}>{loyaltyStatus.application.cancellation_reason}</div>
                      </div>
                    )}

                    {loyaltyStatus.application.status === 'active' && (
                      <div style={{
                        padding: '1rem',
                        background: '#fff3cd',
                        borderRadius: '6px',
                        border: '1px solid #ffc107'
                      }}>
                        <h4 style={{margin: '0 0 1rem 0', color: '#856404'}}>Cancel Participation</h4>
                        <textarea
                          placeholder="Reason for cancellation (optional)"
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            marginBottom: '1rem',
                            fontFamily: 'inherit'
                          }}
                        />
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: cancelling ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: cancelling ? 0.6 : 1
                          }}
                        >
                          {cancelling ? 'Cancelling...' : '🚫 Cancel Participation'}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section className="section">
                  <h2>Apply to GUC Loyalty Program</h2>
                  <p style={{color: '#666', marginBottom: '1.5rem'}}>
                    You haven't applied to the loyalty program yet. Fill out the form below to apply.
                  </p>
                  
                  {!showApplyForm ? (
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="btn-primary"
                      style={{padding: '1rem 2rem', fontSize: '1.1rem'}}
                    >
                      📝 Apply Now
                    </button>
                  ) : (
                    <form onSubmit={handleApply} className="form">
                      <div className="form-group">
                        <label htmlFor="discount_rate">
                          Discount Rate (%) *
                        </label>
                        <input
                          type="number"
                          id="discount_rate"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                          value={formData.discount_rate}
                          onChange={(e) => handleInputChange('discount_rate', e.target.value)}
                          placeholder="e.g., 10, 15, 20"
                        />
                        <small style={{color: '#666', marginTop: '0.5rem', display: 'block'}}>
                          Enter the discount percentage you want to offer (0-100%)
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="promo_code">
                          Promo Code *
                        </label>
                        <input
                          type="text"
                          id="promo_code"
                          required
                          maxLength={20}
                          value={formData.promo_code}
                          onChange={(e) => handleInputChange('promo_code', e.target.value.toUpperCase())}
                          placeholder="e.g., GUC10, STUDENT20"
                          style={{textTransform: 'uppercase'}}
                        />
                        <small style={{color: '#666', marginTop: '0.5rem', display: 'block'}}>
                          4-20 alphanumeric characters (letters and numbers only)
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="terms_and_conditions">
                          Terms & Conditions *
                        </label>
                        <textarea
                          id="terms_and_conditions"
                          required
                          rows="6"
                          maxLength={2000}
                          value={formData.terms_and_conditions}
                          onChange={(e) => handleInputChange('terms_and_conditions', e.target.value)}
                          placeholder="Describe the terms and conditions for using this discount code..."
                        />
                        <small style={{color: '#666', marginTop: '0.5rem', display: 'block'}}>
                          {formData.terms_and_conditions.length}/2000 characters
                        </small>
                      </div>

                      <div className="form-actions">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting...' : '📝 Submit Application'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowApplyForm(false);
                            setFormData({
                              discount_rate: '',
                              promo_code: '',
                              terms_and_conditions: ''
                            });
                            setError('');
                          }}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}
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

        .form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #c41e3a;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #c41e3a;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #a01729;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

