'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

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
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Reports</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Reports & Analytics 📊</h1>
            <button className="btn-primary">📥 Export Report</button>
          </div>

          {/* Report Options */}
          <section className="section">
            <h2>Generate Report</h2>
            <div className="report-controls">
              <div className="form-group">
                <label>Report Type</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5'}}
                >
                  <option value="overview">System Overview</option>
                  <option value="events">Events Summary</option>
                  <option value="registrations">Registration Analytics</option>
                  <option value="users">User Statistics</option>
                  <option value="revenue">Revenue Report</option>
                  <option value="vendors">Vendor Performance</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date Range</label>
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5'}}
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <button className="btn-primary" style={{marginTop: '1.5rem'}}>
                📊 Generate Report
              </button>
            </div>
          </section>

          {/* Key Metrics */}
          <section className="section">
            <h2>Key Metrics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Total Events</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎫</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Total Registrations</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Active Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>$0</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="section">
            <h2>Popular Events (by Registration)</h2>
            <div className="empty-state">
              <p>📊 No data available</p>
              <p style={{fontSize: '0.9rem', color: '#999'}}>
                Analytics will appear here once you connect to the backend API
              </p>
            </div>
          </section>

          {/* Quick Reports */}
          <section className="section">
            <h2>Quick Reports</h2>
            <div className="admin-grid">
              <div className="admin-card">
                <div className="admin-icon">📈</div>
                <h3>Event Performance</h3>
                <p>View detailed analytics for all events</p>
                <button className="btn-secondary" style={{marginTop: '1rem'}}>View Report</button>
              </div>
              <div className="admin-card">
                <div className="admin-icon">👥</div>
                <h3>User Activity</h3>
                <p>Track user engagement and behavior</p>
                <button className="btn-secondary" style={{marginTop: '1rem'}}>View Report</button>
              </div>
              <div className="admin-card">
                <div className="admin-icon">💰</div>
                <h3>Financial Summary</h3>
                <p>Revenue and payment statistics</p>
                <button className="btn-secondary" style={{marginTop: '1rem'}}>View Report</button>
              </div>
              <div className="admin-card">
                <div className="admin-icon">🏪</div>
                <h3>Vendor Analytics</h3>
                <p>Vendor application and booth data</p>
                <button className="btn-secondary" style={{marginTop: '1rem'}}>View Report</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
