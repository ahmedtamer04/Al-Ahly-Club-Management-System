'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorEmailPreferencesPage() {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [preferences, setPreferences] = useState({
    payment_notifications: true,
    application_updates: true,
    bazaar_news: true,
    promotional_emails: false
  });
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    if (isClient && user) {
      fetchEmailData();
    }
  }, [isClient, user]);

  const fetchEmailData = async () => {
    try {
      setLoading(true);
      // Load email preferences (mock for now)
      const savedPreferences = localStorage.getItem('emailPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
      
      // Load email history from localStorage
      const history = localStorage.getItem('emailHistory') || '[]';
      setEmailHistory(JSON.parse(history));
    } catch (error) {
      console.error('Error loading email data:', error);
      setMessage({ type: 'error', text: 'Failed to load email preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (preference) => {
    setPreferences({
      ...preferences,
      [preference]: !preferences[preference]
    });
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Save to localStorage for now
      localStorage.setItem('emailPreferences', JSON.stringify(preferences));
      
      setMessage({ type: 'success', text: '✅ Email preferences saved successfully!' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmailIcon = (type) => {
    switch (type) {
      case 'payment': return '💰';
      case 'application': return '📋';
      case 'bazaar': return '🎪';
      case 'promotion': return '🎁';
      default: return '📧';
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
            <li><Link href="/vendor/polls">📊 Polls</Link></li>
            <li><Link href="/vendor/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
            <li><Link href="/vendor/email-preferences" className="active">📧 Email Preferences</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>📧 Email Preferences & History</h1>
          </div>

          {message.text && (
            <div style={{
              marginBottom: '2rem',
              padding: '1rem',
              borderRadius: '8px',
              background: message.type === 'success' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${message.type === 'success' ? '#28a745' : '#f5c6cb'}`,
              color: message.type === 'success' ? '#155724' : '#721c24',
              fontWeight: '500'
            }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Email Preferences Section */}
            <section className="section">
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.3em' }}>📬 Notification Preferences</h2>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading preferences...</div>
              ) : (
                <div>
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>💰 Payment Notifications</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
                        Receive email when you make payments
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.payment_notifications}
                      onChange={() => handlePreferenceChange('payment_notifications')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>📋 Application Updates</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
                        Get notified about application status changes
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.application_updates}
                      onChange={() => handlePreferenceChange('application_updates')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>🎪 Bazaar & Event News</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
                        Receive updates about bazaars and events
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.bazaar_news}
                      onChange={() => handlePreferenceChange('bazaar_news')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{
                    marginBottom: '2rem',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>🎁 Promotional Emails</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
                        Receive special offers and promotions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.promotional_emails}
                      onChange={() => handlePreferenceChange('promotional_emails')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      opacity: saving ? 0.6 : 1,
                      width: '100%'
                    }}
                  >
                    {saving ? '💾 Saving...' : '💾 Save Preferences'}
                  </button>
                </div>
              )}
            </section>

            {/* Email Information Section */}
            <section className="section">
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.3em' }}>📧 Email Address</h2>
              
              <div style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9em' }}>Your registered email:</p>
                <p style={{
                  margin: 0,
                  fontSize: '1.1em',
                  fontWeight: '600',
                  color: '#333',
                  wordBreak: 'break-all'
                }}>
                  {user?.email || 'Not available'}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                background: '#e7f3ff',
                borderRadius: '8px',
                border: '1px solid #b3d9ff',
                color: '#004085'
              }}>
                <p style={{ margin: 0, fontSize: '0.9em' }}>
                  <strong>💡 Tip:</strong> All payment receipts and important notifications are sent to this email address.
                </p>
              </div>
            </section>
          </div>

          {/* Email History Section */}
          <section className="section">
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '1.3em' }}>📨 Email History</h2>
            
            {emailHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '1.2em', margin: '0 0 0.5rem 0' }}>📭 No emails yet</p>
                <p style={{ margin: 0 }}>Email receipts and notifications will appear here.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailHistory.map((email, index) => (
                      <tr key={index}>
                        <td>{formatDate(email.date)}</td>
                        <td>{getEmailIcon(email.type)} {email.type}</td>
                        <td>{email.subject}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: email.status === 'sent' ? '#d4edda' : '#f8d7da',
                            color: email.status === 'sent' ? '#155724' : '#721c24',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            {email.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      <style jsx>{`
        .section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          margin-bottom: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin: 0;
          color: #333;
          font-size: 1.8em;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1em;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table thead {
          background: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }

        .data-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #333;
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        @media (max-width: 768px) {
          section {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
}
