'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workshopAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function CreateWorkshopPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    short_description: '',
    start_date: '',
    end_date: '',
    time: '',
    full_agenda: '',
    faculty_responsible: '',
    professors_participating: '',
    required_budget: '',
    funding_source: '',
    extra_resources: '',
    capacity: '30',
    registration_deadline: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await workshopAPI.create({
        name: formData.name,
        location: formData.location,
        short_description: formData.short_description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        time: formData.time,
        full_agenda: formData.full_agenda,
        faculty_responsible: formData.faculty_responsible,
        professors_participating: formData.professors_participating,
        required_budget: parseFloat(formData.required_budget) || 0,
        funding_source: formData.funding_source,
        extra_resources: formData.extra_resources,
        capacity: parseInt(formData.capacity),
        registration_deadline: formData.registration_deadline
      });

      setMessage({ text: 'Workshop created successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/professor/workshops');
      }, 2000);
    } catch (error) {
      setMessage({ text: error.message || 'Failed to create workshop', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Create Workshop 🎨</h1>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="name">Workshop Name *</label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="e.g., Introduction to Machine Learning"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    required
                    placeholder="e.g., Engineering Building, Room 301"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="capacity">Capacity *</label>
                  <input
                    type="number"
                    id="capacity"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="short_description">Short Description *</label>
                <textarea
                  id="short_description"
                  rows="3"
                  required
                  placeholder="Brief overview of the workshop..."
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="full_agenda">Full Agenda *</label>
                <textarea
                  id="full_agenda"
                  rows="5"
                  required
                  placeholder="Detailed workshop agenda and schedule..."
                  value={formData.full_agenda}
                  onChange={(e) => setFormData({...formData, full_agenda: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Start Date *</label>
                  <input
                    type="date"
                    id="start_date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">End Date *</label>
                  <input
                    type="date"
                    id="end_date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <input
                    type="time"
                    id="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="registration_deadline">Registration Deadline *</label>
                <input
                  type="date"
                  id="registration_deadline"
                  required
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({...formData, registration_deadline: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="faculty_responsible">Faculty Responsible *</label>
                  <input
                    type="text"
                    id="faculty_responsible"
                    required
                    placeholder="e.g., Faculty of Engineering"
                    value={formData.faculty_responsible}
                    onChange={(e) => setFormData({...formData, faculty_responsible: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="professors_participating">Professors Participating *</label>
                  <input
                    type="text"
                    id="professors_participating"
                    required
                    placeholder="e.g., Dr. Ahmed, Dr. Sara"
                    value={formData.professors_participating}
                    onChange={(e) => setFormData({...formData, professors_participating: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="required_budget">Required Budget (EGP) *</label>
                  <input
                    type="number"
                    id="required_budget"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.required_budget}
                    onChange={(e) => setFormData({...formData, required_budget: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="funding_source">Funding Source *</label>
                  <select
                    id="funding_source"
                    required
                    value={formData.funding_source}
                    onChange={(e) => setFormData({...formData, funding_source: e.target.value})}
                  >
                    <option value="">Select Funding Source</option>
                    <option value="GUC">GUC</option>
                    <option value="EXTERNAL">External</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="extra_resources">Extra Resources</label>
                <textarea
                  id="extra_resources"
                  rows="3"
                  placeholder="Any additional materials or equipment needed..."
                  value={formData.extra_resources}
                  onChange={(e) => setFormData({...formData, extra_resources: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <Link href="/professor/workshops" className="btn-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : '✓ Create Workshop'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
