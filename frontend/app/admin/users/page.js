'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

// Add styles
const deleteButtonStyles = `
  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background-color: #c82333;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 0.85em;
    margin: 0 2px;
  }

  .ml-2 {
    margin-left: 0.5rem;
  }

  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
  }

  .modal.show {
    display: block;
  }

  .modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 500px;
    border-radius: 5px;
  }

  .modal-header {
    margin-bottom: 15px;
  }

  .modal-title {
    margin: 0;
    color: #dc3545;
  }

  .modal-body {
    margin-bottom: 15px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #5a6268;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = deleteButtonStyles;
  document.head.appendChild(styleSheet);
}

// Add styles
const styles = `
  .role-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 500;
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .text-muted {
    color: #666;
    font-size: 0.85em;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 0.85em;
    margin: 0 2px;
  }

  .btn-success {
    background-color: #4caf50;
    color: white;
  }

  .btn-info {
    background-color: #2196f3;
    color: white;
  }

  .ml-2 {
    margin-left: 0.5rem;
  }

  td div {
    line-height: 1.4;
  }

  .role-select select {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background-color: #fff;
    width: 100%;
    font-size: 0.9em;
    cursor: pointer;
  }

  .role-select select:hover {
    border-color: #2196f3;
  }

  .role-select select:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
import api from '@/utils/api';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, userName }) => {
  return (
    <div className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h4 className="modal-title">Confirm Delete User</h4>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete the user <strong>{userName}</strong>?</p>
          <p style={{color: '#dc3545', fontWeight: 'bold'}}>⚠️ This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete User</button>
        </div>
      </div>
    </div>
  );
};

const UserDetailsModal = ({ isOpen, onClose, userDetails }) => {
  if (!userDetails) return null;

  return (
    <div className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h4 className="modal-title">User Details</h4>
        </div>
        <div className="modal-body">
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div>
              <strong>Name:</strong><br/>
              {userDetails.first_name} {userDetails.last_name}
            </div>
            <div>
              <strong>Email:</strong><br/>
              {userDetails.email}
            </div>
            <div>
              <strong>Role:</strong><br/>
              <span className="role-badge">{userDetails.role}</span>
            </div>
            <div>
              <strong>Status:</strong><br/>
              <span style={{
                color: userDetails.status === 'active' ? '#4caf50' : 
                      userDetails.status === 'blocked' ? '#f44336' : '#666',
                fontWeight: 'bold'
              }}>
                {userDetails.status || 'Active'}
              </span>
            </div>
            {userDetails.id_number && (
              <div>
                <strong>ID Number:</strong><br/>
                {userDetails.id_number}
              </div>
            )}
            {userDetails.phone && (
              <div>
                <strong>Phone:</strong><br/>
                {userDetails.phone}
              </div>
            )}
            <div>
              <strong>Email Verified:</strong><br/>
              {userDetails.is_verified ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Joined Date:</strong><br/>
              {userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : 'N/A'}
            </div>
            {userDetails.last_login && (
              <div>
                <strong>Last Login:</strong><br/>
                {new Date(userDetails.last_login).toLocaleDateString()}
              </div>
            )}
            {userDetails.major && (
              <div>
                <strong>Major:</strong><br/>
                {userDetails.major}
              </div>
            )}
          </div>
          
          {userDetails.vendor_info && (
            <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
              <h5>Vendor Information</h5>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem'}}>
                {userDetails.vendor_info.company_name && (
                  <div>
                    <strong>Company:</strong><br/>
                    {userDetails.vendor_info.company_name}
                  </div>
                )}
                {userDetails.vendor_info.business_type && (
                  <div>
                    <strong>Business Type:</strong><br/>
                    {userDetails.vendor_info.business_type}
                  </div>
                )}
              </div>
              {userDetails.vendor_info.business_description && (
                <div style={{marginTop: '0.5rem'}}>
                  <strong>Description:</strong><br/>
                  {userDetails.vendor_info.business_description}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserModal, setViewUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Fetch users function (used for initial load and refresh)
  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const { users: allUsers } = await api.get('/admin/users');
      console.log('Fetched users:', allUsers);
      console.log('First user example:', allUsers[0]);
      if (allUsers[0]) {
        console.log('First user _id:', allUsers[0]._id);
        console.log('First user _id type:', typeof allUsers[0]._id);
      }
      setUsers(allUsers);
      
      const { users: pendingUsersData } = await api.get('/admin/pending-users');
      setPendingUsers(pendingUsersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    
    // Auto-refresh every 10 seconds to show updated verification status
    const intervalId = setInterval(() => {
      fetchUsers();
    }, 10000); // Refresh every 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const [adminRole, setAdminRole] = useState('Admin');

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const [firstName, ...lastNameArr] = adminFormData.name.trim().split(' ');
      const lastName = lastNameArr.join(' ');

      if (!firstName || !lastName) {
        throw new Error('Please enter both first and last name');
      }

      const adminData = {
        first_name: firstName,
        last_name: lastName,
        email: adminFormData.email,
        password: adminFormData.password,
        role: adminRole
      };

      // Create the admin user
      await api.post('/admin/create-admin', adminData);
      
      // Refresh the users list
      const { users: updatedUsers } = await api.get('/admin/users');
      setUsers(updatedUsers);

      // Reset form and close
      setAdminFormData({ name: '', email: '', password: '' });
      setShowCreateAdmin(false);
      setAdminRole('Admin');

      alert(`${adminRole} account created successfully!`);
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin: ' + error.message);
    }
  };

  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleDeleteAdmin = (userId) => {
    try {
      const userToDelete = users.find(u => u._id === userId || u.id === userId);
      if (!userToDelete) {
        throw new Error('User not found');
      }

      // Prevent self-deletion
      if (currentUser && currentUser._id === userId) {
        throw new Error('You cannot delete your own account');
      }

      setSelectedUser(userToDelete);
      setModalOpen(true);
    } catch (error) {
      console.error('Error preparing to delete user:', error);
      alert('Error: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    try {
      // Use appropriate delete endpoint based on user role
      if (selectedUser.role === 'Admin' || selectedUser.role === 'EventsOffice') {
        await api.delete(`/admin/delete-admin/${selectedUser._id}`);
      } else {
        // For other users, use the same endpoint (we'll add this if needed)
        await api.delete(`/admin/delete-admin/${selectedUser._id}`);
      }
      
      // Refresh users list
      const { users: updatedUsers } = await api.get('/admin/users');
      setUsers(updatedUsers);

      setModalOpen(false);
      setSelectedUser(null);
      alert('User account deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      console.log('=== HANDLE BLOCK USER DEBUG ===');
      console.log('Received userId:', userId);
      console.log('typeof userId:', typeof userId);
      
      // Validate userId parameter - convert to string if it's an object
      const userIdStr = userId ? userId.toString() : null;
      console.log('userIdStr after conversion:', userIdStr);
      
      if (!userIdStr || userIdStr === 'undefined' || userIdStr === 'null') {
        console.error('Invalid userId passed to handleBlockUser. Original:', userId, 'Converted:', userIdStr);
        alert('Error: Invalid user ID. Please refresh the page and try again.');
        return;
      }

      const userToBlock = users.find(u => u._id === userId || u._id === userIdStr);
      if (!userToBlock) {
        console.error('User not found with ID:', userIdStr);
        throw new Error('User not found');
      }
      
      const action = userToBlock.status === 'blocked' ? 'unblock' : 'block';
      
      console.log('Blocking/unblocking user:', { userId: userIdStr, action, userToBlock });
      
      // Use the adminAPI helper from utils/api.js
      const response = await api.post(`/admin/user/${userIdStr}/block`, { action });

      console.log('Block/unblock response:', response);

      // Refresh the users list
      const { users: updatedUsers } = await api.get('/admin/users');
      setUsers(updatedUsers);

      alert(`User ${action}ed successfully!`);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      console.error('Error details:', error.response);
      alert('Failed to update user status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      // Find the user in pendingUsers array
      const userToApprove = pendingUsers.find(u => u._id === userId);
      if (!userToApprove) {
        throw new Error('User not found');
      }

      // Confirm role assignment
      if (!confirm(`Are you sure you want to approve this user as ${userToApprove.role}?`)) {
        return;
      }

      // Call API to approve user with the selected role
      await api.post(`/admin/approve/${userToApprove._id}`, {
        role: userToApprove.role
      });
      
      // Refresh both pending users and all users lists
      const [pendingResponse, allUsersResponse] = await Promise.all([
        api.get('/admin/pending-users'),
        api.get('/admin/users')
      ]);

      setPendingUsers(pendingResponse.users);
      setUsers(allUsersResponse.users);

      alert(`User approved successfully as ${userToApprove.role}! A verification email will be sent.`);
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user: ' + error.message);
    }
  };

  const handleResendVerification = async (userId) => {
    try {
      await api.post(`/admin/resend-verification/${userId}`);
      alert('Verification email sent successfully!');
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email: ' + error.message);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      console.log('Fetching user details for:', userId);
      
      // Find user in current users list first
      const user = users.find(u => u._id === userId);
      if (user) {
        setUserDetails(user);
        setViewUserModal(true);
      } else {
        // If not found, try to fetch from API
        const userResponse = await api.get(`/admin/user/${userId}`);
        setUserDetails(userResponse.user || userResponse);
        setViewUserModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to fetch user details: ' + error.message);
    }
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
        {modalOpen && selectedUser && (
          <ConfirmationModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmDelete}
            userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
          />
        )}
        
        {viewUserModal && userDetails && (
          <UserDetailsModal
            isOpen={viewUserModal}
            onClose={() => {
              setViewUserModal(false);
              setUserDetails(null);
            }}
            userDetails={userDetails}
          />
        )}
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
            <h1>Manage Users 👥</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary"
                onClick={fetchUsers}
                title="Refresh user list"
              >
                🔄 Refresh
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateAdmin(!showCreateAdmin)}
              >
                {showCreateAdmin ? '❌ Cancel' : '➕ Create Admin'}
              </button>
            </div>
          </div>

          {/* Create Admin Form */}
          {showCreateAdmin && (
            <section className="section">
              <h2>Create New Admin</h2>
              <form onSubmit={handleCreateAdmin} className="form">
                <div className="form-group">
                  <label htmlFor="adminName">Full Name *</label>
                  <input
                    type="text"
                    id="adminName"
                    required
                    placeholder="Enter full name (e.g., John Smith)"
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
                    placeholder="email@guc.edu.eg"
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
                <div className="form-group">
                  <label htmlFor="adminRole">Role *</label>
                  <select
                    id="adminRole"
                    className="form-select"
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    required
                  >
                    <option value="Admin">Admin</option>
                    <option value="EventsOffice">Events Office</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Create {adminRole}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateAdmin(false);
                      setAdminFormData({ name: '', email: '', password: '' });
                      setAdminRole('Admin');
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <small style={{color: '#666', marginTop: '1rem', display: 'block'}}>
                  Note: Email must be a valid GUC email address
                </small>
              </form>
            </section>
          )}

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{users.length}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{pendingUsers.length}</h3>
                <p>Pending Approval</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👑</div>
              <div className="stat-info">
                <h3>{users.filter(user => user.role === 'Admin').length}</h3>
                <p>Admins</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚫</div>
              <div className="stat-info">
                <h3>{users.filter(user => user.status === 'blocked').length}</h3>
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
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        <div className="empty-state">
                          <p>⏳ No pending user approvals</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div>
                            <strong>{user.first_name} {user.last_name}</strong>
                            <br/>
                            <small className="text-muted">{user.id_number || 'No ID'}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            {user.email}
                            <br/>
                            <small className="text-muted">
                              {user.is_verified ? '✅ Email Verified' : '⏳ Email Not Verified'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="role-select">
                            <select 
                              className="form-select"
                              value={user.role}
                              onChange={(e) => {
                                const updatedUsers = pendingUsers.map(u => 
                                  u.id === user.id ? {...u, role: e.target.value} : u
                                );
                                setPendingUsers(updatedUsers);
                              }}
                            >
                              <option value="Staff">👨‍💼 Staff</option>
                              <option value="TA">👨‍� TA</option>
                              <option value="Professor">👨‍🏫 Professor</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <div>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            <br/>
                            <small className="text-muted">
                              {user.createdAt ? new Date(user.createdAt).toLocaleTimeString() : ''}
                            </small>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveUser(user._id)}
                            title="Approve Registration"
                          >
                            ✅ Approve as {user.role}
                          </button>
                          <button
                            className="btn btn-danger btn-sm ml-2"
                            onClick={() => handleDeleteAdmin(user._id)}
                            title="Reject and Delete User"
                          >
                            ❌ Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        <div className="empty-state">
                          <p>👥 No users found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users
                      .filter(user => {
                        if (filter === 'all') return true;
                        return user.role === filter;
                      })
                      .filter(user => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
                        return (
                          fullName.includes(searchLower) ||
                          user.email.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((user) => (
                        <tr key={user._id}>
                          <td>{user.first_name} {user.last_name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>{user.status}</td>
                          <td>
                            {user.createdAt || user.created_at ? 
                              new Date(user.createdAt || user.created_at).toLocaleDateString() : 
                              'No Date'
                            }
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleViewUser(user._id)}
                            >
                              👁️ View
                            </button>
                            {/* Allow blocking any user except yourself */}
                            {user._id !== currentUser?._id && (
                              <button 
                                className={`btn ${user.status === 'blocked' ? 'btn-success' : 'btn-warning'} btn-sm`}
                                onClick={() => {
                                  console.log('=== BLOCK BUTTON DEBUG ===');
                                  console.log('Full user object:', user);
                                  console.log('user._id:', user._id);
                                  console.log('user.id:', user.id);
                                  console.log('typeof user._id:', typeof user._id);
                                  console.log('user._id toString():', user._id ? user._id.toString() : 'null');
                                  console.log('========================');
                                  handleBlockUser(user._id);
                                }}
                                title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                              >
                                {user.status === 'blocked' ? '🔓 Unblock' : '🔒 Block'}
                              </button>
                            )}
                            {/* Resend verification email for unverified users (Student, Staff, TA, Professor only) */}
                            {!user.is_verified && ['Student', 'Staff', 'TA', 'Professor'].includes(user.role) && (
                              <button
                                className="btn btn-info btn-sm ml-2"
                                onClick={() => handleResendVerification(user._id)}
                                title="Resend Verification Email"
                              >
                                📧 Resend Email
                              </button>
                            )}
                            {/* Allow deleting any user except yourself */}
                            {user._id !== currentUser?._id && (
                              <button
                                className="btn btn-danger btn-sm ml-2"
                                onClick={() => handleDeleteAdmin(user._id)}
                                title={`Delete ${user.role} Account`}
                              >
                                ❌ Delete
                              </button>
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
    </div>
  );
}
