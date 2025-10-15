'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../auth.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Connect to backend API
    console.log('Login:', formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Al-Ahly Events</h1>
          <h2>Welcome Back! 👋</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="student@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="btn-submit">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link href="/auth/register">Sign up</Link></p>
          <Link href="/" className="back-link">← Back to Home</Link>
        </div>

        {/* Quick Access for Testing */}
        <div className="quick-access">
          <p>Quick Access (Development):</p>
          <div className="quick-links">
            <Link href="/student">Student</Link>
            <Link href="/staff">Staff</Link>
            <Link href="/ta">TA</Link>
            <Link href="/professor">Professor</Link>
            <Link href="/vendor">Vendor</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/eventsoffice">Events Office</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
