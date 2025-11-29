'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function ApplyBazaarPage() {
  // Initialize as null to match server-side rendering
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [bazaars, setBazaars] = useState([]);
  const [selectedBazaar, setSelectedBazaar] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [boothSize, setBoothSize] = useState('2x2');
  const [staffMembers, setStaffMembers] = useState([{ name: '', email: '' }]);

  // Load user data on client side only
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  // Fetch available bazaars (excluding already applied)
  useEffect(() => {
    if (isClient) {
      fetchAvailableBazaars();
    }
  }, [isClient]);

  const fetchAvailableBazaars = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all upcoming bazaars
      const bazaarsResponse = await vendorAPI.getUpcomingBazaars();
      const allBazaars = bazaarsResponse.bazaars || [];
      
      // Fetch vendor's applications
      const applicationsResponse = await vendorAPI.getMyApplications();
      const applications = applicationsResponse.applications || [];
      
      // Get IDs of bazaars the vendor has already applied to
      const appliedBazaarIds = applications
        .filter(app => app.kind === 'bazaar' && app.bazaar_id?._id)
        .map(app => app.bazaar_id._id);
      
      // Filter out bazaars the vendor has already applied to
      const availableBazaars = allBazaars.filter(
        bazaar => !appliedBazaarIds.includes(bazaar._id)
      );
      
      setBazaars(availableBazaars);
    } catch (err) {
      console.error('Error fetching bazaars:', err);
      setError('Failed to load available bazaars');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate staff members
    const validStaff = staffMembers.filter(s => s.name.trim() && s.email.trim());
    if (validStaff.length === 0) {
      setError('Please add at least one staff member with name and email');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const applicationData = {
        bazaar_id: selectedBazaar,
        booth_size: boothSize,
        bazaar_staff: validStaff
      };

      const response = await vendorAPI.applyToBazaar(applicationData);
      
      setSuccess('Application submitted successfully! Redirecting to applications page...');
      
      // Reset form
      setSelectedBazaar('');
      setBoothSize('2x2');
      setStaffMembers([{ name: '', email: '' }]);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/vendor/applications';
      }, 2000);

    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addStaffMember = () => {
    if (staffMembers.length < 5) {
      setStaffMembers([...staffMembers, { name: '', email: '' }]);
    }
  };

  const removeStaffMember = (index) => {
    if (staffMembers.length > 1) {
      setStaffMembers(staffMembers.filter((_, i) => i !== index));
    }
  };

  const updateStaffMember = (index, field, value) => {
    const updated = [...staffMembers];
    updated[index][field] = value;
    setStaffMembers(updated);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 {user?.vendor_info?.company_name || 'Vendor'}</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/polls">📊 Polls</Link></li>
            <li><Link href="/vendor/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Apply to Bazaar 🏪</h1>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fee',
              color: '#dc3545',
              borderRadius: '8px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              border: '1px solid #28a745'
            }}>
              ✅ {success}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading available bazaars...</div>
          ) : (
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
                    {bazaars.length === 0 ? (
                      <option value="" disabled>No available bazaars (you may have applied to all)</option>
                    ) : (
                      bazaars.map((bazaar) => (
                        <option key={bazaar._id} value={bazaar._id}>
                          {bazaar.name} - {new Date(bazaar.start_date).toLocaleDateString()} at {bazaar.location}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="boothSize">Booth Size *</label>
                  <select
                    id="boothSize"
                    required
                    value={boothSize}
                    onChange={(e) => setBoothSize(e.target.value)}
                  >
                    <option value="2x2">2x2 meters (Small)</option>
                    <option value="4x4">4x4 meters (Large)</option>
                  </select>
                  <small style={{color: '#999', marginTop: '0.5rem', display: 'block'}}>
                    Select the booth size for your space at the bazaar
                  </small>
                </div>

                <div className="form-group">
                  <label>Staff Members * (1-5 members)</label>
                  {staffMembers.map((staff, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          placeholder="Staff member name"
                          required
                          value={staff.name}
                          onChange={(e) => updateStaffMember(index, 'name', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="email"
                          placeholder="Staff member email"
                          required
                          value={staff.email}
                          onChange={(e) => updateStaffMember(index, 'email', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      {staffMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStaffMember(index)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {staffMembers.length < 5 && (
                    <button
                      type="button"
                      onClick={addStaffMember}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                      }}
                    >
                      + Add Staff Member
                    </button>
                  )}
                  <small style={{color: '#999', marginTop: '0.5rem', display: 'block'}}>
                    Add the names and emails of staff members who will be working at your booth (minimum 1, maximum 5)
                  </small>
                </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || !selectedBazaar}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedBazaar('');
                    setBoothSize('2x2');
                    setStaffMembers([{ name: '', email: '' }]);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Reset Form
                </button>
              </div>
            </form>
          </section>
          )}
        </main>
      </div>
    </div>
  );
}
