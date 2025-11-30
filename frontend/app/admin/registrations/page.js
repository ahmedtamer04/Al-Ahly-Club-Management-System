'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';
import api from '@/utils/api';

// Add custom styles for buttons
const styles = `
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

  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background-color: #c82333;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table td {
    padding: 12px 8px;
    vertical-align: top;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0
  });

  // Fetch registrations data
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        console.log('===== FETCHING REGISTRATIONS =====');
        console.log('API endpoint: /registration/all');
        console.log('Token exists:', !!localStorage.getItem('token'));
        console.log('User:', localStorage.getItem('user'));
        
        const response = await api.get('/registration/all');
        console.log('===== API RESPONSE =====');
        console.log('Full response:', response);
        console.log('Response.registrations:', response.registrations);
        console.log('Response.registrations length:', response.registrations?.length);
        console.log('Response.stats:', response.stats);
        
        if (response.registrations && response.registrations.length > 0) {
          console.log('===== SAMPLE DATA =====');
          console.log('First registration:', response.registrations[0]);
          console.log('User ID populated?', response.registrations[0].user_id);
          console.log('Event ID populated?', response.registrations[0].event_id);
        } else {
          console.warn('⚠️ No registrations found in response');
        }
        
        setRegistrations(response.registrations || []);
        
        // Calculate stats
        const registrationsData = response.registrations || [];
        const registrationStats = {
          total: registrationsData.length,
          confirmed: registrationsData.filter(r => r.status === 'registered').length,
          pending: registrationsData.filter(r => r.status === 'pending').length,
          cancelled: registrationsData.filter(r => r.status === 'canceled').length
        };
        
        console.log('===== CALCULATED STATS =====');
        console.log('Stats:', registrationStats);
        setStats(registrationStats);
        
      } catch (error) {
        console.error('===== ERROR FETCHING REGISTRATIONS =====');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setRegistrations([]);
      } finally {
        setLoading(false);
        console.log('===== FETCH COMPLETE =====');
      }
    };

    fetchRegistrations();
  }, []);

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'registered':
        return <span style={{color: '#4caf50', fontWeight: 'bold'}}>✅ Confirmed</span>;
      case 'pending':
        return <span style={{color: '#ff9800', fontWeight: 'bold'}}>⏳ Pending</span>;
      case 'canceled':
        return <span style={{color: '#f44336', fontWeight: 'bold'}}>❌ Cancelled</span>;
      default:
        return <span style={{color: '#666', fontWeight: 'bold'}}>❓ Unknown</span>;
    }
  };

  // Helper function to get event type badge
  const getEventTypeBadge = (eventType) => {
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: '500',
        backgroundColor: 
          eventType === 'Workshop' ? '#e3f2fd' :
          eventType === 'Trip' ? '#f3e5f5' :
          eventType === 'Bazaar' ? '#fff3e0' :
          eventType === 'Booth' ? '#e8f5e8' :
          eventType === 'Conference' ? '#fce4ec' : '#f5f5f5',
        color:
          eventType === 'Workshop' ? '#1976d2' :
          eventType === 'Trip' ? '#7b1fa2' :
          eventType === 'Bazaar' ? '#ef6c00' :
          eventType === 'Booth' ? '#388e3c' :
          eventType === 'Conference' ? '#c2185b' : '#666'
      }}>
        {eventType}
      </span>
    );
  };

  // Filter registrations based on status and search term
  const filteredRegistrations = registrations.filter(registration => {
    // Filter by status
    if (filter !== 'all') {
      const statusMap = {
        'confirmed': 'registered',
        'pending': 'pending',
        'cancelled': 'canceled'
      };
      if (registration.status !== statusMap[filter]) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = `${registration.user_id?.first_name || ''} ${registration.user_id?.last_name || ''}`.toLowerCase();
      const eventName = registration.event_id?.name?.toLowerCase() || '';
      const userEmail = registration.email?.toLowerCase() || '';
      
      return userName.includes(searchLower) || 
             eventName.includes(searchLower) || 
             userEmail.includes(searchLower);
    }
    
    return true;
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
            <h1>All Registrations 🎫</h1>
            <button className="btn-secondary">📥 Export Data</button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.confirmed}</h3>
                <p>Confirmed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats.cancelled}</h3>
                <p>Cancelled</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by user or event name..."
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
                  className={filter === 'confirmed' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('confirmed')}
                >
                  Confirmed
                </button>
                <button 
                  className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={filter === 'cancelled' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('cancelled')}
                >
                  Cancelled
                </button>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Event</th>
                    <th>Event Type</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                    <th>User Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <div className="empty-state">
                          <p>⏳ Loading registrations...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <div className="empty-state">
                          <p>🎫 No registrations found</p>
                          {registrations.length === 0 ? (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              There are no registrations in the database yet. Create some registrations to see them here.
                            </p>
                          ) : filter !== 'all' ? (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              No {filter} registrations match your search criteria
                            </p>
                          ) : searchTerm ? (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              Try adjusting your search terms
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((registration) => (
                      <tr key={registration._id}>
                        <td>
                          <div>
                            <strong>
                              {registration.user_id ? 
                                `${registration.user_id.first_name} ${registration.user_id.last_name}` : 
                                registration.name || 'Unknown User'
                              }
                            </strong>
                            <br/>
                            <small style={{color: '#666', fontSize: '0.85em'}}>
                              {registration.user_id?.email || registration.email}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{registration.event_id?.name || 'Unknown Event'}</strong>
                            <br/>
                            <small style={{color: '#666', fontSize: '0.85em'}}>
                              {registration.event_id?.location || 'No location'}
                            </small>
                          </div>
                        </td>
                        <td>{getEventTypeBadge(registration.event_id?.type || 'Unknown')}</td>
                        <td>
                          <div>
                            <strong>{new Date(registration.createdAt).toLocaleDateString()}</strong>
                            <br/>
                            <small style={{color: '#666'}}>
                              {new Date(registration.createdAt).toLocaleTimeString()}
                            </small>
                          </div>
                        </td>
                        <td>{getStatusBadge(registration.status)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '0.8em',
                            fontWeight: '500',
                            backgroundColor: '#f0f0f0',
                            color: '#666'
                          }}>
                            {registration.role || registration.user_id?.role || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => alert(`User: ${registration.user_id?.email || registration.email}\nPersonal ID: ${registration.personalId}\nRegistered: ${new Date(registration.createdAt).toLocaleString()}`)}
                            title="View Registration Details"
                          >
                            👁️ View
                          </button>
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
    </div>
  );
}
