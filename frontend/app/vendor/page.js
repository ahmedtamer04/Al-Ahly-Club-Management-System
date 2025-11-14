'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vendorAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorDashboard() {
  const router = useRouter();
  // Initialize as null to match server-side rendering
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    approvedBooths: 0,
    availableBazaars: 0
  });
  const [bazaars, setBazaars] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [pendingRejectedApplications, setPendingRejectedApplications] = useState([]);
  const [loyaltyProgramStatus, setLoyaltyProgramStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      fetchDashboardData();
    }
  }, [isClient]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch applications
      const appsData = await vendorAPI.getMyApplications();
      console.log('Applications data:', appsData);
      const applications = appsData.applications || [];
      console.log('Applications array:', applications);
      
      // Fetch bazaars
      const bazaarsData = await vendorAPI.getUpcomingBazaars();
      console.log('Bazaars data:', bazaarsData);
      const allBazaars = bazaarsData.bazaars || [];
      console.log('Bazaars array:', allBazaars);
      
      // Fetch loyalty program status
      try {
        const loyaltyData = await vendorAPI.getLoyaltyProgramStatus();
        setLoyaltyProgramStatus(loyaltyData);
      } catch (err) {
        console.error('Error fetching loyalty program status:', err);
      }
      
      // Calculate stats
      const pendingCount = applications.filter(app => app.status === 'pending').length;
      const approvedCount = applications.filter(app => app.status === 'accepted').length;
      
      setStats({
        pendingApplications: pendingCount,
        approvedBooths: approvedCount,
        availableBazaars: allBazaars.length
      });
      
      // Get first 3 bazaars
      setBazaars(allBazaars.slice(0, 3));
      
      // Get 3 most recent applications
      setRecentApplications(applications.slice(0, 3));
      console.log('Recent applications set:', applications.slice(0, 3));
      
      // Filter accepted applications (upcoming events only)
      const accepted = applications.filter(app => 
        app.status === 'accepted' && 
        (app.bazaar_id?.start_date ? new Date(app.bazaar_id.start_date) >= new Date() : true)
      );
      setAcceptedApplications(accepted);
      
      // Filter pending and rejected applications
      const pendingRejected = applications.filter(app => 
        app.status === 'pending' || app.status === 'rejected'
      );
      setPendingRejectedApplications(pendingRejected);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.message);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
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
            <li><Link href="/vendor" className="active">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/polls">📊 Polls</Link></li>
            <li><Link href="/vendor/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Welcome, {user?.vendor_info?.company_name || 'Vendor'}! 👋</h1>
          
          {loading ? (
            <div className="loading">Loading dashboard...</div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <h3>{stats.pendingApplications}</h3>
                    <p>Pending Applications</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{stats.approvedBooths}</h3>
                    <p>Approved Booths</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎪</div>
                  <div className="stat-info">
                    <h3>{stats.availableBazaars}</h3>
                    <p>Available Bazaars</p>
                  </div>
                </div>
              </div>

              <section className="section">
                <div className="section-header">
                  <h2>Available Bazaars</h2>
                  <Link href="/vendor/bazaars" className="btn-primary">Browse All</Link>
                </div>
                
                {bazaars.length === 0 ? (
                  <div className="empty-state">
                    <p>🎪 No bazaars available for applications</p>
                  </div>
                ) : (
                  <div className="bazaars-preview">
                    {bazaars.map((bazaar) => (
                      <div key={bazaar._id} className="preview-card">
                        <div className="preview-header">
                          <h3>{bazaar.name}</h3>
                          <span className={`badge badge-${bazaar.status}`}>
                            {bazaar.registration_open ? '🟢 Open' : '🔴 Closed'}
                          </span>
                        </div>
                        <div className="preview-details">
                          <p>📍 {bazaar.location}</p>
                          <p>📅 {formatDate(bazaar.start_date)}</p>
                          <p>⏰ {bazaar.days_until_start} days until start</p>
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => router.push(`/vendor/apply-bazaar?bazaar_id=${bazaar._id}`)}
                          disabled={!bazaar.registration_open}
                        >
                          {bazaar.registration_open ? 'Apply Now' : 'Registration Closed'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>My Upcoming Events (Accepted)</h2>
                  <Link href="/vendor/applications" className="btn-primary">View All Applications</Link>
                </div>
                
                {acceptedApplications.length === 0 ? (
                  <div className="empty-state">
                    <p>✅ No accepted applications yet</p>
                    <Link href="/vendor/bazaars" className="btn-primary" style={{marginTop: '1rem', display: 'inline-block'}}>
                      Browse Bazaars
                    </Link>
                  </div>
                ) : (
                  <div className="applications-preview">
                    {acceptedApplications.map((app) => (
                      <div key={app._id} className="preview-card accepted-card">
                        <div className="preview-header">
                          <h3>{app.bazaar_id?.name || 'Booth Event Application'}</h3>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: '#28a745' }}
                          >
                            ✅ Accepted
                          </span>
                        </div>
                        <div className="preview-details">
                          <p>🏢 {app.business_name}</p>
                          <p>📦 Booth Size: {app.booth_size}</p>
                          <p>🏷️ Type: {app.kind === 'bazaar' ? 'Bazaar' : 'Booth Event'}</p>
                          {app.bazaar_id?.start_date && (
                            <p>🗓️ Event Date: {formatDate(app.bazaar_id.start_date)}</p>
                          )}
                          {app.bazaar_id?.location && (
                            <p>📍 Location: {app.bazaar_id.location}</p>
                          )}
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => router.push('/vendor/applications')}
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>Pending & Rejected Requests</h2>
                  <Link href="/vendor/applications" className="btn-primary">View All</Link>
                </div>
                
                {pendingRejectedApplications.length === 0 ? (
                  <div className="empty-state">
                    <p>📋 No pending or rejected applications</p>
                  </div>
                ) : (
                  <div className="applications-preview">
                    {pendingRejectedApplications.map((app) => (
                      <div key={app._id} className="preview-card">
                        <div className="preview-header">
                          <h3>{app.bazaar_id?.name || 'Booth Event Application'}</h3>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(app.status) }}
                          >
                            {app.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                          </span>
                        </div>
                        <div className="preview-details">
                          <p>🏢 {app.business_name}</p>
                          <p>📦 Booth Size: {app.booth_size}</p>
                          <p>🏷️ Type: {app.kind === 'bazaar' ? 'Bazaar' : 'Booth Event'}</p>
                          <p>📅 Applied: {formatDate(app.applied_at)}</p>
                          {app.bazaar_id?.start_date && (
                            <p>🗓️ Event: {formatDate(app.bazaar_id.start_date)}</p>
                          )}
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => router.push('/vendor/applications')}
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>GUC Loyalty Program 🎁</h2>
                  <Link href="/vendor/loyalty-program" className="btn-primary">Manage</Link>
                </div>
                
                {loyaltyProgramStatus?.has_application && loyaltyProgramStatus.application ? (
                  <div className="preview-card" style={{
                    borderLeft: `4px solid ${
                      loyaltyProgramStatus.application.status === 'active' ? '#28a745' :
                      loyaltyProgramStatus.application.status === 'pending' ? '#ffc107' :
                      '#6c757d'
                    }`
                  }}>
                    <div className="preview-header">
                      <h3>Loyalty Program Status</h3>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: loyaltyProgramStatus.application.status === 'active' ? '#28a745' :
                                    loyaltyProgramStatus.application.status === 'pending' ? '#ffc107' :
                                    '#6c757d',
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '0.9em',
                        textTransform: 'capitalize'
                      }}>
                        {loyaltyProgramStatus.application.status}
                      </span>
                    </div>
                    <div className="preview-details">
                      {loyaltyProgramStatus.application.status === 'active' && (
                        <>
                          <p>🎫 Promo Code: <strong style={{fontFamily: 'monospace', color: '#1976d2'}}>{loyaltyProgramStatus.application.promo_code}</strong></p>
                          <p>💰 Discount: <strong style={{color: '#c41e3a'}}>{loyaltyProgramStatus.application.discount_rate}%</strong></p>
                        </>
                      )}
                      {loyaltyProgramStatus.application.status === 'pending' && (
                        <p>⏳ Your application is pending admin approval</p>
                      )}
                    </div>
                    <button 
                      className="btn-secondary"
                      onClick={() => router.push('/vendor/loyalty-program')}
                    >
                      View Details
                    </button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>🎁 You haven't joined the loyalty program yet</p>
                    <Link href="/vendor/loyalty-program" className="btn-primary" style={{marginTop: '1rem', display: 'inline-block'}}>
                      Apply Now
                    </Link>
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>My Recent Applications</h2>
                  <Link href="/vendor/applications" className="btn-primary">View All</Link>
                </div>
                
                {recentApplications.length === 0 ? (
                  <div className="empty-state">
                    <p>📋 You haven't submitted any booth applications yet</p>
                    <Link href="/vendor/bazaars" className="btn-primary" style={{marginTop: '1rem', display: 'inline-block'}}>
                      Browse Bazaars
                    </Link>
                  </div>
                ) : (
                  <div className="applications-preview">
                    {recentApplications.map((app) => (
                      <div key={app._id} className="preview-card">
                        <div className="preview-header">
                          <h3>{app.bazaar_id?.name || 'Booth Event Application'}</h3>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(app.status) }}
                          >
                            {app.status}
                          </span>
                        </div>
                        <div className="preview-details">
                          <p>📦 Booth Size: {app.booth_size}</p>
                          <p>🏷️ Type: {app.kind === 'bazaar' ? 'Bazaar' : 'Booth Event'}</p>
                          <p>📅 Applied: {formatDate(app.applied_at)}</p>
                          {app.bazaar_id?.start_date && (
                            <p>🗓️ Event: {formatDate(app.bazaar_id.start_date)}</p>
                          )}
                        </div>
                        <button 
                          className="btn-secondary"
                          onClick={() => router.push('/vendor/applications')}
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-info h3 {
          margin: 0;
          font-size: 2rem;
          color: #c41e3a;
        }

        .stat-info p {
          margin: 0.25rem 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .section {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0;
          color: #c41e3a;
        }

        .bazaars-preview,
        .applications-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .preview-card {
          border: 2px solid #f0f0f0;
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s;
        }

        .preview-card:hover {
          border-color: #c41e3a;
        }

        .accepted-card {
          border-left: 4px solid #28a745;
          background: linear-gradient(to right, #f0fff4 0%, white 100%);
        }

        .accepted-card:hover {
          border-color: #28a745;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
          flex: 1;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .badge-upcoming {
          background: #e3f2fd;
          color: #1976d2;
        }

        .badge-active {
          background: #e8f5e9;
          color: #388e3c;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .preview-details {
          margin-bottom: 1rem;
        }

        .preview-details p {
          margin: 0.5rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          display: inline-block;
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
          width: 100%;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #666;
        }

        .empty-state p {
          margin: 0;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}