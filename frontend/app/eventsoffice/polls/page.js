'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pollAPI } from '@/utils/api';
import EventsOfficeLayout from '@/app/components/EventsOfficeLayout';
import '@/app/dashboard.css';

export default function PollsPage() {
  const router = useRouter();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState([]);

  useEffect(() => {
    fetchPolls();
  }, [filterStatus]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await pollAPI.getAllPolls(params);
      setPolls(response.polls || []);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError(err.response?.data?.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (pollId) => {
    try {
      const response = await pollAPI.getPollById(pollId);
      setSelectedPoll(response);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load poll details');
    }
  };

  const handleOpenPoll = async (pollId) => {
    if (!confirm('Are you sure you want to open this poll? Vendors will be able to apply.')) {
      return;
    }

    try {
      await pollAPI.openPoll(pollId);
      alert('Poll opened successfully!');
      fetchPolls();
      if (showDetailsModal) {
        handleViewDetails(pollId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open poll');
    }
  };

  const handleClosePoll = async () => {
    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor');
      return;
    }

    if (selectedVendors.length > selectedPoll.poll.max_vendors) {
      alert(`Cannot select more than ${selectedPoll.poll.max_vendors} vendor(s)`);
      return;
    }

    if (!confirm(`Are you sure you want to close this poll and select ${selectedVendors.length} vendor(s)?`)) {
      return;
    }

    try {
      const selectedVendorsData = selectedVendors.map(sv => ({
        application_id: sv.application_id,
        assigned_position: sv.assigned_position
      }));

      await pollAPI.closePoll(selectedPoll.poll._id, { selected_vendors: selectedVendorsData });
      alert('Poll closed successfully!');
      setShowCloseModal(false);
      setShowDetailsModal(false);
      setSelectedPoll(null);
      setSelectedVendors([]);
      fetchPolls();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close poll');
    }
  };

  const handleCancelPoll = async (pollId) => {
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User cancelled

    if (!confirm('Are you sure you want to cancel this poll?')) {
      return;
    }

    try {
      await pollAPI.cancelPoll(pollId, reason);
      alert('Poll cancelled successfully!');
      fetchPolls();
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedPoll(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel poll');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6c757d';
      case 'open': return '#28a745';
      case 'closed': return '#007bff';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <EventsOfficeLayout>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Polls 📊</h1>
            <Link href="/eventsoffice/polls/create" className="btn-primary">
              + Create Poll
            </Link>
          </div>

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

          {/* Filter */}
          <div style={{ marginBottom: '2rem' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading polls...</div>
          ) : polls.length === 0 ? (
            <div className="empty-state">
              <p>📊 No polls found</p>
              <Link href="/eventsoffice/polls/create" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Create Your First Poll
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {polls.map((poll) => (
                <div
                  key={poll._id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${getStatusColor(poll.status)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>{poll.title}</h3>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      background: getStatusColor(poll.status),
                      color: 'white',
                      fontWeight: '500',
                      fontSize: '0.85rem',
                      textTransform: 'capitalize'
                    }}>
                      {poll.status}
                    </span>
                  </div>

                  <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {poll.description.length > 100 ? `${poll.description.substring(0, 100)}...` : poll.description}
                  </p>

                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    <p><strong>Duration:</strong> {formatDate(poll.start_date)} - {formatDate(poll.end_date)}</p>
                    <p><strong>Application Deadline:</strong> {formatDate(poll.application_deadline)}</p>
                    <p><strong>Max Vendors:</strong> {poll.max_vendors}</p>
                    <p><strong>Applications:</strong> {poll.application_count}</p>
                    {poll.status === 'closed' && <p><strong>Selected:</strong> {poll.selected_count}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleViewDetails(poll._id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      View Details
                    </button>
                    {poll.status === 'draft' && (
                      <button
                        onClick={() => handleOpenPoll(poll._id)}
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
                        Open Poll
                      </button>
                    )}
                    {(poll.status === 'draft' || poll.status === 'open') && (
                      <button
                        onClick={() => handleCancelPoll(poll._id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Details Modal */}
          {showDetailsModal && selectedPoll && (
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
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                width: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>{selectedPoll.poll.title}</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedPoll(null);
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <p><strong>Description:</strong></p>
                  <p style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{selectedPoll.poll.description}</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p><strong>Duration:</strong> {formatDate(selectedPoll.poll.start_date)} - {formatDate(selectedPoll.poll.end_date)}</p>
                  <p><strong>Application Deadline:</strong> {formatDate(selectedPoll.poll.application_deadline)}</p>
                  <p><strong>Max Vendors:</strong> {selectedPoll.poll.max_vendors}</p>
                  <p><strong>Status:</strong> <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: getStatusColor(selectedPoll.poll.status),
                    color: 'white',
                    fontSize: '0.85rem'
                  }}>{selectedPoll.poll.status}</span></p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p><strong>Available Positions:</strong></p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedPoll.poll.available_positions.map((pos, idx) => (
                      <span key={idx} style={{
                        padding: '0.5rem 1rem',
                        background: '#e3f2fd',
                        borderRadius: '6px'
                      }}>
                        {pos.wall.charAt(0).toUpperCase() + pos.wall.slice(1)}-{pos.slot}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3>Applications ({selectedPoll.applications.length})</h3>
                  {selectedPoll.applications.length === 0 ? (
                    <p style={{ color: '#999' }}>No applications yet</p>
                  ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {selectedPoll.applications.map((app) => (
                        <div key={app._id} style={{
                          padding: '1rem',
                          marginBottom: '1rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: app.status === 'selected' ? '2px solid #28a745' : '1px solid #ddd'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <div>
                              <h4 style={{ margin: 0 }}>{app.business_name}</h4>
                              <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                                {app.vendor.name} • {app.preferred_booth_size}
                              </p>
                            </div>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: app.status === 'selected' ? '#28a745' : 
                                         app.status === 'rejected' ? '#dc3545' : '#ffc107',
                              color: 'white',
                              fontSize: '0.85rem'
                            }}>
                              {app.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.9rem', color: '#666' }}>{app.business_description}</p>
                          <p style={{ fontSize: '0.9rem', color: '#666' }}><strong>Products:</strong> {app.products_offered}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  {selectedPoll.poll.status === 'draft' && (
                    <button
                      onClick={() => handleOpenPoll(selectedPoll.poll._id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Open Poll
                    </button>
                  )}
                  {selectedPoll.poll.status === 'open' && selectedPoll.applications.length > 0 && (
                    <button
                      onClick={() => {
                        setShowCloseModal(true);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Close Poll & Select Vendors
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedPoll(null);
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
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close Poll Modal */}
          {showCloseModal && selectedPoll && (
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
              zIndex: 1001,
              padding: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '700px',
                width: '100%'
              }}>
                <h3 style={{ marginTop: 0 }}>Select Vendors</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                  Select up to {selectedPoll.poll.max_vendors} vendor(s) and assign positions
                </p>

                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                  {selectedPoll.applications.filter(app => app.status === 'pending').map((app) => {
                    const isSelected = selectedVendors.some(sv => sv.application_id === app._id);
                    return (
                      <div key={app._id} style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: isSelected ? '#e3f2fd' : '#f8f9fa',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #007bff' : '1px solid #ddd'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedVendors.length >= selectedPoll.poll.max_vendors) {
                                  alert(`Maximum ${selectedPoll.poll.max_vendors} vendor(s) allowed`);
                                  return;
                                }
                                setSelectedVendors([...selectedVendors, {
                                  application_id: app._id,
                                  assigned_position: selectedPoll.poll.available_positions[0] || { wall: 'north', slot: 1 }
                                }]);
                              } else {
                                setSelectedVendors(selectedVendors.filter(sv => sv.application_id !== app._id));
                              }
                            }}
                            style={{ marginRight: '1rem', marginTop: '0.25rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0 }}>{app.business_name}</h4>
                            <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                              {app.vendor.name} • Preferred: {app.preferred_booth_size}
                            </p>
                            {isSelected && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem' }}>Assign Position:</label>
                                <select
                                  value={`${selectedVendors.find(sv => sv.application_id === app._id)?.assigned_position.wall}-${selectedVendors.find(sv => sv.application_id === app._id)?.assigned_position.slot}`}
                                  onChange={(e) => {
                                    const [wall, slot] = e.target.value.split('-');
                                    setSelectedVendors(selectedVendors.map(sv =>
                                      sv.application_id === app._id
                                        ? { ...sv, assigned_position: { wall, slot: parseInt(slot) } }
                                        : sv
                                    ));
                                  }}
                                  style={{ marginLeft: '0.5rem', padding: '0.25rem', borderRadius: '4px' }}
                                >
                                  {selectedPoll.poll.available_positions.map((pos, idx) => (
                                    <option key={idx} value={`${pos.wall}-${pos.slot}`}>
                                      {pos.wall.charAt(0).toUpperCase() + pos.wall.slice(1)}-{pos.slot}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCloseModal(false);
                      setSelectedVendors([]);
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
                    onClick={handleClosePoll}
                    disabled={selectedVendors.length === 0}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: selectedVendors.length === 0 ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: selectedVendors.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Close Poll & Select ({selectedVendors.length})
                  </button>
                </div>
              </div>
            </div>
          )}
    </EventsOfficeLayout>
  );
}

