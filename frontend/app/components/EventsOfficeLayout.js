'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import '@/app/dashboard.css';

export default function EventsOfficeLayout({ children }) {
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
            <span className="nav-user">🎯 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <Link 
                href="/eventsoffice" 
                className={isActive('/eventsoffice') && pathname === '/eventsoffice' ? 'active' : ''}
              >
                🏠 Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/events"
                className={isActive('/eventsoffice/events') ? 'active' : ''}
              >
                📅 View All Events
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/workshops/pending"
                className={isActive('/eventsoffice/workshops') ? 'active' : ''}
              >
                🎨 Pending Workshops
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/conferences"
                className={isActive('/eventsoffice/conferences') ? 'active' : ''}
              >
                🎓 Conferences
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/trips"
                className={isActive('/eventsoffice/trips') ? 'active' : ''}
              >
                ✈️ Trips
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/bazaars"
                className={isActive('/eventsoffice/bazaars') ? 'active' : ''}
              >
                🛍️ Bazaars
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/polls"
                className={isActive('/eventsoffice/polls') ? 'active' : ''}
              >
                📊 Polls
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/gym"
                className={isActive('/eventsoffice/gym') ? 'active' : ''}
              >
                💪 Gym Sessions
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/facilities"
                className={isActive('/eventsoffice/facilities') ? 'active' : ''}
              >
                🏢 Facilities
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/vendors"
                className={isActive('/eventsoffice/vendors') ? 'active' : ''}
              >
                👥 Vendor Requests
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/registrations"
                className={isActive('/eventsoffice/registrations') ? 'active' : ''}
              >
                📋 Registrations
              </Link>
            </li>
            <li>
              <Link 
                href="/loyalty-program"
                className={pathname === '/loyalty-program' ? 'active' : ''}
              >
                🎁 Loyalty Program
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/sales-report"
                className={isActive('/eventsoffice/sales-report') ? 'active' : ''}
              >
                💰 Sales Report
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/documents"
                className={isActive('/eventsoffice/documents') ? 'active' : ''}
              >
                📄 Documents
              </Link>
            </li>
            <li>
              <Link 
                href="/eventsoffice/profile"
                className={isActive('/eventsoffice/profile') ? 'active' : ''}
              >
                👤 Profile
              </Link>
            </li>
          </ul>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
