'use client';

import Link from 'next/link';
import NotificationBell from './NotificationBell';

export default function StaffLayout({ children }) {
  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
            <span className="nav-user">👨‍💼 Staff Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/staff">🏠 Dashboard</Link></li>
            <li><Link href="/staff/events">📅 Browse Events</Link></li>
            <li><Link href="/staff/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/staff/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/staff/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/staff/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/staff/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/staff/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        {/* Main Area */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
