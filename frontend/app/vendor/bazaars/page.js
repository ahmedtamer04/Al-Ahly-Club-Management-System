'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function BrowseBazaarsPage() {
  const router = useRouter();
  // Load user immediately to avoid transition flicker
  const getUserData = () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  };
  
  const [user] = useState(getUserData);
  const [searchTerm, setSearchTerm] = useState('');
  const [bazaars, setBazaars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBazaars();
  }, []);

  const fetchBazaars = async () => {
    try {
      setLoading(true);
      const data = await vendorAPI.getUpcomingBazaars();
      setBazaars(data.bazaars || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load bazaars');
      console.error('Error fetching bazaars:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleApply = (bazaarId) => {
    router.push(`/vendor/apply-bazaar?bazaar_id=${bazaarId}`);
  };

  const filteredBazaars = bazaars.filter(bazaar =>
    bazaar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bazaar.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </nav>      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars" className="active">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Bazaars 🎪</h1>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="section">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search bazaars by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading">Loading bazaars...</div>
            ) : filteredBazaars.length === 0 ? (
              <div className="empty-state">
                <p>🎪 {searchTerm ? 'No bazaars match your search' : 'No upcoming bazaars available'}</p>
                <p style={{fontSize: '0.9rem', color: '#999'}}>
                  Check back later for new opportunities
                </p>
              </div>
            ) : (
              <div className="events-grid" style={{marginTop: '1.5rem'}}>
                {filteredBazaars.map((bazaar) => (
                  <div key={bazaar._id} className="event-card">
                    <div className="event-header">
                      <h3>{bazaar.name}</h3>
                      <span className={`badge badge-${bazaar.status}`}>
                        {bazaar.status}
                      </span>
                    </div>

                    <div className="event-details">
                      <p><strong>📍 Location:</strong> {bazaar.location}</p>
                      <p><strong>📅 Start:</strong> {formatDate(bazaar.start_date)}</p>
                      <p><strong>📅 End:</strong> {formatDate(bazaar.end_date)}</p>
                      <p><strong>🕐 Time:</strong> {bazaar.time}</p>
                      
                      {bazaar.bazaar?.registration_deadline && (
                        <p><strong>⏰ Registration Deadline:</strong> {formatDate(bazaar.bazaar.registration_deadline)}</p>
                      )}
                      
                      <p><strong>📊 Days Until Start:</strong> <span style={{color: '#c41e3a', fontWeight: 'bold'}}>{bazaar.days_until_start}</span></p>
                      
                      <p>
                        <strong>🔓 Registration:</strong>{' '}
                        <span style={{color: bazaar.registration_open ? '#28a745' : '#dc3545', fontWeight: 'bold'}}>
                          {bazaar.registration_open ? '✅ Open' : '❌ Closed'}
                        </span>
                      </p>
                    </div>

                    <div className="event-footer">
                      {bazaar.registration_open ? (
                        <button className="btn btn-primary" onClick={() => handleApply(bazaar._id)}>
                          Apply Now
                        </button>
                      ) : (
                        <button className="btn btn-disabled" disabled>
                          Registration Closed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <style jsx>{`
        .event-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .event-header h3 {
          margin: 0;
          color: #c41e3a;
          font-size: 1.3rem;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .badge-upcoming {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .badge-active {
          background-color: #e8f5e9;
          color: #388e3c;
        }

        .event-details {
          margin-bottom: 1rem;
        }

        .event-details p {
          margin: 0.5rem 0;
          color: #666;
        }

        .event-footer {
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .btn {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #c41e3a;
          color: white;
        }

        .btn-primary:hover {
          background-color: #a01729;
        }

        .btn-disabled {
          background-color: #ccc;
          color: #666;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.1rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }
      `}</style>
    </div>
  );
}

