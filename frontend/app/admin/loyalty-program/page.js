'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function AdminLoyaltyProgramPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, active, rejected, cancelled
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Load stats
      const statsResponse = await fetch('http://localhost:5001/api/admin/loyalty-program/applications/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData.statistics.overall);

      // Load applications
      const queryString = filter !== 'all' ? `?status=${filter}` : '';
      const appsResponse = await fetch(`http://localhost:5001/api/admin/loyalty-program/applications${queryString}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appsData = await appsResponse.json();
      setApplications(appsData.applications || []);

      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load loyalty program applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId) => {
    if (!window.confirm('Are you sure you want to accept this loyalty program application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/loyalty-program/applications/${applicationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert('Application accepted successfully! Vendor has been notified.');
        setSelectedApplication(null);
        loadData();
      } else {
        alert(data.message || 'Failed to accept application');
      }
    } catch (err) {
      console.error('Error accepting application:', err);
      alert('Failed to accept application');
    }
  };

  const handleReject = async (applicationId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this loyalty program application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/loyalty-program/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Application rejected successfully! Vendor has been notified.');
        setSelectedApplication(null);
        setRejectionReason('');
        loadData();
      } else {
        alert(data.message || 'Failed to reject application');
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      alert('Failed to reject application');
    }
  };

  const viewDetails = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/loyalty-program/applications/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedApplication(data.application);
    } catch (err) {
      console.error('Error loading application details:', err);
      alert('Failed to load application details');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#ffc107', text: '⏳ Pending' },
      active: { color: '#28a745', text: '✓ Active' },
      rejected: { color: '#dc3545', text: '✗ Rejected' },
      cancelled: { color: '#6c757d', text: '⊘ Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        backgroundColor: badge.color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">⚙️ Admin Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 Manage Users</Link></li>
            <li><Link href="/admin/events">📅 All Events</Link></li>
            <li><Link href="/admin/registrations">🎫 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/facilities">🏢 Facilities</Link></li>
            <li><Link href="/admin/loyalty-program" className="active">🎁 Loyalty Program</Link></li>
            <li><Link href="/admin/reports">📊 Sales Report</Link></li>
            <li><Link href="/admin/documents">📄 Documents</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>🎁 Loyalty Program Applications</h1>
          </div>

          {loading && <p>Loading...</p>}

          {error && (
            <div style={{ color: 'red', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Stats */}
              <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{stats.total}</h3>
                    <p>Total Applications</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>{stats.pending}</h3>
                    <p>Pending Review</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✓</div>
                  <div className="stat-info">
                    <h3>{stats.active}</h3>
                    <p>Active Partners</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✗</div>
                  <div className="stat-info">
                    <h3>{stats.rejected}</h3>
                    <p>Rejected</p>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ marginRight: '1rem', fontWeight: '600' }}>Filter by Status:</label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Applications</option>
                  <option value="pending">Pending Only</option>
                  <option value="active">Active Only</option>
                  <option value="rejected">Rejected Only</option>
                  <option value="cancelled">Cancelled Only</option>
                </select>
              </div>

              {/* Applications Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Business Name</th>
                      <th>Promo Code</th>
                      <th>Discount</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          No applications found
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app._id}>
                          <td>
                            {app.vendor?.name || `${app.vendor_user_id?.first_name} ${app.vendor_user_id?.last_name}`}
                            <br />
                            <small style={{ color: '#666' }}>{app.vendor?.email || app.vendor_user_id?.email}</small>
                          </td>
                          <td>{app.vendor?.company_name || app.vendor_user_id?.business_name || 'N/A'}</td>
                          <td>
                            <code style={{
                              backgroundColor: '#f5f5f5',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>
                              {app.promo_code}
                            </code>
                          </td>
                          <td>{app.discount_rate}%</td>
                          <td>{formatDate(app.applied_at)}</td>
                          <td>{getStatusBadge(app.status)}</td>
                          <td>
                            <button
                              onClick={() => viewDetails(app._id)}
                              className="btn-secondary"
                              style={{ fontSize: '13px', padding: '6px 12px' }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setSelectedApplication(null);
            setRejectionReason('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              color: '#333'
            }}
          >
            <h2>Loyalty Program Application Details</h2>

            <div style={{ marginTop: '1.5rem' }}>
              <h3>Vendor Information</h3>
              <p><strong>Name:</strong> {selectedApplication.vendor?.name || `${selectedApplication.vendor_user_id?.first_name} ${selectedApplication.vendor_user_id?.last_name}`}</p>
              <p><strong>Email:</strong> {selectedApplication.vendor?.email || selectedApplication.vendor_user_id?.email}</p>
              <p><strong>Business Name:</strong> {selectedApplication.vendor?.company_name || selectedApplication.vendor_user_id?.business_name || 'N/A'}</p>
              <p><strong>Business Type:</strong> {selectedApplication.vendor_user_id?.business_type || 'N/A'}</p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3>Application Details</h3>
              <p><strong>Promo Code:</strong> <code style={{ backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{selectedApplication.promo_code}</code></p>
              <p><strong>Discount Rate:</strong> {selectedApplication.discount_rate}%</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedApplication.status)}</p>
              <p><strong>Applied Date:</strong> {formatDate(selectedApplication.applied_at)}</p>
              {selectedApplication.approved_at && (
                <p><strong>Approved Date:</strong> {formatDate(selectedApplication.approved_at)}</p>
              )}
              {selectedApplication.cancelled_at && (
                <p><strong>Cancelled Date:</strong> {formatDate(selectedApplication.cancelled_at)}</p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3>Terms and Conditions</h3>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                maxHeight: '150px',
                overflow: 'auto'
              }}>
                {selectedApplication.terms_and_conditions}
              </div>
            </div>

            {selectedApplication.cancellation_reason && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3>Cancellation Reason</h3>
                <p style={{
                  backgroundColor: '#fff3cd',
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #ffc107'
                }}>
                  {selectedApplication.cancellation_reason}
                </p>
              </div>
            )}

            {/* Action Buttons for Pending Applications */}
            {selectedApplication.status === 'pending' && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #dee2e6' }}>
                <h3>Review Application</h3>
                
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => handleAccept(selectedApplication._id)}
                    className="btn-primary"
                    style={{
                      marginRight: '1rem',
                      backgroundColor: '#28a745',
                      padding: '10px 24px'
                    }}
                  >
                    ✓ Accept Application
                  </button>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Rejection Reason:
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={() => handleReject(selectedApplication._id)}
                    className="btn-primary"
                    style={{
                      marginTop: '0.5rem',
                      backgroundColor: '#dc3545',
                      padding: '10px 24px'
                    }}
                    disabled={!rejectionReason.trim()}
                  >
                    ✗ Reject Application
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                setSelectedApplication(null);
                setRejectionReason('');
              }}
              className="btn-secondary"
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
