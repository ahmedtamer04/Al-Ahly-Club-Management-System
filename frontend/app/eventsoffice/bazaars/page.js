'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { bazaarAPI, eventAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function BazaarsPage() {
  const [bazaars, setBazaars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBazaar, setEditingBazaar] = useState(null); // stores bazaar id
  const [editFormData, setEditFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchBazaars();
  }, []);

  const fetchBazaars = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bazaarAPI.getAll();
      // backend returns { message, bazaars, total }
      setBazaars(Array.isArray(res) ? res : (res?.bazaars || []));
    } catch (err) {
      setError(err.message || 'Failed to load bazaars');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canEdit = (bazaar) => new Date(bazaar.start_date) > new Date() && bazaar.status !== 'cancelled';

  const handleEdit = (bazaar) => {
    if (!canEdit(bazaar)) return;
    setEditingBazaar(bazaar._id);
    setEditFormData({
      name: bazaar.name || '',
      location: bazaar.location || '',
      time: bazaar.time || '',
      short_description: bazaar.short_description || '',
      start_date: bazaar.start_date ? bazaar.start_date.split('T')[0] : '',
      end_date: bazaar.end_date ? bazaar.end_date.split('T')[0] : '',
      registration_deadline: bazaar.bazaar?.registration_deadline ? bazaar.bazaar.registration_deadline.split('T')[0] : '',
    });
    setMessage({ text: '', type: '' }); // Clear any previous messages
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingBazaar) return;
    setMessage({ text: '', type: '' });
    try {
      // Send all fields to backend
      await bazaarAPI.edit(editingBazaar, editFormData);
      setMessage({ text: 'Bazaar updated successfully!', type: 'success' });
      setEditingBazaar(null);
      setEditFormData({});
      fetchBazaars();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update bazaar', type: 'error' });
    }
  };

  const handleDelete = async (bazaarId, bazaarName) => {
    if (!confirm(`Are you sure you want to delete "${bazaarName}"? This action cannot be undone.`)) return;
    setMessage({ text: '', type: '' });

    try {
      await eventAPI.delete(bazaarId);
      setMessage({ text: 'Bazaar deleted successfully!', type: 'success' });
      fetchBazaars();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to delete bazaar', type: 'error' });
    }
  };

  const canDelete = (bazaar) => {
    // Can delete only if no vendors have registered
    return (bazaar.bazaar?.vendors_participating?.length || 0) === 0;
  };

  const totalBazaars = bazaars.length;
  const totalBooths = bazaars.reduce((sum, b) => sum + (b.bazaar?.vendors_participating?.length || 0), 0);
  const totalApplications = totalBooths; // placeholder: equals vendors_participating count

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading bazaars...</div>
      </div>
    );
  }

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
            <li><Link href="/eventsoffice/bazaars" className="active">🎪 Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>Bazaars 🎪</h1>
            <Link href="/eventsoffice/bazaars/create" className="btn-primary">➕ Create Bazaar</Link>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎪</div>
              <div className="stat-info">
                <h3>{totalBazaars}</h3>
                <p>Total Bazaars</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>{totalBooths}</h3>
                <p>Total Booths</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{totalApplications}</h3>
                <p>Vendor Applications</p>
              </div>
            </div>
          </div>

          <section className="section">
            {bazaars.length === 0 ? (
              <div className="empty-state">
                <p>🎪 No bazaars created yet</p>
                <Link href="/eventsoffice/bazaars/create" className="btn-primary">Create Your First Bazaar</Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bazaar Name</th>
                      <th>Date</th>
                      <th>Booths</th>
                      <th>Applications</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bazaars.map((b) => (
                      <tr key={b._id}>
                        <td>{b.name}</td>
                        <td>{formatDate(b.start_date)}</td>
                        <td>{b.bazaar?.vendors_participating?.length || 0}</td>
                        <td>{b.bazaar?.vendors_participating?.length || 0}</td>
                        <td>
                          <span className={`badge ${new Date(b.start_date) > new Date() ? 'badge-success' : 'badge-secondary'}`}>
                            {new Date(b.start_date) > new Date() ? 'Upcoming' : 'Past'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleEdit(b)}
                            className="btn-secondary btn-sm"
                            disabled={!canEdit(b)}
                            title={canEdit(b) ? 'Edit bazaar' : 'Cannot edit a bazaar that has started'}
                            style={{ marginRight: '0.5rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b._id, b.name)}
                            className="btn-secondary btn-sm"
                            disabled={!canDelete(b)}
                            title={!canDelete(b) ? 'Cannot delete: vendors have registered' : 'Delete bazaar'}
                            style={{ backgroundColor: canDelete(b) ? '#dc3545' : undefined, borderColor: canDelete(b) ? '#dc3545' : undefined, color: canDelete(b) ? 'white' : undefined }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {editingBazaar && (
            <div className="modal-overlay" onClick={() => setEditingBazaar(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Bazaar</h2>
                  <button onClick={() => setEditingBazaar(null)} className="btn-close">✕</button>
                </div>
                <form onSubmit={handleUpdate} className="form">
                  <div className="form-group">
                    <label>Bazaar Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 10:00 AM - 5:00 PM"
                        value={editFormData.time}
                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Short Description *</label>
                    <textarea
                      rows="3"
                      required
                      value={editFormData.short_description}
                      onChange={(e) => setEditFormData({ ...editFormData, short_description: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.start_date}
                        onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.end_date}
                        onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Registration Deadline *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.registration_deadline}
                      onChange={(e) => setEditFormData({ ...editFormData, registration_deadline: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setEditingBazaar(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
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
