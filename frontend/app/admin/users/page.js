'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '../../dashboard.css';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // TODO: Fetch all users - GET /api/admin/users
  // TODO: Fetch pending users - GET /api/admin/pending-users
  // TODO: Fetch admin users - GET /api/admin/admin-users

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    // TODO: POST /api/admin/create-admin
    console.log('Create admin:', adminFormData);
    setShowCreateAdmin(false);
  };

  const handleDeleteAdmin = (userId) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      // TODO: DELETE /api/admin/delete-admin/:userId
      console.log('Delete admin:', userId);
    }
  };

  const handleBlockUser = (userId) => {
    // TODO: POST /api/admin/user/:userId/block
    console.log('Toggle block user:', userId);
  };

  const handleApproveUser = (userId) => {
    // TODO: POST /api/admin/approve/:userId
    console.log('Approve user:', userId);
  };

  const handleResendVerification = (userId) => {
    // TODO: POST /api/admin/resend-verification/:userId
    console.log('Resend verification:', userId);
  };

  const handleViewUser = (userId) => {
    // TODO: GET /api/admin/user/:userId
    console.log('View user details:', userId);
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
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Reports</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Manage Users 👥</h1>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateAdmin(!showCreateAdmin)}
            >
              {showCreateAdmin ? '❌ Cancel' : '➕ Create Admin'}
            </button>
          </div>

          {/* Create Admin Form */}
          {showCreateAdmin && (
            <section className="section">
              <h2>Create New Admin</h2>
              <form onSubmit={handleCreateAdmin} className="form">
                <div className="form-group">
                  <label htmlFor="adminName">Admin Name *</label>
                  <input
                    type="text"
                    id="adminName"
                    required
                    placeholder="Enter admin name"
                    value={adminFormData.name}
                    onChange={(e) => setAdminFormData({...adminFormData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adminEmail">Email *</label>
                  <input
                    type="email"
                    id="adminEmail"
                    required
                    placeholder="admin@example.com"
                    value={adminFormData.email}
                    onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adminPassword">Password *</label>
                  <input
                    type="password"
                    id="adminPassword"
                    required
                    placeholder="Enter password"
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Create Admin</button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateAdmin(false);
                      setAdminFormData({ name: '', email: '', password: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <small style={{color: '#999', marginTop: '1rem', display: 'block'}}>
                  API: POST /api/admin/create-admin
                </small>
              </form>
            </section>
          )}

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">�</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Pending Approval</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">�</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Admins</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Blocked Users</p>
              </div>
            </div>
          </div>

          {/* Pending Approvals Section */}
          <section className="section">
            <h2>Pending User Approvals ⏳</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Requested Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="5" className="empty-row">
                      <div className="empty-state">
                        <p>⏳ No pending user approvals</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/admin/pending-users<br/>
                          POST /api/admin/approve/:userId<br/>
                          POST /api/admin/resend-verification/:userId
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* All Users Section */}
          <section className="section">
            <h2>All Users</h2>
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search users by name or email..."
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
                  className={filter === 'Admin' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Admin')}
                >
                  Admins
                </button>
                <button 
                  className={filter === 'Student' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Student')}
                >
                  Students
                </button>
                <button 
                  className={filter === 'Staff' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Staff')}
                >
                  Staff
                </button>
                <button 
                  className={filter === 'Professor' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Professor')}
                >
                  Professors
                </button>
                <button 
                  className={filter === 'Vendor' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Vendor')}
                >
                  Vendors
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>👥 No users found</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/admin/users (all users)<br/>
                          GET /api/admin/admin-users (admin users only)<br/>
                          GET /api/admin/user/:userId (specific user)<br/>
                          POST /api/admin/user/:userId/block (block/unblock)<br/>
                          DELETE /api/admin/delete-admin/:userId (delete admin)
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
