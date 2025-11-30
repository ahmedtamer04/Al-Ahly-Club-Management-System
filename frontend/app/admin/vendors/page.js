'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';
import api from '@/utils/api';

export default function VendorApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    accepted: 0, 
    rejected: 0 
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch vendor applications and stats
  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('Fetching vendor applications...');
      
      const params = filter !== 'all' ? { status: filter } : {};
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/admin/vendor-requests${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(endpoint);
      console.log('Vendor applications response:', response);
      
      setApplications(response.applications || []);
    } catch (error) {
      console.error('Error fetching vendor applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/vendor-requests/stats');
      console.log('Vendor stats response:', response);
      
      if (response.statistics && response.statistics.overall) {
        setStats({
          total: response.statistics.overall.total_requests || 0,
          pending: response.statistics.overall.pending_requests || 0,
          accepted: response.statistics.overall.accepted_requests || 0,
          rejected: response.statistics.overall.rejected_requests || 0
        });
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const handleViewApplication = async (applicationId) => {
    try {
      console.log('Fetching application details:', applicationId);
      const response = await api.get(`/admin/vendor-requests/${applicationId}`);
      console.log('Application details:', response);
      
      setSelectedApplication(response.application);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
      alert('Failed to load application details: ' + error.message);
    }
  };

  const handleAcceptApplication = async (applicationId) => {
    if (!confirm('Are you sure you want to accept this vendor application?')) {
      return;
    }
    
    try {
      console.log('Accepting application:', applicationId);
      const response = await api.post(`/admin/vendor-requests/${applicationId}/accept`, {});
      console.log('Accept response:', response);
      
      alert('Application accepted successfully!');
      
      // Refresh applications and stats
      await fetchApplications();
      await fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application: ' + error.message);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    const reason = prompt('Enter rejection reason:');
    
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }
    
    try {
      console.log('Rejecting application:', applicationId, 'Reason:', reason);
      const response = await api.post(`/admin/vendor-requests/${applicationId}/reject`, {
        rejection_reason: reason.trim()
      });
      console.log('Reject response:', response);
      
      alert('Application rejected successfully!');
      
      // Refresh applications and stats
      await fetchApplications();
      await fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application: ' + error.message);
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span style={{color: '#ff9800', fontWeight: 'bold'}}>⏳ Pending</span>;
      case 'accepted':
        return <span style={{color: '#4caf50', fontWeight: 'bold'}}>✅ Accepted</span>;
      case 'rejected':
        return <span style={{color: '#f44336', fontWeight: 'bold'}}>❌ Rejected</span>;
      default:
        return <span style={{color: '#666', fontWeight: 'bold'}}>❓ Unknown</span>;
    }
  };

  // Helper function to get application type badge
  const getTypeBadge = (kind) => {
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: '500',
        backgroundColor: kind === 'bazaar' ? '#fff3e0' : '#e8f5e8',
        color: kind === 'bazaar' ? '#ef6c00' : '#388e3c'
      }}>
        {kind === 'bazaar' ? '🏪 Bazaar' : '🏗️ Booth Event'}
      </span>
    );
  };

  // Filter applications based on search term
  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const vendorName = app.vendor?.name?.toLowerCase() || '';
    const companyName = app.vendor?.company_name?.toLowerCase() || '';
    const bazaarName = app.bazaar?.name?.toLowerCase() || '';
    
    return vendorName.includes(searchLower) || 
           companyName.includes(searchLower) || 
           bazaarName.includes(searchLower);
  });

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
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/admin/reports">📊 Sales Report</Link></li>
            <li><Link href="/admin/documents">📄 Documents</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Vendor Applications 🏪</h1>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
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

          {/* Filters */}
          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by vendor name or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('approved')}
                >
                  Approved
                </button>
                <button 
                  className={filter === 'rejected' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('rejected')}
                >
                  Rejected
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Event/Booth</th>
                    <th>Application Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <div className="empty-state">
                          <p>⏳ Loading vendor applications...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <div className="empty-state">
                          <p>🏪 No vendor applications found</p>
                          {applications.length === 0 ? (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              No vendor applications in the database yet.
                            </p>
                          ) : (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              No {filter} applications match your search criteria
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <div>
                            <strong>{app.vendor?.name || 'Unknown Vendor'}</strong>
                            <br/>
                            <small style={{color: '#666', fontSize: '0.85em'}}>
                              {app.vendor?.email || 'N/A'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <strong>{app.vendor?.company_name || 'N/A'}</strong>
                        </td>
                        <td>{getTypeBadge(app.kind)}</td>
                        <td>
                          {app.bazaar ? (
                            <div>
                              <strong>{app.bazaar.name}</strong>
                              <br/>
                              <small style={{color: '#666', fontSize: '0.85em'}}>
                                {new Date(app.bazaar.start_date).toLocaleDateString()}
                              </small>
                            </div>
                          ) : app.kind === 'booth_event' ? (
                            <div>
                              <strong>Booth Event</strong>
                              <br/>
                              <small style={{color: '#666', fontSize: '0.85em'}}>
                                {app.duration_weeks} week(s) - {app.platform_position?.wall} wall
                              </small>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>
                          {app.applied_at || app.submitted_at || app.createdAt ? (
                            <div>
                              <strong>{new Date(app.applied_at || app.submitted_at || app.createdAt).toLocaleDateString()}</strong>
                              <br/>
                              <small style={{color: '#666'}}>
                                {new Date(app.applied_at || app.submitted_at || app.createdAt).toLocaleTimeString()}
                              </small>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewApplication(app._id)}
                            title="View Application Details"
                            style={{marginRight: '4px'}}
                          >
                            👁️ View
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleAcceptApplication(app._id)}
                                title="Accept Application"
                                style={{marginRight: '4px', backgroundColor: '#4caf50', color: 'white'}}
                              >
                                ✅ Accept
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRejectApplication(app._id)}
                                title="Reject Application"
                                style={{backgroundColor: '#f44336', color: 'white'}}
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <div className="modal-header">
              <h2>📋 Application Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
              {/* Vendor Information */}
              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{marginBottom: '0.5rem', color: '#333'}}>👤 Vendor Information</h3>
                <div style={{backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
                  <p><strong>Name:</strong> {selectedApplication.vendor?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedApplication.vendor?.email || 'N/A'}</p>
                  <p><strong>Company:</strong> {selectedApplication.vendor?.company_name || 'N/A'}</p>
                  <p><strong>Role:</strong> {selectedApplication.vendor?.role || 'N/A'}</p>
                </div>
              </div>

              {/* Application Type */}
              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{marginBottom: '0.5rem', color: '#333'}}>📝 Application Type</h3>
                <div style={{backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
                  <p><strong>Type:</strong> {getTypeBadge(selectedApplication.kind)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedApplication.status)}</p>
                  <p><strong>Applied:</strong> {new Date(selectedApplication.applied_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Bazaar/Event Details */}
              {selectedApplication.bazaar && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{marginBottom: '0.5rem', color: '#333'}}>🏪 Bazaar Details</h3>
                  <div style={{backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
                    <p><strong>Bazaar Name:</strong> {selectedApplication.bazaar.name}</p>
                    <p><strong>Location:</strong> {selectedApplication.bazaar.location}</p>
                    <p><strong>Start Date:</strong> {new Date(selectedApplication.bazaar.start_date).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(selectedApplication.bazaar.end_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedApplication.bazaar.time}</p>
                  </div>
                </div>
              )}

              {/* Booth Details */}
              <div style={{marginBottom: '1.5rem'}}>
                <h3 style={{marginBottom: '0.5rem', color: '#333'}}>🏗️ Booth Details</h3>
                <div style={{backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
                  <p><strong>Booth Size:</strong> {selectedApplication.application?.booth_size || selectedApplication.booth_size || 'Not specified'}</p>
                  {selectedApplication.duration_weeks && (
                    <p><strong>Duration:</strong> {selectedApplication.duration_weeks} week(s)</p>
                  )}
                  {selectedApplication.application?.setup_duration_weeks && (
                    <p><strong>Setup Duration:</strong> {selectedApplication.application.setup_duration_weeks} week(s)</p>
                  )}
                  {selectedApplication.platform_position && (
                    <p><strong>Position:</strong> {selectedApplication.platform_position.wall} wall, Slot {selectedApplication.platform_position.slot}</p>
                  )}
                  {selectedApplication.application?.notes && (
                    <p><strong>Notes:</strong> {selectedApplication.application.notes}</p>
                  )}
                </div>
              </div>

              {/* Staff List */}
              {selectedApplication.staff && selectedApplication.staff.length > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{marginBottom: '0.5rem', color: '#333'}}>👥 Staff Members ({selectedApplication.staff.length})</h3>
                  <div style={{backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px'}}>
                    {selectedApplication.staff.map((member, index) => (
                      <div key={index} style={{marginBottom: '0.5rem'}}>
                        <strong>{index + 1}. {member.name}</strong> - {member.email}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedApplication.rejection_reason && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{marginBottom: '0.5rem', color: '#f44336'}}>❌ Rejection Reason</h3>
                  <div style={{backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', border: '1px solid #f44336'}}>
                    <p>{selectedApplication.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {selectedApplication.approved_by && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h3 style={{marginBottom: '0.5rem', color: '#4caf50'}}>✅ Approval Information</h3>
                  <div style={{backgroundColor: '#e8f5e9', padding: '1rem', borderRadius: '8px', border: '1px solid #4caf50'}}>
                    <p><strong>Approved By:</strong> {selectedApplication.approved_by.name}</p>
                    <p><strong>Email:</strong> {selectedApplication.approved_by.email}</p>
                    <p><strong>Date:</strong> {new Date(selectedApplication.approved_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {selectedApplication.status === 'pending' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleAcceptApplication(selectedApplication._id)}
                    style={{backgroundColor: '#4caf50', color: 'white', marginRight: '8px'}}
                  >
                    ✅ Accept Application
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleRejectApplication(selectedApplication._id)}
                    style={{backgroundColor: '#f44336', color: 'white', marginRight: '8px'}}
                  >
                    ❌ Reject Application
                  </button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-sm {
          padding: 4px 8px;
          font-size: 0.85em;
          margin: 0 2px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #5a6268;
        }

        .btn-success {
          background-color: #4caf50;
          color: white;
        }

        .btn-success:hover {
          background-color: #45a049;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background-color: #c82333;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #666;
          line-height: 1;
        }

        .modal-close:hover {
          color: #333;
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .modal-body h3 {
          margin-top: 0;
          font-size: 1.1rem;
        }

        .modal-body p {
          margin: 0.5rem 0;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}
