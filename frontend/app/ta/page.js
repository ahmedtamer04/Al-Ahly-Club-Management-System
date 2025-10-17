'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function TADashboard() {
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [managingEventsCount, setManagingEventsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No token found');
          setLoading(false);
          return;
        }

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

        // TODO: Fetch events the TA is managing (if you have an endpoint for this)
        // Example:
        // const managingResponse = await fetch('http://localhost:5001/events/my-events', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // if (managingResponse.ok) {
        //   const managingData = await managingResponse.json();
        //   setManagingEventsCount(managingData.length);
        // }

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
                <h3>{loading ? '...' : managingEventsCount}</h3>
                <p>Events I'm Managing</p>
              </div>
            </div>
          </div>

          <section className="section">
            <h2>My Events</h2>
            <div className="empty-state">
              <p>📝 You're not managing any events yet</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
