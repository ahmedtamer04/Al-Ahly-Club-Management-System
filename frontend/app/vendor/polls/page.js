'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pollAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorPollsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [polls, setPolls] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    business_description: '',
    products_offered: '',
    contact_phone: '',
    contact_email: '',
    staff: [{ name: '', email: '' }],
    preferred_booth_size: '2x2',
    preferred_positions: [],
    notes: ''
  });

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchData();
    }
  }, [isClient]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pollsResponse, applicationsResponse] = await Promise.all([
        pollAPI.getOpenPolls(),
        pollAPI.getMyPollApplications()
      ]);
      setPolls(pollsResponse.polls || []);
      setMyApplications(applicationsResponse.applications || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (poll) => {
    setSelectedPoll(poll);
    setFormData({
      business_name: user?.vendor_info?.company_name || '',
      business_type: '',
      business_description: '',
      products_offered: '',
      contact_phone: '',
      contact_email: user?.email || '',
      staff: [{ name: '', email: '' }],
      preferred_booth_size: '2x2',
      preferred_positions: [],
      notes: ''
    });
    setShowApplyModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStaffChange = (index, field, value) => {
    const newStaff = [...formData.staff];
    newStaff[index][field] = value;
    setFormData(prev => ({
      ...prev,
      staff: newStaff
    }));
  };

  const addStaffMember = () => {
    if (formData.staff.length >= 5) {
      alert('Maximum 5 staff members allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      staff: [...prev.staff, { name: '', email: '' }]
    }));
  };

  const removeStaffMember = (index) => {
    if (formData.staff.length === 1) {
      alert('At least one staff member is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== index)
    }));
  };

  const togglePreferredPosition = (position) => {
    const exists = formData.preferred_positions.some(
      pos => pos.wall === position.wall && pos.slot === position.slot
    );
    
    if (exists) {
      setFormData(prev => ({
        ...prev,
        preferred_positions: prev.preferred_positions.filter(
          pos => !(pos.wall === position.wall && pos.slot === position.slot)
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferred_positions: [...prev.preferred_positions, position]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation
    if (!formData.business_name || !formData.business_description || 
        !formData.products_offered || !formData.contact_phone || !formData.contact_email) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    // Validate staff
    for (const staff of formData.staff) {
      if (!staff.name || !staff.email) {
        setError('All staff members must have name and email');
        setSubmitting(false);
        return;
      }
    }

    try {
      await pollAPI.applyToPoll(selectedPoll._id, {
        ...formData,
        staff: formData.staff.filter(s => s.name && s.email)
      });
      alert('Application submitted successfully!');
      setShowApplyModal(false);
      setSelectedPoll(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 {user?.vendor_info?.company_name || 'Vendor Dashboard'}</span>
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
            <li><Link href="/vendor/polls" className="active">📊 Polls</Link></li>
            <li><Link href="/vendor/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Booth Setup Polls 📊</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            View and apply to polls for booth setup opportunities during specific durations.
          </p>

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

          {/* My Applications Section */}
          {myApplications.length > 0 && (
            <section className="section" style={{ marginBottom: '2rem' }}>
              <h2>My Applications ({myApplications.length})</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {myApplications.map((app) => (
                  <div key={app._id} style={{
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{app.poll.title}</h4>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      Status: <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: app.status === 'selected' ? '#28a745' :
                                   app.status === 'rejected' ? '#dc3545' : '#ffc107',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}>{app.status}</span>
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      Applied: {formatDate(app.applied_at)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Available Polls Section */}
          <section className="section">
            <h2>Available Polls</h2>
            {loading ? (
              <div className="loading">Loading polls...</div>
            ) : polls.length === 0 ? (
              <div className="empty-state">
                <p>📊 No open polls available at the moment</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '1.5rem'
              }}>
                {polls.map((poll) => {
                  const deadlinePassed = isDeadlinePassed(poll.application_deadline);
                  return (
                    <div
                      key={poll._id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #e0e0e0'
                      }}
                    >
                      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>{poll.title}</h3>
                      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {poll.description.length > 150 ? `${poll.description.substring(0, 150)}...` : poll.description}
                      </p>

                      <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        <p><strong>Duration:</strong> {formatDate(poll.start_date)} - {formatDate(poll.end_date)}</p>
                        <p><strong>Application Deadline:</strong> 
                          <span style={{ color: deadlinePassed ? '#dc3545' : '#333', fontWeight: deadlinePassed ? 'bold' : 'normal' }}>
                            {' '}{formatDate(poll.application_deadline)}
                            {deadlinePassed && ' (Passed)'}
                          </span>
                        </p>
                        <p><strong>Max Vendors:</strong> {poll.max_vendors}</p>
                        <p><strong>Available Positions:</strong> {poll.available_positions.length}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {poll.has_applied ? (
                          <span style={{
                            padding: '0.5rem 1rem',
                            background: '#6c757d',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}>
                            ✓ Already Applied
                          </span>
                        ) : deadlinePassed ? (
                          <span style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}>
                            Deadline Passed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(poll)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Apply Modal */}
          {showApplyModal && selectedPoll && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                width: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Apply to: {selectedPoll.title}</h2>
                  <button
                    onClick={() => {
                      setShowApplyModal(false);
                      setSelectedPoll(null);
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </div>

                {error && (
                  <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: '#fee',
                    color: '#dc3545',
                    borderRadius: '8px'
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Business Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Business Type</label>
                    <input
                      type="text"
                      value={formData.business_type}
                      onChange={(e) => handleInputChange('business_type', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Business Description *</label>
                    <textarea
                      required
                      rows="4"
                      maxLength={1000}
                      value={formData.business_description}
                      onChange={(e) => handleInputChange('business_description', e.target.value)}
                    />
                    <small>{formData.business_description.length}/1000 characters</small>
                  </div>

                  <div className="form-group">
                    <label>Products Offered *</label>
                    <textarea
                      required
                      rows="3"
                      maxLength={500}
                      value={formData.products_offered}
                      onChange={(e) => handleInputChange('products_offered', e.target.value)}
                    />
                    <small>{formData.products_offered.length}/500 characters</small>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Staff Members (Max 5) *</label>
                    {formData.staff.map((staff, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Name"
                          required
                          value={staff.name}
                          onChange={(e) => handleStaffChange(idx, 'name', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          value={staff.email}
                          onChange={(e) => handleStaffChange(idx, 'email', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        {formData.staff.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStaffMember(idx)}
                            style={{
                              padding: '0.5rem',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.staff.length < 5 && (
                      <button
                        type="button"
                        onClick={addStaffMember}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        + Add Staff Member
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Preferred Booth Size *</label>
                    <select
                      required
                      value={formData.preferred_booth_size}
                      onChange={(e) => handleInputChange('preferred_booth_size', e.target.value)}
                    >
                      <option value="2x2">2x2</option>
                      <option value="4x4">4x4</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Preferred Positions (Optional)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedPoll.available_positions.map((pos, idx) => {
                        const isSelected = formData.preferred_positions.some(
                          p => p.wall === pos.wall && p.slot === pos.slot
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => togglePreferredPosition(pos)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: isSelected ? '#007bff' : '#f8f9fa',
                              color: isSelected ? 'white' : '#333',
                              border: `2px solid ${isSelected ? '#007bff' : '#ddd'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: isSelected ? '600' : 'normal'
                            }}
                          >
                            {pos.wall.charAt(0).toUpperCase() + pos.wall.slice(1)}-{pos.slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      rows="3"
                      maxLength={500}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                    <small>{formData.notes.length}/500 characters</small>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplyModal(false);
                        setSelectedPoll(null);
                        setError('');
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: submitting ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

