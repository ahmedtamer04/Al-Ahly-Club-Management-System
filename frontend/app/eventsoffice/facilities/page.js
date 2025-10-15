'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function FacilitiesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'football',
    location: '',
    capacity: '',
    availability: 'available',
    hourlyRate: '',
    amenities: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/facility/add
    console.log('Add facility:', formData);
    setShowAddForm(false);
    setFormData({
      name: '', type: 'football', location: '', capacity: '', 
      availability: 'available', hourlyRate: '', amenities: '', description: ''
    });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">🎨 Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🎪 Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Facilities Management 🏟️</h1>
            <button 
              className="btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✖ Cancel' : '➕ Add Facility'}
            </button>
          </div>

          {showAddForm && (
            <section className="section">
              <h2>Add New Facility</h2>
              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Facility Name *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      placeholder="e.g., Main Football Field"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="type">Facility Type *</label>
                    <select
                      id="type"
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="football">⚽ Football Field</option>
                      <option value="basketball">🏀 Basketball Court</option>
                      <option value="tennis">🎾 Tennis Court</option>
                      <option value="volleyball">🏐 Volleyball Court</option>
                      <option value="gym">🏋️ Gym</option>
                      <option value="swimming">🏊 Swimming Pool</option>
                      <option value="multipurpose">🎯 Multi-purpose Hall</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      required
                      placeholder="Building/Area"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="capacity">Capacity *</label>
                    <input
                      type="number"
                      id="capacity"
                      min="1"
                      required
                      placeholder="Max number of people"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hourlyRate">Hourly Rate (EGP)</label>
                    <input
                      type="number"
                      id="hourlyRate"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="amenities">Amenities</label>
                  <input
                    type="text"
                    id="amenities"
                    placeholder="e.g., Lockers, Showers, Equipment provided"
                    value={formData.amenities}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    rows="3"
                    placeholder="Additional details about the facility..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="availability">Availability Status *</label>
                  <select
                    id="availability"
                    required
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  >
                    <option value="available">✅ Available</option>
                    <option value="maintenance">🔧 Under Maintenance</option>
                    <option value="reserved">📅 Reserved</option>
                    <option value="closed">🚫 Closed</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Add Facility</button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="section">
            <h2>All Facilities</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Facility Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Rate/Hour</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" className="empty-row">
                      <div className="empty-state">
                        <p>🏟️ No facilities added yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999', marginTop: '10px'}}>
                          TODO API Endpoints:<br/>
                          GET /api/facility/getAll - View all facilities<br/>
                          POST /api/facility/add - Add new facility (EventsOffice/Admin only)
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
