'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function MyBoothsPage() {
  // Initialize as null to match server-side rendering
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [myBooths, setMyBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    business_description: '',
    products_offered: '',
    booth_size: '2x2',
    duration_weeks: 1,
    start_date: '',
    platform_position: { wall: '', slot: null },
    contact_phone: '',
    contact_email: '',
    attendees: [{ name: '', email: '' }],
    notes: ''
  });

  // Platform map state
  const [occupiedPositions, setOccupiedPositions] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

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

  useEffect(() => {
    // Pre-fill with user data
    if (user) {
      setFormData(prev => ({
        ...prev,
        business_name: user.vendor_info?.company_name || '',
        business_type: user.vendor_info?.business_type || '',
        business_description: user.vendor_info?.business_description || '',
        contact_phone: user.vendor_info?.phone || user.phone || '',
        contact_email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isClient) {
      fetchMyBooths();
    }
  }, [isClient]);

  // Fetch booth availability when start_date or duration changes
  useEffect(() => {
    if (formData.start_date && formData.duration_weeks) {
      fetchBoothAvailability();
    }
  }, [formData.start_date, formData.duration_weeks]);

  const fetchBoothAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const response = await vendorAPI.getBoothAvailability(
        formData.start_date,
        formData.duration_weeks
      );
      setOccupiedPositions(response.occupied_positions || []);
    } catch (err) {
      console.error('Error fetching booth availability:', err);
      setOccupiedPositions([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchMyBooths = async () => {
    try {
      const response = await vendorAPI.getMyApplications();
      // Filter for booth event applications only
      const boothApps = (response.applications || []).filter(app => app.kind === 'booth_event');
      setMyBooths(boothApps);
    } catch (err) {
      console.error('Error fetching booths:', err);
    }
  };

  const isPositionOccupied = (wall, slot) => {
    return occupiedPositions.some(pos => pos.wall === wall && pos.slot === slot);
  };

  const selectPosition = (wall, slot) => {
    if (!isPositionOccupied(wall, slot)) {
      setFormData({
        ...formData,
        platform_position: { wall, slot }
      });
    }
  };

  const addAttendee = () => {
    if (formData.attendees.length < 5) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, { name: '', email: '' }]
      });
    }
  };

  const removeAttendee = (index) => {
    const newAttendees = formData.attendees.filter((_, i) => i !== index);
    setFormData({ ...formData, attendees: newAttendees });
  };

  const updateAttendee = (index, field, value) => {
    const newAttendees = [...formData.attendees];
    newAttendees[index][field] = value;
    setFormData({ ...formData, attendees: newAttendees });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate platform position is selected
    if (!formData.platform_position.wall || !formData.platform_position.slot) {
      setError('Please select a booth position on the platform map');
      setLoading(false);
      return;
    }

    try {
      // Filter out empty attendees
      const validAttendees = formData.attendees.filter(att => att.name && att.email);
      
      const submitData = {
        business_name: formData.business_name,
        business_type: formData.business_type,
        business_description: formData.business_description,
        products_offered: formData.products_offered,
        booth_size: formData.booth_size,
        duration_weeks: formData.duration_weeks,
        preferred_start_date: formData.start_date,
        platform_position: formData.platform_position,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        attendees: validAttendees,
        notes: formData.notes
      };

      await vendorAPI.applyToBoothEvent(submitData);
      alert('Booth application submitted successfully!');
      setShowForm(false);
      fetchMyBooths();
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error submitting booth application:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: user?.vendor_info?.company_name || '',
      business_type: user?.vendor_info?.business_type || '',
      business_description: user?.vendor_info?.business_description || '',
      products_offered: '',
      booth_size: '2x2',
      duration_weeks: 1,
      start_date: '',
      platform_position: { wall: '', slot: null },
      contact_phone: user?.vendor_info?.phone || user?.phone || '',
      contact_email: user?.email || '',
      attendees: [{ name: '', email: '' }],
      notes: ''
    });
    setError('');
    setOccupiedPositions([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const activeBooths = myBooths.filter(b => b.status === 'accepted').length;
  const pendingBooths = myBooths.filter(b => b.status === 'pending').length;

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
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>My Booths 🏪</h1>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '📋 View My Booths' : '➕ Apply for New Booth'}
            </button>
          </div>

          {!showForm ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🏪</div>
                  <div className="stat-info">
                    <h3>{activeBooths}</h3>
                    <p>Active Booths</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>{pendingBooths}</h3>
                    <p>Pending Requests</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{myBooths.length}</h3>
                    <p>Total Applications</p>
                  </div>
                </div>
              </div>

              <section className="section">
                <h2>My Booth Applications</h2>
                {myBooths.length === 0 ? (
                  <div className="empty-state">
                    <p>🏪 No booth applications yet</p>
                    <button 
                      className="btn-primary" 
                      style={{marginTop: '1rem'}}
                      onClick={() => setShowForm(true)}
                    >
                      Apply for Your First Booth
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Business Name</th>
                            <th>Platform Position</th>
                            <th>Start Date</th>
                            <th>Duration</th>
                            <th>Booth Size</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myBooths.map((booth) => (
                            <tr 
                              key={booth._id}
                              style={{
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <td>{booth.business_name || 'N/A'}</td>
                              <td>
                                {booth.platform_position?.wall && booth.platform_position?.slot
                                  ? `${booth.platform_position.wall.toUpperCase()} - Slot ${booth.platform_position.slot}`
                                  : 'TBD'}
                              </td>
                              <td>{booth.preferred_start_date ? formatDate(booth.preferred_start_date) : 'N/A'}</td>
                              <td>{booth.duration_weeks || 'N/A'} week(s)</td>
                              <td>{booth.booth_size || 'N/A'}</td>
                              <td>
                                <span style={{
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  background: getStatusColor(booth.status),
                                  color: 'white',
                                  fontWeight: '500',
                                  fontSize: '0.9em',
                                  textTransform: 'capitalize'
                                }}>
                                  {booth.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn-secondary"
                                  style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9em'
                                  }}
                                  onClick={() => setSelectedApplication(booth)}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Application Detail Modal */}
                    {selectedApplication && (
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
                      }}
                      onClick={() => setSelectedApplication(null)}
                      >
                        <div style={{
                          background: 'white',
                          borderRadius: '12px',
                          maxWidth: '800px',
                          width: '100%',
                          maxHeight: '90vh',
                          overflow: 'auto',
                          padding: '2rem',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '2px solid #eee'
                          }}>
                            <h2 style={{margin: 0}}>📋 Application Details</h2>
                            <button
                              onClick={() => setSelectedApplication(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5em',
                                cursor: 'pointer',
                                color: '#666'
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          <div style={{display: 'grid', gap: '1.5rem'}}>
                            {/* Status Badge */}
                            <div style={{textAlign: 'center'}}>
                              <span style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                background: getStatusColor(selectedApplication.status),
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.1em',
                                textTransform: 'capitalize'
                              }}>
                                {selectedApplication.status}
                              </span>
                            </div>

                            {/* Business Information */}
                            <div style={{
                              background: '#f8f9fa',
                              padding: '1.5rem',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{marginTop: 0, color: '#1976d2'}}>🏢 Business Information</h3>
                              <div style={{display: 'grid', gap: '0.75rem'}}>
                                <div><strong>Business Name:</strong> {selectedApplication.business_name || 'N/A'}</div>
                                <div><strong>Business Type:</strong> {selectedApplication.business_type || 'N/A'}</div>
                                <div><strong>Description:</strong> {selectedApplication.business_description || 'N/A'}</div>
                                <div><strong>Products/Services:</strong> {selectedApplication.products_offered || 'N/A'}</div>
                              </div>
                            </div>

                            {/* Booth Details */}
                            <div style={{
                              background: '#e3f2fd',
                              padding: '1.5rem',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{marginTop: 0, color: '#1976d2'}}>🏪 Booth Details</h3>
                              <div style={{display: 'grid', gap: '0.75rem'}}>
                                <div><strong>Booth Size:</strong> {selectedApplication.booth_size || 'N/A'}</div>
                                <div><strong>Platform Position:</strong> {
                                  selectedApplication.platform_position?.wall && selectedApplication.platform_position?.slot
                                    ? `${selectedApplication.platform_position.wall.toUpperCase()} Wall - Slot ${selectedApplication.platform_position.slot}`
                                    : 'TBD'
                                }</div>
                                <div><strong>Start Date:</strong> {selectedApplication.preferred_start_date ? formatDate(selectedApplication.preferred_start_date) : 'N/A'}</div>
                                <div><strong>Duration:</strong> {selectedApplication.duration_weeks || 'N/A'} week(s)</div>
                                {selectedApplication.notes && (
                                  <div><strong>Notes:</strong> {selectedApplication.notes}</div>
                                )}
                              </div>
                            </div>

                            {/* Contact Information */}
                            <div style={{
                              background: '#f8f9fa',
                              padding: '1.5rem',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{marginTop: 0, color: '#1976d2'}}>📞 Contact Information</h3>
                              <div style={{display: 'grid', gap: '0.75rem'}}>
                                <div><strong>Phone:</strong> {selectedApplication.contact_phone || 'N/A'}</div>
                                <div><strong>Email:</strong> {selectedApplication.contact_email || 'N/A'}</div>
                              </div>
                            </div>

                            {/* Attendees/Staff */}
                            {selectedApplication.booth_staff && selectedApplication.booth_staff.length > 0 && (
                              <div style={{
                                background: '#fff3e0',
                                padding: '1.5rem',
                                borderRadius: '8px'
                              }}>
                                <h3 style={{marginTop: 0, color: '#1976d2'}}>👥 Booth Attendees ({selectedApplication.booth_staff.length})</h3>
                                <div style={{display: 'grid', gap: '0.5rem'}}>
                                  {selectedApplication.booth_staff.map((staff, idx) => (
                                    <div key={idx} style={{
                                      padding: '0.5rem',
                                      background: 'white',
                                      borderRadius: '4px'
                                    }}>
                                      <strong>{idx + 1}.</strong> {staff.name} - {staff.email}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Application Timeline */}
                            <div style={{
                              background: '#f8f9fa',
                              padding: '1.5rem',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{marginTop: 0, color: '#1976d2'}}>📅 Timeline</h3>
                              <div style={{display: 'grid', gap: '0.75rem'}}>
                                <div><strong>Applied On:</strong> {formatDate(selectedApplication.applied_at)}</div>
                                {selectedApplication.approved_at && (
                                  <div><strong>Processed On:</strong> {formatDate(selectedApplication.approved_at)}</div>
                                )}
                                {selectedApplication.rejection_reason && (
                                  <div style={{
                                    padding: '1rem',
                                    background: '#ffebee',
                                    borderRadius: '4px',
                                    marginTop: '0.5rem'
                                  }}>
                                    <strong style={{color: '#c62828'}}>Rejection Reason:</strong><br/>
                                    {selectedApplication.rejection_reason}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Payment Status */}
                            <div style={{
                              background: selectedApplication.payment_status === 'paid' ? '#e8f5e9' : '#fff3e0',
                              padding: '1.5rem',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{marginTop: 0, color: '#1976d2'}}>💳 Payment Status</h3>
                              <div>
                                <span style={{
                                  padding: '0.5rem 1rem',
                                  borderRadius: '4px',
                                  background: selectedApplication.payment_status === 'paid' ? '#4caf50' : '#ff9800',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  textTransform: 'capitalize'
                                }}>
                                  {selectedApplication.payment_status?.replace('_', ' ') || 'Not Paid'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Close Button */}
                          <div style={{
                            marginTop: '2rem',
                            textAlign: 'center'
                          }}>
                            <button
                              className="btn-primary"
                              onClick={() => setSelectedApplication(null)}
                              style={{
                                padding: '0.75rem 2rem'
                              }}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          ) : (
            <section className="section">
              <h2>Apply for Independent Booth Setup</h2>
              
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

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>ℹ️ Independent Booth Setup</h3>
                <p style={{ margin: 0, color: '#555' }}>
                  Apply for a booth setup on the GUC Platform. Select your booth size (2x2 or 4x4), 
                  choose a duration (1-4 weeks), pick your start date, and select an available position from 24 total spots 
                  (6 positions on each of the 4 walls: North, South, East, West). 
                  You can add up to 5 attendees who will manage the booth.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="businessName">Business Name *</label>
                    <input
                      type="text"
                      id="businessName"
                      required
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="businessType">Business Type *</label>
                    <select
                      id="businessType"
                      required
                      value={formData.business_type}
                      onChange={(e) => setFormData({...formData, business_type: e.target.value})}
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
                    rows="3"
                    required
                    placeholder="Describe your business..."
                    value={formData.business_description}
                    onChange={(e) => setFormData({...formData, business_description: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="products">Products/Services Offered *</label>
                  <textarea
                    id="products"
                    rows="3"
                    required
                    placeholder="What will you offer at your booth?"
                    value={formData.products_offered}
                    onChange={(e) => setFormData({...formData, products_offered: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="boothSize">Booth Size *</label>
                    <select
                      id="boothSize"
                      required
                      value={formData.booth_size}
                      onChange={(e) => setFormData({...formData, booth_size: e.target.value})}
                    >
                      <option value="2x2">2m x 2m - $150</option>
                      <option value="4x4">4m x 4m - $400</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration">Duration (Weeks) *</label>
                    <select
                      id="duration"
                      required
                      value={formData.duration_weeks}
                      onChange={(e) => setFormData({...formData, duration_weeks: parseInt(e.target.value)})}
                    >
                      <option value="1">1 Week</option>
                      <option value="2">2 Weeks</option>
                      <option value="3">3 Weeks</option>
                      <option value="4">4 Weeks</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">Preferred Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                  <small style={{color: '#666', marginTop: '0.3rem', display: 'block'}}>
                    📅 Select when you want to start your booth setup
                  </small>
                </div>

                <div className="form-group">
                  <label>Platform Location *</label>
                  <small style={{color: '#666', marginBottom: '1rem', display: 'block'}}>
                    📍 Select your booth position on the GUC Platform. Green = Available, Grey = Occupied
                  </small>
                  
                  {!formData.start_date || !formData.duration_weeks ? (
                    <div style={{
                      padding: '2rem',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#856404'
                    }}>
                      ⚠️ Please select start date and duration first to view available booth positions
                    </div>
                  ) : loadingAvailability ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      Loading availability...
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '2px solid #ddd'
                    }}>
                      <h4 style={{
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        color: '#333'
                      }}>
                        GUC Platform (24 Booths Total)
                      </h4>
                      
                      <div style={{
                        maxWidth: '900px',
                        margin: '0 auto',
                        position: 'relative'
                      }}>
                        {/* Building C Label */}
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '0.5rem',
                          fontWeight: 'bold',
                          color: '#1976d2',
                          fontSize: '1.1em'
                        }}>
                          🏢 Building C
                        </div>

                        {/* North Positions */}
                        <div style={{marginBottom: '1rem'}}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '0.75rem'
                          }}>
                            {[1, 2, 3, 4, 5, 6].map(slot => {
                              const occupied = isPositionOccupied('north', slot);
                              const selected = formData.platform_position.wall === 'north' && 
                                             formData.platform_position.slot === slot;
                              return (
                                <button
                                  key={`north-${slot}`}
                                  type="button"
                                  onClick={() => selectPosition('north', slot)}
                                  disabled={occupied}
                                  style={{
                                    padding: '1.5rem 0.5rem',
                                    background: selected ? '#007bff' : (occupied ? '#6c757d' : '#28a745'),
                                    color: 'white',
                                    border: selected ? '3px solid #0056b3' : 'none',
                                    borderRadius: '6px',
                                    cursor: occupied ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95em',
                                    fontWeight: 'bold',
                                    opacity: occupied ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: selected ? '0 4px 8px rgba(0,123,255,0.3)' : 'none'
                                  }}
                                >
                                  N{slot}
                                  <div style={{fontSize: '0.65em', marginTop: '0.2rem'}}>
                                    {occupied ? '❌' : (selected ? '✓' : '✓')}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Middle Section with East and West Walls */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 3fr 1fr',
                          gap: '0.75rem',
                          marginBottom: '1rem'
                        }}>
                          {/* West Positions */}
                          <div>
                            <div style={{
                              display: 'grid',
                              gridTemplateRows: 'repeat(6, 1fr)',
                              gap: '0.75rem'
                            }}>
                              {[1, 2, 3, 4, 5, 6].map(slot => {
                                const occupied = isPositionOccupied('west', slot);
                                const selected = formData.platform_position.wall === 'west' && 
                                               formData.platform_position.slot === slot;
                                return (
                                  <button
                                    key={`west-${slot}`}
                                    type="button"
                                    onClick={() => selectPosition('west', slot)}
                                    disabled={occupied}
                                    style={{
                                      padding: '1rem 0.5rem',
                                      background: selected ? '#007bff' : (occupied ? '#6c757d' : '#28a745'),
                                      color: 'white',
                                      border: selected ? '3px solid #0056b3' : 'none',
                                      borderRadius: '6px',
                                      cursor: occupied ? 'not-allowed' : 'pointer',
                                      fontSize: '0.85em',
                                      fontWeight: 'bold',
                                      opacity: occupied ? 0.5 : 1,
                                      transition: 'all 0.2s',
                                      boxShadow: selected ? '0 4px 8px rgba(0,123,255,0.3)' : 'none'
                                    }}
                                  >
                                    W{slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Center Platform Area */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '3rem 1rem',
                            fontSize: '1.3em',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            minHeight: '280px'
                          }}>
                            <div>
                              🏛️<br/>GUC<br/>Platform<br/>🏛️
                            </div>
                          </div>

                          {/* East Positions */}
                          <div>
                            <div style={{
                              display: 'grid',
                              gridTemplateRows: 'repeat(6, 1fr)',
                              gap: '0.75rem'
                            }}>
                              {[1, 2, 3, 4, 5, 6].map(slot => {
                                const occupied = isPositionOccupied('east', slot);
                                const selected = formData.platform_position.wall === 'east' && 
                                               formData.platform_position.slot === slot;
                                return (
                                  <button
                                    key={`east-${slot}`}
                                    type="button"
                                    onClick={() => selectPosition('east', slot)}
                                    disabled={occupied}
                                    style={{
                                      padding: '1rem 0.5rem',
                                      background: selected ? '#007bff' : (occupied ? '#6c757d' : '#28a745'),
                                      color: 'white',
                                      border: selected ? '3px solid #0056b3' : 'none',
                                      borderRadius: '6px',
                                      cursor: occupied ? 'not-allowed' : 'pointer',
                                      fontSize: '0.85em',
                                      fontWeight: 'bold',
                                      opacity: occupied ? 0.5 : 1,
                                      transition: 'all 0.2s',
                                      boxShadow: selected ? '0 4px 8px rgba(0,123,255,0.3)' : 'none'
                                    }}
                                  >
                                    E{slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* South Positions */}
                        <div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '0.75rem'
                          }}>
                            {[1, 2, 3, 4, 5, 6].map(slot => {
                              const occupied = isPositionOccupied('south', slot);
                              const selected = formData.platform_position.wall === 'south' && 
                                             formData.platform_position.slot === slot;
                              return (
                                <button
                                  key={`south-${slot}`}
                                  type="button"
                                  onClick={() => selectPosition('south', slot)}
                                  disabled={occupied}
                                  style={{
                                    padding: '1.5rem 0.5rem',
                                    background: selected ? '#007bff' : (occupied ? '#6c757d' : '#28a745'),
                                    color: 'white',
                                    border: selected ? '3px solid #0056b3' : 'none',
                                    borderRadius: '6px',
                                    cursor: occupied ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95em',
                                    fontWeight: 'bold',
                                    opacity: occupied ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    boxShadow: selected ? '0 4px 8px rgba(0,123,255,0.3)' : 'none'
                                  }}
                                >
                                  S{slot}
                                  <div style={{fontSize: '0.65em', marginTop: '0.2rem'}}>
                                    {occupied ? '❌' : (selected ? '✓' : '✓')}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Building D Label */}
                          <div style={{
                            textAlign: 'center',
                            marginTop: '0.5rem',
                            fontWeight: 'bold',
                            color: '#1976d2',
                            fontSize: '1.1em'
                          }}>
                            🏢 Building D
                          </div>
                        </div>
                      </div>

                      {/* Selected Position Display */}
                      {formData.platform_position.wall && formData.platform_position.slot && (
                        <div style={{
                          marginTop: '1.5rem',
                          padding: '1rem',
                          background: '#d1ecf1',
                          border: '1px solid #bee5eb',
                          borderRadius: '8px',
                          textAlign: 'center',
                          color: '#0c5460'
                        }}>
                          ✓ Selected Position: <strong>{formData.platform_position.wall.toUpperCase()} Wall - Slot {formData.platform_position.slot}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Attendees (Maximum 5) *</label>
                  <small style={{color: '#666', marginBottom: '0.5rem', display: 'block'}}>
                    List people who will be managing the booth
                  </small>
                  {formData.attendees.map((attendee, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '0.75rem',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <input
                        type="text"
                        placeholder="Attendee Name"
                        required
                        value={attendee.name}
                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={attendee.email}
                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {formData.attendees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAttendee(index)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.attendees.length < 5 && (
                    <button
                      type="button"
                      onClick={addAttendee}
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
                      ➕ Add Attendee
                    </button>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Contact Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      placeholder="+20 xxx xxx xxxx"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Contact Email *</label>
                    <input
                      type="email"
                      id="email"
                      required
                      placeholder="vendor@example.com"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    rows="3"
                    placeholder="Any special requirements or additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Reset Form
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
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
