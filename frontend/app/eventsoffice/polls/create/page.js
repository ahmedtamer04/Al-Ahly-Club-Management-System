'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pollAPI } from '@/utils/api';
import EventsOfficeLayout from '@/app/components/EventsOfficeLayout';
import '@/app/dashboard.css';

export default function CreatePollPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    application_deadline: '',
    max_vendors: 1,
    available_positions: []
  });
  const [positionInput, setPositionInput] = useState({ wall: 'north', slot: 1 });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPosition = () => {
    const newPosition = { wall: positionInput.wall, slot: parseInt(positionInput.slot) };
    
    // Check if position already exists
    const exists = formData.available_positions.some(
      pos => pos.wall === newPosition.wall && pos.slot === newPosition.slot
    );
    
    if (exists) {
      setMessage({ text: 'This position is already added', type: 'error' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      available_positions: [...prev.available_positions, newPosition]
    }));
    setPositionInput({ wall: 'north', slot: 1 });
  };

  const removePosition = (index) => {
    setFormData(prev => ({
      ...prev,
      available_positions: prev.available_positions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Validation
    if (!formData.title || !formData.description || !formData.start_date || 
        !formData.end_date || !formData.application_deadline) {
      setMessage({ text: 'Please fill in all required fields', type: 'error' });
      setLoading(false);
      return;
    }

    if (formData.available_positions.length === 0) {
      setMessage({ text: 'Please add at least one available position', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await pollAPI.createPoll(formData);
      setMessage({ text: 'Poll created successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/eventsoffice/polls');
      }, 2000);
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || err.message || 'Failed to create poll', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventsOfficeLayout>
          <div style={{ marginBottom: '2rem' }}>
            <Link href="/eventsoffice/polls" className="back-button">← Back to Polls</Link>
          </div>

          <h1>Create Poll 📊</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Create a poll for vendors to request booth setup during a specific duration.
          </p>

          {message.text && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              background: message.type === 'success' ? '#d4edda' : '#fee',
              color: message.type === 'success' ? '#155724' : '#dc3545',
              borderRadius: '8px',
              border: `1px solid ${message.type === 'success' ? '#28a745' : '#dc3545'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form" style={{ maxWidth: '800px' }}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Spring 2024 Booth Setup Poll"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                required
                rows="5"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the poll and booth setup requirements..."
                maxLength={2000}
              />
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                {formData.description.length}/2000 characters
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="start_date">Start Date *</label>
                <input
                  type="date"
                  id="start_date"
                  required
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date *</label>
                <input
                  type="date"
                  id="end_date"
                  required
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="application_deadline">Application Deadline *</label>
              <input
                type="datetime-local"
                id="application_deadline"
                required
                value={formData.application_deadline}
                onChange={(e) => handleInputChange('application_deadline', e.target.value)}
              />
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                Deadline must be before or on the start date
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="max_vendors">Maximum Vendors *</label>
              <input
                type="number"
                id="max_vendors"
                required
                min="1"
                value={formData.max_vendors}
                onChange={(e) => handleInputChange('max_vendors', parseInt(e.target.value))}
              />
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                Maximum number of vendors that can be selected
              </small>
            </div>

            <div className="form-group">
              <label>Available Positions *</label>
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                <select
                  value={positionInput.wall}
                  onChange={(e) => setPositionInput(prev => ({ ...prev, wall: e.target.value }))}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '2px solid #ddd' }}
                >
                  <option value="north">North</option>
                  <option value="south">South</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={positionInput.slot}
                  onChange={(e) => setPositionInput(prev => ({ ...prev, slot: parseInt(e.target.value) }))}
                  style={{ padding: '0.5rem', width: '80px', borderRadius: '6px', border: '2px solid #ddd' }}
                />
                <button
                  type="button"
                  onClick={addPosition}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  + Add Position
                </button>
              </div>

              {formData.available_positions.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {formData.available_positions.map((pos, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#e3f2fd',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {pos.wall.charAt(0).toUpperCase() + pos.wall.slice(1)}-{pos.slot}
                      <button
                        type="button"
                        onClick={() => removePosition(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No positions added yet</p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Poll'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push('/eventsoffice/polls')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
    </EventsOfficeLayout>
  );
}

