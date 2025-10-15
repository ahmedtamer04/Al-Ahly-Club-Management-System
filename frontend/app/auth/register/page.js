'use client';

import Link from 'next/link';
import { useState } from 'react';
import '../auth.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // TODO: Connect to backend API
    console.log('Register:', formData);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Al-Ahly Events</h1>
          <h2>Create Account 🎓</h2>
          <p>Join our university events community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

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
            <label>Role</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="Student">Student</option>
              <option value="Staff">Staff</option>
              <option value="TA">Teaching Assistant</option>
              <option value="Professor">Professor</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          </div>

          <label className="checkbox-label">
            <input type="checkbox" required />
            <span>I agree to the Terms & Conditions</span>
          </label>

          <button type="submit" className="btn-submit">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link href="/auth/login">Sign in</Link></p>
          <Link href="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
