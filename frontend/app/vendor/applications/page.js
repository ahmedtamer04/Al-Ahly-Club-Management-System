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
                                opacity: cancelling === app._id ? 0.6 : 1
                              }}
                            >
                              {cancelling === app._id ? 'Cancelling...' : '🚫 Cancel'}
                            </button>
                          )}
                          {!canCancelApplication(app) && (
                            <span style={{ color: '#6c757d', fontSize: '0.9em' }}>
                              {app.status === 'cancelled' ? 'Cancelled' : 
                               app.status === 'accepted' ? 'Approved' :
                               app.status === 'rejected' ? 'Rejected' :
                               app.payment_status === 'paid' ? 'Payment Completed' : '-'}
                            </span>
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
      `}</style>
    </div>
  );
}
