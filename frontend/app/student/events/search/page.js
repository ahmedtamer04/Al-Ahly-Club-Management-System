'use client';

import Link from 'next/link';
import { useState } from 'react';
import StudentLayout from '@/app/components/StudentLayout';
import '@/app/dashboard.css';

export default function AdvancedSearchPage() {
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: '',
    sortBy: 'date-asc'
  });

  const handleSearch = () => {
    // TODO: GET /api/events/filter/:field/:value
    // TODO: GET /api/events/sort/date/:order
    console.log('Searching with filters:', filters);
  };

  return (
    <StudentLayout>
      <h1>Advanced Event Search 🔍</h1>

          <section className="section">
            <h2>Filter Events</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                >
                  <option value="">All Types</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Trip">Trip</option>
                  <option value="Bazaar">Bazaar</option>
                  <option value="Conference">Conference</option>
                  <option value="Booth">Booth</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  placeholder="Enter location..."
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                <div className="form-group">
                  <label>Start Date (From)</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                  />
                </div>

                <div className="form-group">
                  <label>End Date (To)</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Minimum Available Capacity</label>
                <input
                  type="number"
                  value={filters.capacity}
                  onChange={(e) => setFilters({...filters, capacity: e.target.value})}
                  placeholder="e.g., 10"
                  min="0"
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                >
                  <option value="date-asc">Date (Earliest First)</option>
                  <option value="date-desc">Date (Latest First)</option>
                  <option value="capacity-desc">Most Available Seats</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>

              <div style={{display: 'flex', gap: '1rem'}}>
                <button className="btn-primary" onClick={handleSearch}>
                  🔍 Search Events
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => setFilters({type: '', location: '', startDate: '', endDate: '', capacity: '', sortBy: 'date-asc'})}
                >
                  🔄 Reset Filters
                </button>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Search Results</h2>
            <div className="empty-state">
              <p>🔍 Click "Search Events" to see results</p>
            </div>
          </section>
    </StudentLayout>
  );
}
