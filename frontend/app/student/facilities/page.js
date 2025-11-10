'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { facilityAPI, getUser } from '@/utils/api';
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
      
      const user = getUser();
      if (!user) {
        setError('Please log in to view facilities.');
        return;
      }

      console.log('Fetching facilities...');
      const response = await facilityAPI.getAll();
      console.log('Facilities response:', response);
      
      if (Array.isArray(response)) {
        setFacilities(response);
      } else if (response && Array.isArray(response.data)) {
        setFacilities(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setFacilities([]);
      }
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load facilities.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFacilities = () => {
    return facilities.filter(facility => {
      const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          facility.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          facility.attributes?.sport?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === 'all') return matchesSearch;
      if (filterType === 'court') return matchesSearch && facility.type === 'court';
      if (filterType === 'field') return matchesSearch && facility.type === 'field';  
      if (filterType === 'hall') return matchesSearch && facility.type === 'hall';
      return matchesSearch;
    });
  };

  const getFacilityCounts = () => {
    return {
      basketball: facilities.filter(f => f.attributes?.sport === 'Basketball').length,
      football: facilities.filter(f => f.attributes?.sport === 'Football').length,
      tennis: facilities.filter(f => f.attributes?.sport === 'Tennis').length,
      halls: facilities.filter(f => f.type === 'hall').length,
    };
  };

  const filteredFacilities = getFilteredFacilities();
  const counts = getFacilityCounts();

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
            <li><Link href="/student/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Available Facilities 🏟️</h1>

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

            <div className="admin-grid" style={{marginTop: '1.5rem'}}>
              {loading && (
                <div className="empty-state">
                  <p>🔄 Loading facilities...</p>
                </div>
              )}

              {error && (
                <div className="empty-state">
                  <p>❌ {error}</p>
                  <button className="btn-primary" onClick={fetchFacilities} style={{marginTop: '1rem'}}>
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && filteredFacilities.length === 0 && (
                <div className="empty-state">
                  <p>🏟️ No facilities found</p>
                  {searchTerm || filterType !== 'all' ? (
                    <p style={{fontSize: '0.9rem', color: '#666'}}>
                      Try adjusting your search or filter
                    </p>
                  ) : (
                    <p style={{fontSize: '0.9rem', color: '#666'}}>
                      No facilities have been added yet
                    </p>
                  )}
                </div>
              )}

              {!loading && !error && filteredFacilities.map(facility => (
                <div key={facility._id} className="admin-card">
                  <div className="card-header">
                    <h3>{facility.name}</h3>
                    <span className={`status ${facility.status === 'available' ? 'active' : 'inactive'}`}>
                      {facility.status === 'available' ? '✅ Available' : '❌ Unavailable'}
                    </span>
                  </div>
                  <div className="card-content">
                    <p><strong>Type:</strong> {facility.type}</p>
                    <p><strong>Sport:</strong> {facility.attributes?.sport || 'N/A'}</p>
                    {facility.location && <p><strong>Location:</strong> {facility.location}</p>}
                    <p><strong>Indoor:</strong> {facility.attributes?.indoor ? 'Yes' : 'No'}</p>
                    {facility.availability && facility.availability.length > 0 && (
                      <p><strong>Available Dates:</strong> {facility.availability.length} scheduled</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>Facility Types</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏀</div>
                <div className="stat-info">
                  <h3>{counts.basketball}</h3>
                  <p>Basketball Courts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚽</div>
                <div className="stat-info">
                  <h3>{counts.football}</h3>
                  <p>Football Fields</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎾</div>
                <div className="stat-info">
                  <h3>{counts.tennis}</h3>
                  <p>Tennis Courts</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏛️</div>
                <div className="stat-info">
                  <h3>{counts.halls}</h3>
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
