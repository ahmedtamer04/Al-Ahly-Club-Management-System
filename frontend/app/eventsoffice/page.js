'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { conferenceAPI, tripAPI, bazaarAPI, registrationAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function EventsOfficeDashboard() {
  const [stats, setStats] = useState({
    conferences: 0,
    trips: 0,
    bazaars: 0,
    registrations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch all event types
      const [conferencesRes, tripsRes, bazaarsRes] = await Promise.all([
        conferenceAPI.getAll().catch(() => ({ length: 0 })),
        tripAPI.getAll().catch(() => ({ length: 0 })),
        bazaarAPI.getAll().catch(() => ({ bazaars: [] }))
      ]);

      // Count conferences
      const conferenceCount = Array.isArray(conferencesRes) 
        ? conferencesRes.length 
        : (conferencesRes?.conferences?.length || 0);

      // Count trips
      const tripCount = Array.isArray(tripsRes) 
        ? tripsRes.length 
        : (tripsRes?.trips?.length || 0);

      // Count bazaars
      const bazaarCount = Array.isArray(bazaarsRes) 
        ? bazaarsRes.length 
        : (bazaarsRes?.bazaars?.length || 0);

      // Calculate total registrations (sum of registrations from all events)
      let totalRegistrations = 0;
      
      // Add conference registrations
      if (Array.isArray(conferencesRes)) {
        totalRegistrations += conferencesRes.reduce((sum, conf) => 
          sum + (conf.registrations?.length || 0), 0);
      }
      
      // Add trip registrations
      if (Array.isArray(tripsRes)) {
        totalRegistrations += tripsRes.reduce((sum, trip) => 
          sum + (trip.registrations?.length || 0), 0);
      }
      
      // Add bazaar vendor registrations
      if (Array.isArray(bazaarsRes)) {
        totalRegistrations += bazaarsRes.reduce((sum, bazaar) => 
          sum + (bazaar.bazaar?.vendors_participating?.length || 0), 0);
      } else if (bazaarsRes?.bazaars) {
        totalRegistrations += bazaarsRes.bazaars.reduce((sum, bazaar) => 
          sum + (bazaar.bazaar?.vendors_participating?.length || 0), 0);
      }

      setStats({
        conferences: conferenceCount,
        trips: tripCount,
        bazaars: bazaarCount,
        registrations: totalRegistrations
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
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
          <h1>Events Office Dashboard 🎯</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.conferences}</h3>
                <p>Conferences</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✈️</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.trips}</h3>
                <p>Trips</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛍️</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.bazaars}</h3>
                <p>Bazaars</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.registrations}</h3>
                <p>Total Registrations</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <h2>Quick Actions</h2>
              <Link href="/eventsoffice/conferences/create" className="btn-primary">➕ Create New Conference</Link>
            </div>
            <div className="admin-grid">
              <Link href="/eventsoffice/events" className="admin-card">
                <div className="admin-icon">📅</div>
                <h3>View All Events</h3>
                <p>Browse, search, and filter all events with vendor details</p>
              </Link>
              <Link href="/eventsoffice/conferences" className="admin-card">
                <div className="admin-icon">🎓</div>
                <h3>Manage Conferences</h3>
                <p>Create and manage conference events</p>
              </Link>
              <Link href="/eventsoffice/trips" className="admin-card">
                <div className="admin-icon">✈️</div>
                <h3>Manage Trips</h3>
                <p>Organize and manage trip events</p>
              </Link>
              <Link href="/eventsoffice/bazaars" className="admin-card">
                <div className="admin-icon">🛍️</div>
                <h3>Manage Bazaars</h3>
                <p>Create bazaars and review vendor applications</p>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
