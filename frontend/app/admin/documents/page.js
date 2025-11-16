'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { documentAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await documentAPI.getAll();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadDescription);
      formData.append('category', uploadCategory);

      await documentAPI.upload(formData);
      alert('Document uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadCategory('general');
      fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      alert(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleView = (documentId) => {
    // Open document in new tab for viewing
    const token = localStorage.getItem('token');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Use Authorization header via fetch, then create blob URL
    fetch(`${API_BASE_URL}/documents/${documentId}/view`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load document');
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    })
    .catch(err => {
      console.error('Error viewing document:', err);
      alert(err.message || 'Failed to view document');
    });
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const blob = await documentAPI.download(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert(err.message || 'Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentAPI.delete(documentId);
      alert('Document deleted successfully!');
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert(err.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">⚙️ Admin Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 Manage Users</Link></li>
            <li><Link href="/admin/events">📅 All Events</Link></li>
            <li><Link href="/admin/registrations">🎫 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Sales Report</Link></li>
            <li><Link href="/admin/documents" className="active">📄 Documents</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="section-header">
            <h1>📄 Documents</h1>
            <button onClick={() => setShowUploadModal(true)} className="btn-primary">
              ➕ Upload Document
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="empty-state" style={{ color: 'red', marginBottom: '24px' }}>
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="empty-state">
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <section className="section">
              <div style={{ display: 'grid', gap: '16px' }}>
                {documents.map((doc) => (
                  <div key={doc._id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>📄 {doc.filename}</h3>
                      {doc.description && (
                        <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>{doc.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#999' }}>
                        <span>Size: {formatFileSize(doc.file_size)}</span>
                        <span>Category: {doc.category}</span>
                        <span>Uploaded: {formatDate(doc.uploaded_at)}</span>
                        {doc.uploaded_by && (
                          <span>By: {doc.uploaded_by.first_name} {doc.uploaded_by.last_name}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleView(doc._id)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', background: '#007bff', color: 'white' }}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDownload(doc._id, doc.filename)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px' }}
                      >
                        ⬇️ Download
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', background: '#dc3545', color: 'white' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Upload Document</h2>
                  <button onClick={() => setShowUploadModal(false)} className="close-btn">×</button>
                </div>
                <form onSubmit={handleUpload} className="modal-body">
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>File</label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="general">General</option>
                      <option value="event">Event</option>
                      <option value="report">Report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <style jsx>{`
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              padding: 20px;
            }

            .modal-content {
              background: white;
              border-radius: 8px;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .modal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 20px;
              border-bottom: 1px solid #ddd;
            }

            .modal-header h2 {
              margin: 0;
            }

            .close-btn {
              background: none;
              border: none;
              font-size: 32px;
              cursor: pointer;
              color: #666;
              line-height: 1;
            }

            .close-btn:hover {
              color: #000;
            }

            .modal-body {
              padding: 20px;
            }

            .modal-footer {
              padding: 20px;
              border-top: 1px solid #ddd;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}

