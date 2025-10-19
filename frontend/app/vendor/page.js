'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorRequestsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  const [selectedApp, setSelectedApp] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [filterStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await adminAPI.getVendorRequests(params);
      setApplications(response.applications || []);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to load applications', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getVendorRequestsStats();
      // Backend returns: { statistics: { overall: { total_requests, pending_requests, ... } } }
      const overallStats = response.statistics?.overall || {};
      setStats({
        total: overallStats.total_requests || 0,
        pending: overallStats.pending_requests || 0,
        accepted: overallStats.accepted_requests || 0,
        rejected: overallStats.rejected_requests || 0
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleAccept = async (applicationId) => {
    if (!confirm('Are you sure you want to accept this vendor application?')) {
      return;
    }

    try {
      await adminAPI.acceptVendorRequest(applicationId);
      setMessage({ text: 'Vendor application accepted successfully!', type: 'success' });
      fetchApplications();
      fetchStats();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to accept application', type: 'error' });
    }
  };

  const handleReject = async (applicationId) => {
    if (!rejectionReason.trim()) {
      setMessage({ text: 'Please provide a rejection reason', type: 'error' });
      return;
    }

    try {
      await adminAPI.rejectVendorRequest(applicationId, rejectionReason);
      setMessage({ text: 'Vendor application rejected successfully!', type: 'success' });
      setSelectedApp(null);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchApplications();
      fetchStats();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to reject application', type: 'error' });
    }
  };

  const openRejectModal = (app) => {
    setSelectedApp(app);
    setShowRejectModal(true);
    setRejectionReason('');
    setMessage({ text: '', type: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">🎨 Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🎪 Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Vendor Requests 🏪</h1>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Requests</p>
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
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.accepted}</h3>
                <p>Accepted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats.rejected}</h3>
                <p>Rejected</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <h2>Vendor Applications</h2>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('pending')}
                >
                  ⏳ Pending
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'accepted' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('accepted')}
                >
                  ✅ Accepted
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('rejected')}
                >
                  ❌ Rejected
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Company</th>
                    <th>Bazaar</th>
                    <th>Type</th>
                    <th>Booth Size</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <div className="loading">Loading applications...</div>
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <div className="empty-state">
                          <p>🏪 No vendor applications found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      // Safely extract vendor information
                      const vendorName = app.vendor?.name || 'Unknown Vendor';
                      const vendorEmail = app.vendor?.email || 'N/A';
                      const vendorCompany = app.vendor?.company_name || 'N/A';
                      const bazaarName = app.bazaar?.name || 'N/A';
                      const appKind = app.application?.kind || app.kind || 'N/A';
                      
                      return (
                      <tr key={app._id}>
                        <td>
                          <strong>{vendorName}</strong>
                          <br />
                          <small style={{ color: '#666' }}>{vendorEmail}</small>
                        </td>
                        <td>{vendorCompany}</td>
                        <td>
                          <strong>{bazaarName}</strong>
                          <br />
                          <small>{formatDate(app.bazaar?.start_date)}</small>
                        </td>
                        <td>
                          <span className="status-badge" style={{ 
                            backgroundColor: appKind === 'bazaar' ? '#17a2b8' : '#6f42c1',
                            color: '#fff'
                          }}>
                            {appKind === 'bazaar' ? 'Bazaar' : 'Booth Platform'}
                          </span>
                        </td>
                        <td>{app.application?.booth_size || 'N/A'}</td>
                        <td>{formatDate(app.submitted_at)}</td>
                        <td>
                          <span className={`status-badge status-${app.status}`}>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          {app.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleAccept(app._id)}
                                className="btn-secondary"
                                style={{
                                  backgroundColor: '#28a745',
                                  borderColor: '#28a745',
                                  color: '#fff',
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  marginRight: '5px',
                                  minWidth: '70px'
                                }}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => openRejectModal(app)}
                                className="btn-secondary"
                                style={{
                                  backgroundColor: '#dc3545',
                                  borderColor: '#dc3545',
                                  color: '#fff',
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  minWidth: '70px'
                                }}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => setSelectedApp(app)}
                                className="btn-secondary"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  marginLeft: '5px',
                                  minWidth: '70px'
                                }}
                              >
                                Details
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="btn-secondary"
                              style={{
                                padding: '5px 10px',
                                fontSize: '12px',
                                minWidth: '70px'
                              }}
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Details Modal */}
          {selectedApp && !showRejectModal && (
            <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                  <h2>Application Details</h2>
                  <button onClick={() => setSelectedApp(null)} className="btn-close">
                    ✕
                  </button>
                </div>
                <div className="form" style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Vendor Information</h3>
                    <p><strong>Name:</strong> {selectedApp.vendor?.name || 'Unknown Vendor'}</p>
                    <p><strong>Email:</strong> {selectedApp.vendor?.email || 'N/A'}</p>
                    <p><strong>Company:</strong> {selectedApp.vendor?.company_name || 'N/A'}</p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Bazaar Information</h3>
                    <p><strong>Event:</strong> {selectedApp.bazaar?.name || 'N/A'}</p>
                    <p><strong>Location:</strong> {selectedApp.bazaar?.location || 'N/A'}</p>
                    <p><strong>Date:</strong> {formatDate(selectedApp.bazaar?.start_date)} - {formatDate(selectedApp.bazaar?.end_date)}</p>
                    <p><strong>Time:</strong> {selectedApp.bazaar?.time || 'N/A'}</p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Application Details</h3>
                    <p><strong>Type:</strong> {(selectedApp.application?.kind || selectedApp.kind) === 'bazaar' ? 'Bazaar' : 'Booth Platform'}</p>
                    <p><strong>Booth Size:</strong> {selectedApp.application?.booth_size || 'N/A'}</p>
                    {(selectedApp.application?.kind || selectedApp.kind) === 'booth_platform' && (
                      <>
                        <p><strong>Setup Duration:</strong> {selectedApp.application?.setup_duration_weeks || 'N/A'} weeks</p>
                        <p><strong>Booth Location Zone:</strong> {selectedApp.application?.booth_location?.zone || 'N/A'}</p>
                      </>
                    )}
                    <p><strong>Staff Members:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                      {(selectedApp.application?.staff && selectedApp.application.staff.length > 0) ? (
                        selectedApp.application.staff.map((member, idx) => (
                          <li key={idx}>{member?.name || 'N/A'} - {member?.email || 'N/A'}</li>
                        ))
                      ) : (
                        <li>No staff information available</li>
                      )}
                    </ul>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Status Information</h3>
                    <p><strong>Status:</strong> <span className={`status-badge status-${selectedApp.status}`}>{selectedApp.status}</span></p>
                    <p><strong>Submitted:</strong> {formatDate(selectedApp.submitted_at)}</p>
                    {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                      <p><strong>Rejection Reason:</strong> {selectedApp.rejection_reason}</p>
                    )}
                    {selectedApp.approved_by && (
                      <>
                        <p><strong>Reviewed By:</strong> {selectedApp.approved_by?.name || 'N/A'}</p>
                        <p><strong>Reviewed At:</strong> {formatDate(selectedApp.approved_at)}</p>
                      </>
                    )}
                  </div>

                  <div className="form-actions">
                    <button onClick={() => setSelectedApp(null)} className="btn-secondary">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {showRejectModal && selectedApp && (
            <div className="modal-overlay" onClick={() => { setShowRejectModal(false); setSelectedApp(null); setRejectionReason(''); }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Reject Application</h2>
                  <button onClick={() => { setShowRejectModal(false); setSelectedApp(null); setRejectionReason(''); }} className="btn-close">
                    ✕
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleReject(selectedApp._id); }} className="form">
                  <div className="form-group">
                    <label>Vendor: {selectedApp.vendor?.name || 'Unknown Vendor'}</label>
                    <label>Event: {selectedApp.bazaar?.name || 'N/A'}</label>
                  </div>

                  <div className="form-group">
                    <label>Rejection Reason *</label>
                    <textarea
                      rows="4"
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this application..."
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => { setShowRejectModal(false); setSelectedApp(null); setRejectionReason(''); }} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}>
                      Reject Application
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}