'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function AdminFacilitiesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'court',
    capacity: '',
    location: '',
    amenities: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/facilities/add
    console.log('Add facility:', formData);
    setShowAddForm(false);
    setFormData({ name: '', type: 'court', capacity: '', location: '', amenities: '' });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👑 Admin Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 User Management</Link></li>
            <li><Link href="/admin/events">📅 Event Management</Link></li>
            <li><Link href="/admin/registrations">📝 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Reports</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Facilities Management 🏟️</h1>

          <section className="section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2>All Facilities</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? '❌ Cancel' : '➕ Add Facility'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleSubmit} className="form" style={{marginBottom: '2rem'}}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Facility Name *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      placeholder="e.g., Main Basketball Court"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="type">Type *</label>
                    <select
                      id="type"
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="court">Court</option>
                      <option value="field">Field</option>
                      <option value="hall">Hall</option>
                      <option value="gym">Gym</option>
                      <option value="pool">Pool</option>
                      <option value="track">Track</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="capacity">Capacity *</label>
                    <input
                      type="number"
                      id="capacity"
                      min="1"
                      required
                      placeholder="Maximum number of people"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      required
                      placeholder="Building / Floor / Room"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="amenities">Amenities</label>
                  <textarea
                    id="amenities"
                    rows="3"
                    placeholder="List available amenities (lockers, showers, equipment, etc.)"
                    value={formData.amenities}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Add Facility</button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ name: '', type: 'court', capacity: '', location: '', amenities: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🏟️ No facilities registered yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/facilities/getAll<br/>
                          POST /api/facilities/add
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="section">
            <h2>Facility Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏟️</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Total Facilities</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Available</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔧</div>
                <div className="stat-info">
                  <h3>0</h3>
                  <p>Under Maintenance</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>0%</h3>
                  <p>Utilization Rate</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
