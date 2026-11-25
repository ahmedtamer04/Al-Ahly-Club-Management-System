"use client";

import { useState, useEffect } from 'react';

export default function EventResourcesTab({ eventId, canUpload = false }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    fetchResources();
  }, [eventId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('You must be logged in to view resources');
      }

      if (!eventId) {
        throw new Error('Invalid event ID');
      }
      
      const response = await fetch(`/api/event-resources/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusText = response.status === 404 ? 'Event not found' : 
                          response.status === 403 ? 'Access denied' :
                          response.status === 401 ? 'Please login again' :
                          `Server error (${response.status})`;
        throw new Error(errorData.message || statusText);
      }

      const data = await response.json();
      setResources(data.resources || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('description', description);

      const response = await fetch(`/api/event-resources/${eventId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to upload file');
      }

      alert('File uploaded successfully!');
      setShowUploadModal(false);
      resetForm();
      fetchResources();
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkAdd = async (e) => {
    e.preventDefault();
    
    if (!title || !url) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/event-resources/${eventId}/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, url })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add link');
      }

      alert('Link added successfully!');
      setShowUploadModal(false);
      resetForm();
      fetchResources();
    } catch (err) {
      console.error('Error adding link:', err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resourceId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/event-resources/download/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert(err.message);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/event-resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete resource');
      }

      alert('Resource deleted successfully!');
      fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setUrl('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
    return '📄';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading resources...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>📚 Event Resources & Materials</h2>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '10px 20px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ➕ Add Resource
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📚</span>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            {canUpload ? 'No resources yet. Upload slides, documents, or add links!' : 'No resources available for this event yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {resources.map((resource) => (
            <div
              key={resource._id}
              style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '32px' }}>
                {resource.resource_type === 'link' ? '🔗' : getFileIcon(resource.mime_type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                  {resource.title}
                </h3>
                {resource.description && (
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                    {resource.description}
                  </p>
                )}
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#999' }}>
                  {resource.resource_type === 'file' && resource.file_size && (
                    <span>{formatFileSize(resource.file_size)} • </span>
                  )}
                  Uploaded by {resource.uploaded_by?.first_name} {resource.uploaded_by?.last_name} on {new Date(resource.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {resource.resource_type === 'file' ? (
                  <button
                    onClick={() => handleDownload(resource._id, resource.file_name)}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    💾 Download
                  </button>
                ) : (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 16px',
                      background: '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    🔗 Open Link
                  </a>
                )}
                
                {canUpload && (
                  <button
                    onClick={() => handleDelete(resource._id)}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Add Resource</h2>

            {/* Type Selection */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setUploadType('file')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: uploadType === 'file' ? '#0066cc' : '#f0f0f0',
                  color: uploadType === 'file' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                📄 Upload File
              </button>
              <button
                onClick={() => setUploadType('link')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: uploadType === 'link' ? '#0066cc' : '#f0f0f0',
                  color: uploadType === 'link' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔗 Add Link
              </button>
            </div>

            {uploadType === 'file' ? (
              <form onSubmit={handleFileUpload}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <small style={{ color: '#666' }}>PDF, images, or documents (max 50MB)</small>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Leave empty to use filename"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Brief description of this resource"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetForm();
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      padding: '10px 20px',
                      background: uploading ? '#ccc' : '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLinkAdd}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Conference Website, Photo Album"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    URL *
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Brief description of this link"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetForm();
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      padding: '10px 20px',
                      background: uploading ? '#ccc' : '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {uploading ? 'Adding...' : 'Add Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
