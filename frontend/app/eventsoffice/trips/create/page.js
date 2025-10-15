'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function CreateTripPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    departureTime: '',
    returnTime: '',
    transportMode: 'bus',
    maxCapacity: '50',
    price: '',
    itinerary: '',
    includedServices: '',
    requirements: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/trips/create
    console.log('Create trip:', formData);
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">📋 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">� Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">� Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
            <li><Link href="/eventsoffice/registrations">📝 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Create Trip 🚌</h1>

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="title">Trip Title *</label>
                <input
                  type="text"
                  id="title"
                  required
                  placeholder="e.g., Weekend Beach Getaway"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  rows="4"
                  required
                  placeholder="Describe the trip, highlights, activities..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="destination">Destination *</label>
                <input
                  type="text"
                  id="destination"
                  required
                  placeholder="City, Country or specific location"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">End Date *</label>
                  <input
                    type="date"
                    id="endDate"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="departureTime">Departure Time *</label>
                  <input
                    type="time"
                    id="departureTime"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="returnTime">Return Time *</label>
                  <input
                    type="time"
                    id="returnTime"
                    required
                    value={formData.returnTime}
                    onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transportMode">Transport Mode *</label>
                  <select
                    id="transportMode"
                    required
                    value={formData.transportMode}
                    onChange={(e) => setFormData({...formData, transportMode: e.target.value})}
                  >
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="train">Train</option>
                    <option value="plane">Plane</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="maxCapacity">Max Capacity *</label>
                  <input
                    type="number"
                    id="maxCapacity"
                    min="1"
                    max="500"
                    required
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price (EGP) *</label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="itinerary">Itinerary</label>
                <textarea
                  id="itinerary"
                  rows="4"
                  placeholder="Day-by-day schedule and activities..."
                  value={formData.itinerary}
                  onChange={(e) => setFormData({...formData, itinerary: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="includedServices">Included Services</label>
                <textarea
                  id="includedServices"
                  rows="3"
                  placeholder="Meals, accommodation, tickets, etc."
                  value={formData.includedServices}
                  onChange={(e) => setFormData({...formData, includedServices: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="requirements">Requirements</label>
                <textarea
                  id="requirements"
                  rows="3"
                  placeholder="ID requirements, age restrictions, what to bring..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create Trip</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setFormData({
                    title: '', description: '', destination: '', startDate: '', endDate: '',
                    departureTime: '', returnTime: '', transportMode: 'bus', maxCapacity: '50',
                    price: '', itinerary: '', includedServices: '', requirements: ''
                  })}
                >
                  Reset
                </button>
              </div>

              <small style={{color: '#999', marginTop: '1rem', display: 'block'}}>
                API: POST /api/trips/create
              </small>
            </form>
          </section>

          <section className="section">
            <h2>Upcoming Trips</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Destination</th>
                    <th>Dates</th>
                    <th>Price</th>
                    <th>Enrolled / Capacity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        <p>🚌 No trips scheduled yet</p>
                        <p style={{fontSize: '0.9rem', color: '#999'}}>
                          API: GET /api/trips/list<br/>
                          PUT /api/trips/update/:id<br/>
                          GET /api/trips/get/:id
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
