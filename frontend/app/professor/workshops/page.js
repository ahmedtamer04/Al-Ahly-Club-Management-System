'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { workshopAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function MyWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const response = await workshopAPI.getMyWorkshops();
      setWorkshops(response.workshops || []);
    } catch (err) {
      setError(err.message || 'Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop._id);
    setEditFormData({
      name: workshop.name,
      location: workshop.location,
      short_description: workshop.short_description,
      start_date: workshop.start_date?.split('T')[0] || '',
      end_date: workshop.end_date?.split('T')[0] || '',
      time: workshop.time,
      full_agenda: workshop.workshop?.full_agenda || '',
      faculty_responsible: workshop.workshop?.faculty_responsible || '',
      professors_participating: workshop.workshop?.professors_participating || '',
      required_budget: workshop.workshop?.required_budget || 0,
      funding_source: workshop.workshop?.funding_source || '',
      extra_resources: workshop.workshop?.extra_resources || '',
      capacity: workshop.workshop?.capacity || 30,
      registration_deadline: workshop.workshop?.registration_deadline?.split('T')[0] || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      await workshopAPI.edit(editingWorkshop, editFormData);
      setMessage({ text: 'Workshop updated successfully!', type: 'success' });
      setEditingWorkshop(null);
      fetchWorkshops();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update workshop', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading workshops...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/workshops" className="active">🎨 My Workshops</Link></li>
            <li><Link href="/professor/workshops/create">➕ Create Workshop</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>My Workshops 🎨</h1>
            <Link href="/professor/workshops/create" className="btn-primary">
              ➕ Create Workshop
            </Link>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="section">
            {workshops.length === 0 ? (
              <div className="empty-state">
                <p>🎨 You haven't created any workshops yet</p>
                <Link href="/professor/workshops/create" className="btn-primary">
                  Create Your First Workshop
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workshop Name</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshops.map((workshop) => (
                      <tr key={workshop._id}>
                        <td>
                          <strong>{workshop.name}</strong>
                          <br />
                          <small style={{ color: '#666' }}>
                            {workshop.short_description?.substring(0, 50)}...
                          </small>
                        </td>
                        <td>{workshop.location}</td>
                        <td>
                          {formatDate(workshop.start_date)}
                          {workshop.start_date !== workshop.end_date && (
                            <> - {formatDate(workshop.end_date)}</>
                          )}
                          <br />
                          <small>{workshop.time}</small>
                        </td>
                        <td>{workshop.workshop?.capacity || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${workshop.status}`}>
                            {workshop.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleEdit(workshop)}
                            className="btn-icon"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Edit Modal */}
          {editingWorkshop && (
            <div className="modal-overlay" onClick={() => setEditingWorkshop(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Workshop</h2>
                  <button onClick={() => setEditingWorkshop(null)} className="btn-close">
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="form">
                  <div className="form-group">
                    <label>Workshop Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Capacity *</label>
                      <input
                        type="number"
                        required
                        value={editFormData.capacity}
                        onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Short Description *</label>
                    <textarea
                      rows="3"
                      required
                      value={editFormData.short_description}
                      onChange={(e) => setEditFormData({...editFormData, short_description: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.start_date}
                        onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.end_date}
                        onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input
                        type="time"
                        required
                        value={editFormData.time}
                        onChange={(e) => setEditFormData({...editFormData, time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setEditingWorkshop(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Update Workshop
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
