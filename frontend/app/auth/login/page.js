'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/utils/api';
import '../auth.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      // Success - redirect based on role
      const userRole = response.user.role;
      
      // Debug logging
      console.log('=== LOGIN SUCCESS DEBUG ===');
      console.log('Full response:', response);
      console.log('User object:', response.user);
      console.log('User role:', userRole);
      console.log('User role type:', typeof userRole);
      console.log('========================');
      
      // Show success message briefly before redirect
      setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
      
      // Redirect to appropriate dashboard
      setTimeout(() => {
        // Normalize the role to handle case sensitivity
        const normalizedRole = userRole ? userRole.trim() : '';
        
        console.log('About to redirect. Normalized role:', normalizedRole);
        
        // Use if-else for more reliable matching
        if (normalizedRole === 'Vendor' || normalizedRole === 'vendor') {
          console.log('Matched Vendor role, redirecting to /vendor');
          router.push('/vendor');
        } else if (normalizedRole === 'Student') {
          router.push('/student');
        } else if (normalizedRole === 'Staff') {
          router.push('/staff');
        } else if (normalizedRole === 'TA') {
          router.push('/ta');
        } else if (normalizedRole === 'Professor') {
          router.push('/professor');
        } else if (normalizedRole === 'Admin') {
          router.push('/admin');
        } else if (normalizedRole === 'EventsOffice' || normalizedRole === 'eventsoffice' || normalizedRole === 'Events Office') {
          console.log('Matched EventsOffice role, redirecting to /eventsoffice');
          router.push('/eventsoffice');
        } else {
          console.log('No role matched, redirecting to home. Role was:', normalizedRole);
          router.push('/');
        }
      }, 1000);

    } catch (error) {
      // Handle different error messages from backend
      const errorMessage = error.message;
      
      if (errorMessage.includes('blocked')) {
        setMessage({ text: 'Your account has been blocked. Please contact admin.', type: 'error' });
      } else if (errorMessage.includes('pending') || errorMessage.includes('approval')) {
        setMessage({ text: 'Your account is pending approval. Please wait for admin verification.', type: 'warning' });
      } else if (errorMessage.includes('not active')) {
        setMessage({ text: 'Account is not active. Please contact support.', type: 'error' });
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('credentials')) {
        setMessage({ text: 'Invalid email or password. Please try again.', type: 'error' });
      } else {
        setMessage({ text: error.message || 'Login failed. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Al-Ahly Events</h1>
          <h2>Welcome Back! 👋</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <small style={{color: '#666', fontSize: '0.85rem'}}>
              Use your registered email (GUC email or vendor email)
            </small>
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

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link href="/auth/register">Sign up</Link></p>
          <Link href="/" className="back-link">← Back to Home</Link>
        </div>

        {/* Quick Access for Testing */}
        <div className="quick-access">
          <p>🔧 Quick Access (Development Only):</p>
          <div className="quick-links">
            <Link href="/student">Student</Link>
            <Link href="/staff">Staff</Link>
            <Link href="/ta">TA</Link>
            <Link href="/professor">Professor</Link>
            <Link href="/vendor">Vendor</Link>
            <Link href="/admin">Admin</Link>
            <Link href="/eventsoffice">Events Office</Link>
          </div>
          <small style={{color: '#999', fontSize: '0.8rem', marginTop: '5px', display: 'block'}}>
            Remove this section in production
          </small>
        </div>

        <div className="info-box">
          <h4>ℹ️ Login Information:</h4>
          <ul>
            <li><strong>Blocked accounts:</strong> Cannot login (contact admin)</li>
            <li><strong>Pending accounts:</strong> Staff/TA/Professor waiting for approval</li>
            <li><strong>Active accounts:</strong> Student, Vendor, Admin, EventsOffice can login immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
