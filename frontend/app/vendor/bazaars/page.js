'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function BrowseBazaarsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 Vendor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/booths">🏪 My Booths</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Bazaars 🎪</h1>

          <section className="section">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search bazaars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="events-grid" style={{marginTop: '1.5rem'}}>
              <div className="empty-state">
                <p>🎪 No bazaars available for applications</p>
                <p style={{fontSize: '0.9rem', color: '#999'}}>
                  Check back later for new opportunities
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
