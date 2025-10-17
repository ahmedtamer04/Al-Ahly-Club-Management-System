'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { facilitiesAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function FacilitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await facilitiesAPI.getAll();
      console.log('Facilities response:', response);
      setFacilities(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setError(err.response?.data?.message || 'Failed to load facilities');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter facilities based on search term and type
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.attributes?.sport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'court' && facility.type === 'court') ||
                       (filterType === 'field' && facility.type === 'field') ||
                       (filterType === 'hall' && facility.type === 'hall');
    
    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const getStatsByType = () => {
    const stats = {
      basketball: facilities.filter(f => f.attributes?.sport === 'Basketball').length,
      football: facilities.filter(f => f.attributes?.sport === 'Football').length,
      tennis: facilities.filter(f => f.attributes?.sport === 'Tennis').length,
      halls: facilities.filter(f => f.type === 'hall').length
    };
    return stats;
  };

  const stats = getStatsByType();

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/student">🏠 Dashboard</Link></li>
            <li><Link href="/student/events">📅 Browse Events</Link></li>
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Available Facilities 🏟️</h1>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={filterType === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button 
                  className={filterType === 'court' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('court')}
                >
                  Courts
                </button>
                <button 
                  className={filterType === 'field' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('field')}
                >
                  Fields
                </button>
                <button 
                  className={filterType === 'hall' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilterType('hall')}
                >
                  Halls
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading" style={{marginTop: '2rem'}}>
                Loading facilities...
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="empty-state" style={{marginTop: '1.5rem'}}>
                {facilities.length === 0 ? (
                  <>
                    <p>🏟️ No facilities available</p>
                    <p style={{fontSize: '0.9rem', color: '#999'}}>
                      Contact administration to add facilities
                    </p>
                  </>
                ) : (
                  <>
                    <p>🔍 No facilities match your search</p>
                    <p style={{fontSize: '0.9rem', color: '#999'}}>
                      Try adjusting your search terms or filters
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="admin-grid" style={{marginTop: '1.5rem'}}>
                {filteredFacilities.map((facility) => (
                  <div key={facility._id} className="admin-card">
                    <div className="admin-card-header">
                      <h3>{facility.name}</h3>
                      <span className={`badge ${facility.status === 'available' ? 'badge-success' : 'badge-secondary'}`}>
                        {facility.status === 'available' ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>
                    <div className="admin-card-content">
                      <div className="detail-item">
                        <span className="detail-label">Sport:</span>
                        <span className="detail-value">{facility.attributes?.sport || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{facility.type}</span>
                      </div>
                      {facility.location && (
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{facility.location}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Indoor:</span>
                        <span className="detail-value">
                          {facility.attributes?.indoor ? '🏢 Yes' : '🌤️ Outdoor'}
                        </span>
                      </div>
                      
                      {/* Availability Summary */}
                      {facility.availabilitySummary && (
                        <div className="detail-item">
                          <span className="detail-label">Total Slots:</span>
                          <span className="detail-value">
                            {facility.availabilitySummary.totalTimeSlots} slots across {facility.availabilitySummary.totalDays} days
                          </span>
                        </div>
                      )}

                      {/* Next Available Date */}
                      {facility.availabilitySummary?.nextAvailableDate && (
                        <div className="detail-item">
                          <span className="detail-label">Next Available:</span>
                          <span className="detail-value">
                            📅 {new Date(facility.availabilitySummary.nextAvailableDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}

                      {/* Detailed Availability */}
                      {facility.availabilityDetails && facility.availabilityDetails.length > 0 && (
                        <div className="detail-item" style={{marginTop: '1rem'}}>
                          <span className="detail-label">Available Times:</span>
                          <div style={{marginTop: '0.5rem'}}>
                            {facility.availabilityDetails.slice(0, 3).map((slot, index) => (
                              <div key={index} style={{
                                background: '#f8f9fa',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                              }}>
                                <div style={{fontWeight: '500', color: '#495057'}}>
                                  📅 {slot.formattedDate}
                                </div>
                                <div style={{marginTop: '0.25rem', color: '#6c757d'}}>
                                  ⏰ {slot.times.join(', ')}
                                </div>
                              </div>
                            ))}
                            {facility.availabilityDetails.length > 3 && (
                              <div style={{
                                color: '#6c757d',
                                fontSize: '0.8rem',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                marginTop: '0.5rem'
                              }}>
                                ... and {facility.availabilityDetails.length - 3} more days
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* No availability message */}
                      {(!facility.availabilityDetails || facility.availabilityDetails.length === 0) && (
                        <div className="detail-item">
                          <span className="detail-label">Availability:</span>
                          <span className="detail-value" style={{color: '#dc3545'}}>
                            ❌ No time slots available
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <h2>Facility Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏀</div>
                <div className="stat-info">
                  <h3>{stats.basketball}</h3>
                  <p>Basketball Courts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚽</div>
                <div className="stat-info">
                  <h3>{stats.football}</h3>
                  <p>Football Fields</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎾</div>
                <div className="stat-info">
                  <h3>{stats.tennis}</h3>
                  <p>Tennis Courts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏛️</div>
                <div className="stat-info">
                  <h3>{stats.halls}</h3>
                  <p>Multi-purpose Halls</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
