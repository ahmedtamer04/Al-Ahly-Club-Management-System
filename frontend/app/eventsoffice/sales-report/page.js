'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { salesReportAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function SalesReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [eventType, setEventType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (eventType !== 'all') params.event_type = eventType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      params.sort_by = sortBy;
      params.sort_order = sortOrder;

      const data = await salesReportAPI.getSalesReport(params);
      setReport(data);
    } catch (err) {
      console.error('Error fetching sales report:', err);
      setError(err.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchReport();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
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
            <span className="nav-user">🎯 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/events">📅 View All Events</Link></li>
            <li><Link href="/eventsoffice/conferences">🎓 Conferences</Link></li>
            <li><Link href="/eventsoffice/trips">✈️ Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🛍️ Bazaars</Link></li>
            <li><Link href="/eventsoffice/vendors">👥 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/registrations">📋 Registrations</Link></li>
            <li><Link href="/eventsoffice/sales-report" className="active">💰 Sales Report</Link></li>
            <li><Link href="/eventsoffice/documents">📄 Documents</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="section-header">
            <h1>💰 Sales Report</h1>
            <button onClick={fetchReport} className="btn-secondary" disabled={loading}>
              {loading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Filters */}
          <section className="section" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
            <h2>🔍 Filters & Sorting</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="all">All Types</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Trip">Trip</option>
                  <option value="Conference">Conference</option>
                  <option value="Bazaar">Bazaar</option>
                  <option value="Booth">Booth</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="revenue">Revenue</option>
                  <option value="event_name">Event Name</option>
                  <option value="start_date">Start Date</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="desc">Highest First</option>
                  <option value="asc">Lowest First</option>
                </select>
              </div>
            </div>

            <button onClick={handleFilter} className="btn-primary" disabled={loading}>
              Apply Filters
            </button>
          </section>

          {/* Error Message */}
          {error && (
            <div className="empty-state" style={{ color: 'red', marginBottom: '24px' }}>
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="empty-state">
              <p>Loading sales report...</p>
            </div>
          )}

          {/* Report Data */}
          {!loading && report && (
            <>
              {/* Totals Summary */}
              <section className="section">
                <h2>📊 Summary</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <h3>{formatCurrency(report.totals?.total_revenue || 0)}</h3>
                      <p>Total Revenue</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-info">
                      <h3>{report.totals?.total_attendees || 0}</h3>
                      <p>Total Attendees</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <h3>{report.totals?.total_paid_registrations || 0}</h3>
                      <p>Paid Registrations</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                      <h3>{report.totals?.total_unpaid_registrations || 0}</h3>
                      <p>Unpaid Registrations</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                      <h3>{report.totals?.total_events || 0}</h3>
                      <p>Events</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detailed Report Table */}
              <section className="section">
                <h2>📋 Detailed Report</h2>
                {report.report && report.report.length === 0 ? (
                  <div className="empty-state">
                    <p>No events found matching your filters</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Event Name</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Revenue</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Attendees</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Unpaid</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Paid</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Free</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.report?.map((item, index) => (
                          <tr key={item.event_id || index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>{item.event_name}</td>
                            <td style={{ padding: '12px' }}>{item.event_type}</td>
                            <td style={{ padding: '12px' }}>
                              {formatDate(item.start_date)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                              {formatCurrency(item.revenue)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{item.total_attendees}</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#e67e22' }}>{item.unpaid_registrations || 0}</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#28a745' }}>{item.paid_registrations}</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>{item.free_registrations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

