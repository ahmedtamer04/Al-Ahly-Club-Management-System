'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function TADashboard() {
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [myEventsCount, setMyEventsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
          console.error('No token or user found');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user._id;

        // Fetch upcoming events count
        const eventsResponse = await fetch('http://localhost:5000/api/events/upcoming', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setUpcomingEventsCount(eventsData.length);
        }

        // Fetch my registered events count
        const registrationsResponse = await fetch(`http://localhost:5000/api/registration/${userId}/events`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (registrationsResponse.ok) {
          const registrationsData = await registrationsResponse.json();
          // Count only upcoming registered events
          setMyEventsCount(registrationsData.upcoming?.length || 0);
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 TA Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/ta">🏠 Dashboard</Link></li>
            <li><Link href="/ta/events">📅 Browse Events</Link></li>
            <li><Link href="/ta/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Welcome, Teaching Assistant! 👋</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{loading ? '...' : upcomingEventsCount}</h3>
                <p>Upcoming Events</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✏️</div>
              <div className="stat-info">
                <h3>{loading ? '...' : myEventsCount}</h3>
                <p>My Registered Events</p>
              </div>
            </div>
          </div>

          <section className="section">
            <h2>Quick Actions</h2>
            <div className="quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <Link href="/ta/events" style={{ textDecoration: 'none' }}>
                <div className="action-card" style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  color: '#333'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                  <h3>Browse Events</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>View all available events</p>
                </div>
              </Link>

              <Link href="/ta/my-events" style={{ textDecoration: 'none' }}>
                <div className="action-card" style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  color: '#333'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✏️</div>
                  <h3>My Registered Events</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>View your registrations</p>
                </div>
              </Link>

              <Link href="/ta/favorites" style={{ textDecoration: 'none' }}>
                <div className="action-card" style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  color: '#333'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
                  <h3>My Favorites</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>View saved events</p>
                </div>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
