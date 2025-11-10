'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, workshopAPI } from '@/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import '@/app/dashboard.css';

export default function ReviewWorkshopPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id;

  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Review modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestEditsModal, setShowRequestEditsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestedEdits, setRequestedEdits] = useState('');

  useEffect(() => {
    if (workshopId) {
      fetchWorkshopDetails();
    }
  }, [workshopId]);

  const fetchWorkshopDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/events/${workshopId}`);
      setWorkshop(response);
    } catch (err) {
      setError(err.message || 'Failed to load workshop details');
      console.error('Error fetching workshop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept and publish this workshop?')) {
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await workshopAPI.review(workshopId, 'accept');
      setMessage({ text: '✅ Workshop accepted and published successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/eventsoffice/workshops/pending');
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to accept workshop', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await workshopAPI.review(workshopId, 'reject', rejectionReason.trim());
      setMessage({ text: '❌ Workshop rejected successfully', type: 'success' });
      setShowRejectModal(false);
      setTimeout(() => {
        router.push('/eventsoffice/workshops/pending');
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to reject workshop', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestEdits = async () => {
    if (!requestedEdits.trim()) {
      alert('Please specify what edits are needed');
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await workshopAPI.review(workshopId, 'request_edits', requestedEdits.trim());
      setMessage({ text: '✏️ Edit request sent to professor successfully', type: 'success' });
      setShowRequestEditsModal(false);
      setTimeout(() => {
        router.push('/eventsoffice/workshops/pending');
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to request edits', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/events">📅 View All Events</Link></li>
            <li><Link href="/eventsoffice/workshops/pending" className="active">🎨 Pending Workshops</Link></li>
            <li><Link href="/eventsoffice/conferences">🎓 Conferences</Link></li>
            <li><Link href="/eventsoffice/conferences/create">➕ Create Conference</Link></li>
            <li><Link href="/eventsoffice/trips">✈️ Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🛍️ Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">💪 Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/facilities">🏢 Facilities</Link></li>
            <li><Link href="/eventsoffice/vendors">👥 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/registrations">📋 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <div>
              <button
                onClick={() => router.back()}
                className="btn-secondary"
                style={{ marginBottom: '10px' }}
              >
                ← Back to Pending Workshops
              </button>
              <h1>Review Workshop Submission 🎨</h1>
            </div>
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

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading workshop details...</p>
            </div>
          ) : workshop ? (
            <>
              {/* Workshop Details */}
              <section className="section">
                <h2>📚 Workshop Information</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Workshop Name</label>
                    <p><strong>{workshop.name}</strong></p>
                  </div>
                  <div className="detail-item">
                    <label>Description</label>
                    <p>{workshop.short_description}</p>
                  </div>
                  <div className="detail-item">
                    <label>Full Agenda</label>
                    <p>{workshop.workshop?.full_agenda}</p>
                  </div>
                  <div className="detail-item">
                    <label>Location</label>
                    <p>{workshop.location}</p>
                  </div>
                  <div className="detail-item">
                    <label>Start Date</label>
                    <p>{formatDate(workshop.start_date)}</p>
                  </div>
                  <div className="detail-item">
                    <label>End Date</label>
                    <p>{formatDate(workshop.end_date)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Time</label>
                    <p>{workshop.time}</p>
                  </div>
                  <div className="detail-item">
                    <label>Capacity</label>
                    <p>{workshop.workshop?.capacity} participants</p>
                  </div>
                  <div className="detail-item">
                    <label>Registration Deadline</label>
                    <p>{formatDate(workshop.workshop?.registration_deadline)}</p>
                  </div>
                </div>
              </section>

              {/* Professor & Budget Info */}
              <section className="section">
                <h2>👨‍🏫 Professor & Budget Information</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Faculty Responsible</label>
                    <p>{workshop.workshop?.faculty_responsible}</p>
                  </div>
                  <div className="detail-item">
                    <label>Professors Participating</label>
                    <p>{Array.isArray(workshop.workshop?.professors_participating)
                      ? workshop.workshop.professors_participating.join(', ')
                      : workshop.workshop?.professors_participating}</p>
                  </div>
                  <div className="detail-item">
                    <label>Required Budget</label>
                    <p><strong>${workshop.workshop?.required_budget}</strong></p>
                  </div>
                  <div className="detail-item">
                    <label>Funding Source</label>
                    <p><span className="badge">{workshop.workshop?.funding_source}</span></p>
                  </div>
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <label>Extra Resources</label>
                    <p>{workshop.workshop?.extra_resources || 'None specified'}</p>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <section className="section">
                <h2>Review Actions</h2>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="btn-success"
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ✅ Accept & Publish
                  </button>
                  <button
                    onClick={() => setShowRequestEditsModal(true)}
                    disabled={actionLoading}
                    className="btn-warning"
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ✏️ Request Edits
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="btn-danger"
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Workshop</h2>
              <button onClick={() => setShowRejectModal(false)} className="btn-close" disabled={actionLoading}>
                ✕
              </button>
            </div>
            <div className="form">
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  required
                  rows="4"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this workshop is being rejected..."
                  disabled={actionLoading}
                />
              </div>
              <div className="form-actions">
                <button onClick={() => setShowRejectModal(false)} className="btn-secondary" disabled={actionLoading}>
                  Cancel
                </button>
                <button onClick={handleReject} className="btn-danger" disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Edits Modal */}
      {showRequestEditsModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRequestEditsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Edits</h2>
              <button onClick={() => setShowRequestEditsModal(false)} className="btn-close" disabled={actionLoading}>
                ✕
              </button>
            </div>
            <div className="form">
              <div className="form-group">
                <label>Requested Edits *</label>
                <textarea
                  required
                  rows="4"
                  value={requestedEdits}
                  onChange={(e) => setRequestedEdits(e.target.value)}
                  placeholder="Please specify what changes need to be made..."
                  disabled={actionLoading}
                />
              </div>
              <div className="form-actions">
                <button onClick={() => setShowRequestEditsModal(false)} className="btn-secondary" disabled={actionLoading}>
                  Cancel
                </button>
                <button onClick={handleRequestEdits} className="btn-warning" disabled={actionLoading}>
                  {actionLoading ? 'Sending...' : 'Send Edit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .detail-item {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #007bff;
        }

        .detail-item label {
          display: block;
          font-weight: 600;
          color: #495057;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-item p {
          margin: 0;
          color: #212529;
          line-height: 1.6;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          background: #007bff;
          color: white;
        }
      `}</style>
    </div>
  );
}
