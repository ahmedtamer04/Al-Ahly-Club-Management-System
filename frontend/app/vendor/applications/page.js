'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/app/dashboard.css';
import { vendorAPI } from '@/utils/api';

export default function VendorApplicationsPage() {
  // Initialize as null to match server-side rendering
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [cancelling, setCancelling] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'approved', 'pending-rejected'
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' or 'stripe'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [sendingQRCodes, setSendingQRCodes] = useState(false);

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
      fetchApplications();
    }
  }, [isClient]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await vendorAPI.getMyApplications();
      console.log('Applications response:', response);
      
      const apps = response.applications || [];
      
      // Sort applications: cancelled at the end
      const sortedApps = apps.sort((a, b) => {
        if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
        if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
        // For non-cancelled applications, sort by applied date (most recent first)
        return new Date(b.applied_at) - new Date(a.applied_at);
      });
      
      setApplications(sortedApps);
      
      // Calculate stats
      setStats({
        total: apps.length,
        pending: apps.filter(app => app.status === 'pending').length,
        approved: apps.filter(app => app.status === 'accepted').length,
        rejected: apps.filter(app => app.status === 'rejected').length
      });
      
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(`Failed to load applications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (!confirm('Are you sure you want to cancel this application?')) {
      return;
    }

    try {
      setCancelling(applicationId);
      await vendorAPI.cancelApplication(applicationId);
      alert('Application cancelled successfully');
      
      // Refresh applications
      fetchApplications();
    } catch (error) {
      console.error('Error cancelling application:', error);
      alert(`Failed to cancel application: ${error.response?.data?.message || error.message}`);
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const canCancelApplication = (app) => {
    // Can cancel if status is pending and payment is not paid
    return app.status === 'pending' && app.payment_status !== 'paid';
  };

  // Filter applications based on active filter
  const filteredApplications = applications.filter(app => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'approved') return app.status === 'accepted';
    if (activeFilter === 'pending-rejected') return app.status === 'pending' || app.status === 'rejected';
    return true;
  });

  const handleViewDetails = async (app) => {
    setSelectedApplication(app);
    setShowDetailsModal(true);
    
    // If application is accepted, fetch payment info
    if (app.status === 'accepted') {
      try {
        setLoadingPayment(true);
        const paymentData = await vendorAPI.getPaymentInfo(app._id);
        setPaymentInfo(paymentData);
      } catch (error) {
        console.error('Error fetching payment info:', error);
        setPaymentInfo(null);
      } finally {
        setLoadingPayment(false);
      }
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedApplication(null);
    setPaymentInfo(null);
    setShowPaymentModal(false);
  };

  const handlePayWithWallet = async () => {
    if (!selectedApplication) return;
    
    if (!confirm(`Pay $${paymentInfo?.application?.participation_fee || 0} participation fee with wallet?`)) {
      return;
    }

    try {
      setProcessingPayment(true);
      const result = await vendorAPI.payWithWallet(selectedApplication._id);
      alert('Payment successful! Receipt sent to your email.');
      
      // Refresh payment info
      const paymentData = await vendorAPI.getPaymentInfo(selectedApplication._id);
      setPaymentInfo(paymentData);
      
      // Update application in list
      fetchApplications();
      setShowPaymentModal(false);
    } catch (error) {
      alert(`Payment failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayWithStripe = async () => {
    if (!selectedApplication) return;

    try {
      setProcessingPayment(true);
      
      // Create payment intent
      const { client_secret, payment_id } = await vendorAPI.createStripePayment(selectedApplication._id);
      
      // Use Stripe Elements to confirm payment
      // For now, we'll use a simple approach - in production, use Stripe Elements
      alert('Stripe payment integration requires Stripe Elements. Please implement Stripe checkout.');
      
      // TODO: Implement Stripe Elements integration
      // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      // const { error } = await stripe.confirmCardPayment(client_secret, {
      //   payment_method: { card: cardElement }
      // });
      
    } catch (error) {
      alert(`Payment failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSendQRCodes = async () => {
    if (!selectedApplication) return;

    if (!confirm('Send QR codes for all registered visitors to your email?')) {
      return;
    }

    try {
      setSendingQRCodes(true);
      const result = await vendorAPI.sendQRCodes(selectedApplication._id);
      alert(`QR codes sent successfully! Check your email for ${result.visitors_count} visitor QR code(s).`);
    } catch (error) {
      alert(`Failed to send QR codes: ${error.response?.data?.message || error.message}`);
    } finally {
      setSendingQRCodes(false);
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
            <li><Link href="/vendor/applications" className="active">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/polls">📊 Polls</Link></li>
            <li><Link href="/vendor/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>My Applications 📋</h1>

          <div className="stats-grid">
            <div 
              className={`stat-card ${activeFilter === 'all' ? 'stat-card-active' : ''}`}
              onClick={() => setActiveFilter('all')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Applications</p>
              </div>
            </div>
            <div 
              className={`stat-card ${activeFilter === 'pending-rejected' ? 'stat-card-active' : ''}`}
              onClick={() => setActiveFilter('pending-rejected')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pending + stats.rejected}</h3>
                <p>Pending/Rejected</p>
              </div>
            </div>
            <div 
              className={`stat-card ${activeFilter === 'approved' ? 'stat-card-active' : ''}`}
              onClick={() => setActiveFilter('approved')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.approved}</h3>
                <p>Approved</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Type</th>
                    <th>Business Name</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        <div className="loading">Loading applications...</div>
                      </td>
                    </tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        <div className="empty-state">
                          <p>📋 {activeFilter === 'all' ? 'No applications yet' : 'No applications found for this filter'}</p>
                          {activeFilter === 'all' && (
                            <Link href="/vendor/bazaars" className="btn-primary">Browse Bazaars</Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          {app.kind === 'bazaar' && app.bazaar 
                            ? app.bazaar.name 
                            : app.kind === 'booth_event' 
                            ? 'Booth Event Application'
                            : 'N/A'}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: app.kind === 'bazaar' ? '#e3f2fd' : '#f3e5f5',
                            color: app.kind === 'bazaar' ? '#1976d2' : '#7b1fa2',
                            fontSize: '0.85em',
                            fontWeight: '500'
                          }}>
                            {app.kind === 'bazaar' ? '🎪 Bazaar' : '🏪 Booth'}
                          </span>
                        </td>
                        <td>
                          {app.business_name || user?.vendor_info?.company_name || 'N/A'}
                        </td>
                        <td>{formatDate(app.applied_at)}</td>
                        <td>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            background: getStatusColor(app.status),
                            color: 'white',
                            fontWeight: '500',
                            fontSize: '0.9em'
                          }}>
                            {getStatusIcon(app.status)} {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleViewDetails(app)}
                              style={{
                                padding: '6px 12px',
                                background: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: '500'
                              }}
                            >
                              👁️ View Details
                            </button>
                            {canCancelApplication(app) && (
                              <button
                                onClick={() => handleCancelApplication(app._id)}
                                disabled={cancelling === app._id}
                                style={{
                                  padding: '6px 12px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: cancelling === app._id ? 'not-allowed' : 'pointer',
                                  opacity: cancelling === app._id ? 0.6 : 1,
                                  fontSize: '0.9em',
                                  fontWeight: '500'
                                }}
                              >
                                {cancelling === app._id ? 'Cancelling...' : '🚫 Cancel'}
                              </button>
                            )}
                          </div>
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

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Status Section */}
              <div className="detail-section">
                <h3 className="detail-section-title">
                  <span className="section-icon">📊</span>
                  Status Information
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      background: getStatusColor(selectedApplication.status),
                      color: 'white',
                      fontWeight: '500',
                      display: 'inline-block'
                    }}>
                      {getStatusIcon(selectedApplication.status)} {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Application Type:</span>
                    <span className="detail-value">
                      {selectedApplication.kind === 'bazaar' ? '🎪 Bazaar' : '🏪 Booth Event'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applied Date:</span>
                    <span className="detail-value">{formatDate(selectedApplication.applied_at)}</span>
                  </div>
                  {selectedApplication.approved_at && (
                    <div className="detail-item">
                      <span className="detail-label">Approved Date:</span>
                      <span className="detail-value">{formatDate(selectedApplication.approved_at)}</span>
                    </div>
                  )}
                  {selectedApplication.payment_status && (
                    <div className="detail-item">
                      <span className="detail-label">Payment Status:</span>
                      <span className="detail-value">{selectedApplication.payment_status}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="detail-section rejection-section">
                  <h3 className="detail-section-title">
                    <span className="section-icon">❌</span>
                    Rejection Reason
                  </h3>
                  <div className="rejection-box">
                    {selectedApplication.rejection_reason}
                  </div>
                </div>
              )}

              {/* Event/Bazaar Information */}
              {selectedApplication.kind === 'bazaar' && selectedApplication.bazaar && (
                <div className="detail-section">
                  <h3 className="detail-section-title">
                    <span className="section-icon">🎪</span>
                    Bazaar Information
                  </h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Event Name:</span>
                      <span className="detail-value">{selectedApplication.bazaar.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{selectedApplication.bazaar.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Start Date:</span>
                      <span className="detail-value">{formatDate(selectedApplication.bazaar.start_date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">{formatDate(selectedApplication.bazaar.end_date)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Information */}
              <div className="detail-section">
                <h3 className="detail-section-title">
                  <span className="section-icon">🏢</span>
                  Business Information
                </h3>
                <div className="detail-grid">
                  {selectedApplication.business_name && (
                    <div className="detail-item">
                      <span className="detail-label">Business Name:</span>
                      <span className="detail-value">{selectedApplication.business_name}</span>
                    </div>
                  )}
                  {selectedApplication.business_type && (
                    <div className="detail-item">
                      <span className="detail-label">Business Type:</span>
                      <span className="detail-value">{selectedApplication.business_type}</span>
                    </div>
                  )}
                  {selectedApplication.business_description && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{selectedApplication.business_description}</span>
                    </div>
                  )}
                  {selectedApplication.products_offered && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Products/Services Offered:</span>
                      <span className="detail-value">{selectedApplication.products_offered}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booth Details */}
              <div className="detail-section">
                <h3 className="detail-section-title">
                  <span className="section-icon">📦</span>
                  Booth Details
                </h3>
                <div className="detail-grid">
                  {selectedApplication.booth_size && (
                    <div className="detail-item">
                      <span className="detail-label">Booth Size:</span>
                      <span className="detail-value">{selectedApplication.booth_size}</span>
                    </div>
                  )}
                  {selectedApplication.duration_weeks && (
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{selectedApplication.duration_weeks} weeks</span>
                    </div>
                  )}
                  {selectedApplication.preferred_start_date && (
                    <div className="detail-item">
                      <span className="detail-label">Preferred Start:</span>
                      <span className="detail-value">{formatDate(selectedApplication.preferred_start_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Members */}
              {((selectedApplication.bazaar_staff && selectedApplication.bazaar_staff.length > 0) ||
                (selectedApplication.booth_staff && selectedApplication.booth_staff.length > 0)) && (
                <div className="detail-section">
                  <h3 className="detail-section-title">
                    <span className="section-icon">👥</span>
                    Staff Members
                  </h3>
                  <div className="staff-list">
                    {(selectedApplication.bazaar_staff || selectedApplication.booth_staff || []).map((staff, index) => (
                      <div key={index} className="staff-item">
                        <span className="staff-name">👤 {staff.name}</span>
                        <span className="staff-email">📧 {staff.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="detail-section">
                <h3 className="detail-section-title">
                  <span className="section-icon">📞</span>
                  Contact Information
                </h3>
                <div className="detail-grid">
                  {selectedApplication.contact_phone && (
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedApplication.contact_phone}</span>
                    </div>
                  )}
                  {selectedApplication.contact_email && (
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedApplication.contact_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {selectedApplication.notes && (
                <div className="detail-section">
                  <h3 className="detail-section-title">
                    <span className="section-icon">📝</span>
                    Additional Notes
                  </h3>
                  <div className="notes-box">
                    {selectedApplication.notes}
                  </div>
                </div>
              )}

              {/* Payment Section - Only for accepted applications */}
              {selectedApplication.status === 'accepted' && (
                <div className="detail-section" style={{borderLeftColor: '#ffc107'}}>
                  <h3 className="detail-section-title">
                    <span className="section-icon">💰</span>
                    Payment Information
                  </h3>
                  
                  {loadingPayment ? (
                    <div style={{textAlign: 'center', padding: '2rem'}}>Loading payment info...</div>
                  ) : paymentInfo ? (
                    <div>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Participation Fee:</span>
                          <span className="detail-value" style={{fontSize: '1.2em', fontWeight: 'bold', color: '#c41e3a'}}>
                            ${paymentInfo.application?.participation_fee?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Payment Status:</span>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            background: paymentInfo.application?.payment_status === 'paid' ? '#28a745' : '#ffc107',
                            color: 'white',
                            fontWeight: '500',
                            display: 'inline-block'
                          }}>
                            {paymentInfo.application?.payment_status === 'paid' ? '✅ Paid' : '⏳ Not Paid'}
                          </span>
                        </div>
                        {paymentInfo.application?.payment_deadline && (
                          <div className="detail-item">
                            <span className="detail-label">Payment Deadline:</span>
                            <span className="detail-value" style={{
                              color: paymentInfo.is_deadline_passed ? '#dc3545' : (paymentInfo.days_until_deadline <= 1 ? '#ffc107' : '#333'),
                              fontWeight: paymentInfo.days_until_deadline <= 1 ? 'bold' : 'normal'
                            }}>
                              {formatDate(paymentInfo.application.payment_deadline)}
                              {paymentInfo.days_until_deadline !== null && (
                                <span style={{marginLeft: '0.5rem', fontSize: '0.9em'}}>
                                  ({paymentInfo.is_deadline_passed 
                                    ? '⚠️ Deadline Passed' 
                                    : `${paymentInfo.days_until_deadline} day(s) remaining`})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {paymentInfo.application?.payment_date && (
                          <div className="detail-item">
                            <span className="detail-label">Paid On:</span>
                            <span className="detail-value">{formatDate(paymentInfo.application.payment_date)}</span>
                          </div>
                        )}
                      </div>

                      {paymentInfo.application?.payment_status !== 'paid' && (
                        <div style={{
                          marginTop: '1.5rem',
                          padding: '1rem',
                          background: '#fff3cd',
                          borderRadius: '8px',
                          border: '1px solid #ffc107'
                        }}>
                          <p style={{margin: '0 0 1rem 0', color: '#856404', fontWeight: '600'}}>
                            ⚠️ Payment Required
                          </p>
                          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                            <button
                              onClick={handlePayWithWallet}
                              disabled={processingPayment}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: processingPayment ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                opacity: processingPayment ? 0.6 : 1
                              }}
                            >
                              {processingPayment ? 'Processing...' : '💰 Pay with Wallet'}
                            </button>
                            <button
                              onClick={() => setShowPaymentModal(true)}
                              disabled={processingPayment}
                              style={{
                                padding: '0.75rem 1.5rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: processingPayment ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                opacity: processingPayment ? 0.6 : 1
                              }}
                            >
                              💳 Pay with Card
                            </button>
                          </div>
                        </div>
                      )}

                      {paymentInfo.application?.payment_status === 'paid' && (
                        <div style={{
                          marginTop: '1.5rem',
                          padding: '1rem',
                          background: '#d4edda',
                          borderRadius: '8px',
                          border: '1px solid #28a745'
                        }}>
                          <p style={{margin: '0 0 1rem 0', color: '#155724', fontWeight: '600'}}>
                            ✅ Payment Completed
                          </p>
                          <button
                            onClick={handleSendQRCodes}
                            disabled={sendingQRCodes}
                            style={{
                              padding: '0.75rem 1.5rem',
                              background: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: sendingQRCodes ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              opacity: sendingQRCodes ? 0.6 : 1
                            }}
                          >
                            {sendingQRCodes ? 'Sending...' : '📱 Request QR Codes for Visitors'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', padding: '1rem', color: '#666'}}>
                      Unable to load payment information
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stat-card {
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .stat-card-active {
          border: 2px solid #c41e3a;
          box-shadow: 0 4px 12px rgba(196, 30, 58, 0.2);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          overflow-y: auto;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 2px solid #f0f0f0;
          background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 2rem;
        }

        .detail-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #c41e3a;
        }

        .rejection-section {
          background: #fee;
          border-left-color: #dc3545;
        }

        .detail-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .section-icon {
          font-size: 1.3rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-label {
          font-weight: 600;
          color: #666;
          font-size: 0.9rem;
        }

        .detail-value {
          color: #333;
          font-size: 1rem;
          word-break: break-word;
        }

        .rejection-box, .notes-box {
          padding: 1rem;
          background: white;
          border-radius: 6px;
          color: #333;
          line-height: 1.6;
          border: 1px solid #ddd;
        }

        .rejection-box {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .staff-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .staff-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .staff-name {
          font-weight: 600;
          color: #333;
        }

        .staff-email {
          color: #666;
          font-size: 0.9rem;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #f0f0f0;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
        }

        @media (max-width: 768px) {
          .modal-content {
            max-width: 95%;
            max-height: 95vh;
          }

          .modal-header, .modal-body, .modal-footer {
            padding: 1rem;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .staff-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
