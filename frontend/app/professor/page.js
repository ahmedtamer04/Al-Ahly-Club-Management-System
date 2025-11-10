"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUser } from '@/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import '@/app/dashboard.css';

export default function ProfessorDashboard() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUserName(`Professor ${userData.first_name} ${userData.last_name}`);
    }
  }, []);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/events">📅 Events</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/payment-history">💰 Payment History</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="welcome-section">
            <div className="welcome-header">
              <h1>Welcome{userName ? `, ${userName}` : ', Professor'}! 👋</h1>
              <p className="welcome-subtitle">Here's an overview of your activities and available features</p>
            </div>
            
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon">🎨</div>
                <div className="stat-info">
                  <h3>3</h3>
                  <p>Active Workshops</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>45</h3>
                  <p>Total Students</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>89%</h3>
                  <p>Average Rating</p>
                </div>
              </div>
            </div>
          </div>
          
          <section className="features-section">
            <h2>Quick Actions</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <div className="feature-info">
                  <h3>View Events</h3>
                  <p>Browse and register for upcoming events including workshops, conferences, bazaars, and more.</p>
                  <Link href="/professor/events" className="btn-primary">View Events</Link>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <div className="feature-info">
                  <h3>Manage Workshops</h3>
                  <p>Create and manage your workshops. View registrations and track attendance.</p>
                  <Link href="/professor/workshops" className="btn-primary">My Workshops</Link>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">�</div>
                <div className="feature-info">
                  <h3>Gym Schedule</h3>
                  <p>View monthly gym sessions including Yoga, Pilates, Zumba, Cardio, and more.</p>
                  <Link href="/professor/gym" className="btn-primary">View Schedule</Link>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">�👤</div>
                <div className="feature-info">
                  <h3>Profile Settings</h3>
                  <p>Update your profile information and preferences.</p>
                  <Link href="/professor/profile" className="btn-primary">View Profile</Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
