'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function CreateBazaarPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxVendors: '50',
    boothPrice: '',
    category: 'general',
    specialRequirements: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/bazaar/create
    console.log('Create bazaar:', formData);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">📋 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">� Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">� Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Create Bazaar 🏪</h1>

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="title">Bazaar Title *</label>
                <input
                  type="text"
                  id="title"
                  required
                  placeholder="e.g., Spring Market 2025"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  rows="4"
                  required
                  placeholder="Describe the bazaar theme, type of vendors expected..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="time"
                    id="endTime"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    required
                    placeholder="Venue/Building"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxVendors">Max Vendors *</label>
                  <input
                    type="number"
                    id="maxVendors"
                    min="1"
                    max="500"
                    required
                    value={formData.maxVendors}
                    onChange={(e) => setFormData({...formData, maxVendors: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="boothPrice">Booth Price (EGP) *</label>
                  <input
                    type="number"
                    id="boothPrice"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.boothPrice}
                    onChange={(e) => setFormData({...formData, boothPrice: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="food">Food & Beverages</option>
                  <option value="crafts">Arts & Crafts</option>
                  <option value="technology">Technology</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="books">Books & Stationery</option>
                  <option value="charity">Charity</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="specialRequirements">Special Requirements</label>
                <textarea
                  id="specialRequirements"
                  rows="3"
                  placeholder="Vendor requirements, setup rules, restrictions..."
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create Bazaar</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setFormData({
                    title: '', description: '', date: '', startTime: '', endTime: '',
                    location: '', maxVendors: '50', boothPrice: '', category: 'general',
                    specialRequirements: ''
                  })}
                >
                  Reset
                </button>
              </div>

              <small style={{color: '#999', marginTop: '1rem', display: 'block'}}>
                API: POST /api/bazaar/create
              </small>
            </form>
          </section>

          <section className="section">
            <h2>Existing Bazaars</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Vendors Applied / Max</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🏪 No bazaars created yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/bazaar/getAll<br/>
                          PUT /api/bazaar/edit/:id
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
