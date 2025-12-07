'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tripAPI } from '@/utils/api';
import EventsOfficeLayout from '@/app/components/EventsOfficeLayout';
import '@/app/dashboard.css';

export default function CreateTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    start_date: '',
    end_date: '',
    time: '',
    short_description: '',
    capacity: '',
    registration_deadline: '',
    allowed_roles: [], // Array of allowed roles
  });
  
  const availableRoles = ['Student', 'Staff', 'TA', 'Professor'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    try {
      await tripAPI.create(formData);
      setMessage({ text: 'Trip created successfully!', type: 'success' });
      // Reset form
      setFormData({
        name: '',
        location: '',
        price: '',
        start_date: '',
        end_date: '',
        time: '',
        short_description: '',
        capacity: '',
        registration_deadline: '',
        allowed_roles: [],
      });
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/eventsoffice/trips');
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to create trip', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventsOfficeLayout>
          <h1>Create New Trip 🚌</h1>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Trip Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Desert Safari Adventure"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Siwa Oasis"
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="text"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  placeholder="e.g., 8:00 AM"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows="4"
                required
                value={formData.short_description}
                onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                placeholder="Describe the trip itinerary, activities, and what's included..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (EGP) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="form-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Registration Deadline *</label>
              <input
                type="date"
                required
                value={formData.registration_deadline}
                onChange={(e) => setFormData({...formData, registration_deadline: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Restrict to Specific Roles (Optional)</label>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                Select which user roles can view and register for this event. Leave empty to allow all roles.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {availableRoles.map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.allowed_roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, allowed_roles: [...formData.allowed_roles, role]});
                        } else {
                          setFormData({...formData, allowed_roles: formData.allowed_roles.filter(r => r !== role)});
                        }
                      }}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
              {formData.allowed_roles.length > 0 && (
                <p style={{ fontSize: '12px', color: '#28a745', marginTop: '8px' }}>
                  ✓ Restricted to: {formData.allowed_roles.join(', ')}
                </p>
              )}
              {formData.allowed_roles.length === 0 && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  All roles can access this event
                </p>
              )}
            </div>

            <div className="form-actions">
              <Link href="/eventsoffice/trips" className="btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Trip'}
              </button>
            </div>
          </form>
    </EventsOfficeLayout>
  );
}
