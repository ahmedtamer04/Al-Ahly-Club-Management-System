'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function ApplyBoothPage() {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    boothSize: 'small',
    equipmentNeeded: '',
    setupRequirements: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/vendors/apply-booth
    console.log('Apply for booth:', { boothId: selectedBooth, ...formData });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 Vendor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/bazaars">🏪 Available Bazaars</Link></li>
            <li><Link href="/vendor/apply-bazaar">📝 Apply to Bazaar</Link></li>
            <li><Link href="/vendor/apply-booth">🎪 Apply for Booth</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Apply for Booth 🎪</h1>

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="boothId">Select Available Booth *</label>
                <select
                  id="boothId"
                  required
                  value={selectedBooth}
                  onChange={(e) => setSelectedBooth(e.target.value)}
                >
                  <option value="">-- Choose a booth --</option>
                  <option value="1">Booth A1 - Main Hall</option>
                  <option value="2">Booth B3 - Corner Spot</option>
                </select>
                <small style={{color: '#999', marginTop: '0.5rem', display: 'block'}}>
                  API: GET /api/vendors/available-booths (to load available booths)
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name *</label>
                  <input
                    type="text"
                    id="businessName"
                    required
                    placeholder="Your business name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessType">Business Type *</label>
                  <select
                    id="businessType"
                    required
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  >
                    <option value="">-- Select type --</option>
                    <option value="food">Food & Beverages</option>
                    <option value="retail">Retail & Products</option>
                    <option value="services">Services</option>
                    <option value="crafts">Arts & Crafts</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Business Description *</label>
                <textarea
                  id="description"
                  rows="4"
                  required
                  placeholder="Describe your business and what you'll showcase..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="boothSize">Preferred Booth Size *</label>
                <select
                  id="boothSize"
                  required
                  value={formData.boothSize}
                  onChange={(e) => setFormData({...formData, boothSize: e.target.value})}
                >
                  <option value="small">Small (3m x 3m)</option>
                  <option value="medium">Medium (6m x 3m)</option>
                  <option value="large">Large (6m x 6m)</option>
                  <option value="xl">Extra Large (9m x 6m)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="equipmentNeeded">Equipment Needed</label>
                <textarea
                  id="equipmentNeeded"
                  rows="3"
                  placeholder="List any equipment you'll need (tables, chairs, power outlets, etc.)"
                  value={formData.equipmentNeeded}
                  onChange={(e) => setFormData({...formData, equipmentNeeded: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="setupRequirements">Setup Requirements</label>
                <textarea
                  id="setupRequirements"
                  rows="3"
                  placeholder="Special setup requirements, early access needs, etc."
                  value={formData.setupRequirements}
                  onChange={(e) => setFormData({...formData, setupRequirements: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactPhone">Contact Phone *</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    required
                    placeholder="+20 xxx xxx xxxx"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail">Contact Email *</label>
                  <input
                    type="email"
                    id="contactEmail"
                    required
                    placeholder="vendor@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Submit Application</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setFormData({
                    businessName: '', businessType: '', description: '', boothSize: 'small',
                    equipmentNeeded: '', setupRequirements: '', contactPhone: '', contactEmail: ''
                  })}
                >
                  Reset Form
                </button>
              </div>

              <small style={{color: '#999', marginTop: '1rem', display: 'block'}}>
                API Endpoint: POST /api/vendors/apply-booth
              </small>
            </form>
          </section>

          <section className="section">
            <h2>Booth Pricing</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>$200</h3>
                  <p>Small Booth</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦📦</div>
                <div className="stat-info">
                  <h3>$400</h3>
                  <p>Medium Booth</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦📦📦</div>
                <div className="stat-info">
                  <h3>$600</h3>
                  <p>Large Booth</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦📦📦📦</div>
                <div className="stat-info">
                  <h3>$900</h3>
                  <p>XL Booth</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
