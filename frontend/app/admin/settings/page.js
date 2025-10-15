'use client';

import Link from 'next/link';
import { useState } from 'react';
import '@/app/dashboard.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Al-Ahly Events',
    siteEmail: 'admin@alahlyclubs.com',
    registrationEnabled: true,
    approvalRequired: false,
    maxCapacity: 100,
    currency: 'EGP'
  });

  const handleSave = () => {
    // TODO: Save settings to backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">⚙️ Admin Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 Manage Users</Link></li>
            <li><Link href="/admin/events">📅 All Events</Link></li>
            <li><Link href="/admin/registrations">🎫 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Reports</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>System Settings ⚙️</h1>
            <button className="btn-primary" onClick={handleSave}>💾 Save Changes</button>
          </div>

          {/* General Settings */}
          <section className="section">
            <h2>General Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => setSettings({...settings, siteEmail: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                >
                  <option value="EGP">Egyptian Pound (EGP)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Event Settings */}
          <section className="section">
            <h2>Event Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Default Maximum Capacity</label>
                <input
                  type="number"
                  value={settings.maxCapacity}
                  onChange={(e) => setSettings({...settings, maxCapacity: e.target.value})}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.registrationEnabled}
                    onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})}
                  />
                  <span>Enable Event Registrations</span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.approvalRequired}
                    onChange={(e) => setSettings({...settings, approvalRequired: e.target.checked})}
                  />
                  <span>Require Admin Approval for Events</span>
                </label>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="section">
            <h2>Email Notifications</h2>
            <div className="settings-form">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Send confirmation emails for registrations</span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Send event reminders to users</span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Notify admins of new vendor applications</span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Send weekly summary reports</span>
                </label>
              </div>
            </div>
          </section>

          {/* Security Settings */}
          <section className="section">
            <h2>Security & Access</h2>
            <div className="settings-form">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Require email verification for new accounts</span>
                </label>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Enable two-factor authentication</span>
                </label>
              </div>

              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  defaultValue={60}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="section" style={{borderColor: '#DD0000'}}>
            <h2 style={{color: '#DD0000'}}>⚠️ Danger Zone</h2>
            <div className="danger-actions">
              <button className="btn-danger" style={{background: '#DD0000', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', marginRight: '1rem'}}>
                🗑️ Clear All Logs
              </button>
              <button className="btn-danger" style={{background: '#DD0000', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer'}}>
                🔄 Reset System
              </button>
            </div>
          </section>

          {/* Save Button */}
          <div style={{marginTop: '2rem'}}>
            <button className="btn-primary" onClick={handleSave} style={{marginRight: '1rem'}}>
              💾 Save All Changes
            </button>
            <button className="btn-secondary">
              ❌ Cancel
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
