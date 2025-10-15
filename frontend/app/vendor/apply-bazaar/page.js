'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../../dashboard.css';

export default function ApplyBazaarPage() {
  const [bazaars, setBazaars] = useState([]);
  const [selectedBazaar, setSelectedBazaar] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    productsOffered: '',
    previousExperience: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/vendors/apply-bazaar
    console.log('Apply to bazaar:', { bazaarId: selectedBazaar, ...formData });
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
          <h1>Apply to Bazaar 🏪</h1>

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="bazaarId">Select Bazaar *</label>
                <select
                  id="bazaarId"
                  required
                  value={selectedBazaar}
                  onChange={(e) => setSelectedBazaar(e.target.value)}
                >
                  <option value="">-- Choose a bazaar --</option>
                  <option value="1">Spring Market 2025</option>
                  <option value="2">Tech Expo Fall</option>
                </select>
                <small style={{color: '#999', marginTop: '0.5rem', display: 'block'}}>
                  API: GET /api/bazaar/getAll (to load available bazaars)
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
                  placeholder="Describe your business, what makes it unique..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productsOffered">Products/Services Offered *</label>
                <textarea
                  id="productsOffered"
                  rows="3"
                  required
                  placeholder="List the products or services you plan to offer at the bazaar"
                  value={formData.productsOffered}
                  onChange={(e) => setFormData({...formData, productsOffered: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="previousExperience">Previous Experience</label>
                <textarea
                  id="previousExperience"
                  rows="3"
                  placeholder="Share any previous experience at bazaars, markets, or events"
                  value={formData.previousExperience}
                  onChange={(e) => setFormData({...formData, previousExperience: e.target.value})}
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
                    businessName: '', businessType: '', description: '', productsOffered: '',
                    previousExperience: '', contactPhone: '', contactEmail: ''
                  })}
                >
                  Reset Form
                </button>
              </div>

              <small style={{color: '#999', marginTop: '1rem', display: 'block'}}>
                API Endpoint: POST /api/vendors/apply-bazaar
              </small>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
