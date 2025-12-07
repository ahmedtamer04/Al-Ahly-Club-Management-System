'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authAPI } from '@/utils/api';
import '../auth.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    id_number: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
    company_name: '' // For vendors only
  });

  const [message, setMessage] = useState({ text: '', type: '' }); // success or error
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthLabel = (strength) => {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength];
  };

  const getPasswordStrengthColor = (strength) => {
    const colors = ['#E5E5E5', '#DD0000', '#FF9500', '#52C41A', '#00B050'];
    return colors[strength];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match!', type: 'error' });
      return;
    }

    // Vendor-specific validation
    if (formData.role === 'Vendor') {
      if (!formData.company_name) {
        setMessage({ text: 'Company name is required for vendors', type: 'error' });
        return;
      }
    } else {
      // Non-vendor validation
      if (!formData.first_name || !formData.last_name || !formData.id_number) {
        setMessage({ text: 'All fields are required', type: 'error' });
        return;
      }
      // Email domain validation DISABLED for development testing
      // Backend will handle validation based on DEVELOPMENT_MODE flag
      // UNCOMMENT IN PRODUCTION:
      // if (!formData.email.endsWith('@guc.edu.eg')) {
      //   setMessage({ text: 'Email must be a valid GUC email (@guc.edu.eg)', type: 'error' });
      //   return;
      // }
    }

    // Prepare data for backend
    const registrationData = {
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === 'Vendor') {
      registrationData.company_name = formData.company_name;
    } else {
      registrationData.first_name = formData.first_name;
      registrationData.last_name = formData.last_name;
      registrationData.id_number = formData.id_number;
    }

    // Call backend API
    setLoading(true);
    try {
      const response = await authAPI.signup(registrationData);
      
      // Success message based on role and response
      if (formData.role === 'Staff' || formData.role === 'TA' || formData.role === 'Professor') {
        setMessage({ 
          text: response.devMode 
            ? 'Account created! Waiting for admin approval. (Development mode: No email verification needed)'
            : 'Account created! Waiting for admin approval. You will receive a verification email once approved.', 
          type: 'warning' 
        });
      } else if (formData.role === 'Student') {
        setMessage({ 
          text: response.devMode
            ? 'Account created successfully! You can login immediately. (Development mode: Email verification skipped)'
            : 'Account created! Please check your email to verify your account before logging in.',
          type: 'success' 
        });
      } else {
        setMessage({ text: 'Account created successfully! You can now login.', type: 'success' });
      }

      // Clear form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        id_number: '',
        password: '',
        confirmPassword: '',
        role: 'Student',
        company_name: ''
      });
    } catch (error) {
      setMessage({ text: error.message || 'Registration failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Al-Ahly Events</h1>
          <h2>Create Account 🎓</h2>
          <p>Join our university events community</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Role *</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            >
              <option value="Student">Student</option>
              <option value="Staff">Staff (Requires Approval)</option>
              <option value="TA">Teaching Assistant (Requires Approval)</option>
              <option value="Professor">Professor (Requires Approval)</option>
              <option value="Vendor">Vendor</option>
            </select>
            {(formData.role === 'Staff' || formData.role === 'TA' || formData.role === 'Professor') && (
              <small style={{color: '#DD0000', fontSize: '0.85rem'}}>
                ⚠️ Your account will need admin approval before you can login
              </small>
            )}
          </div>

          {formData.role === 'Vendor' ? (
            // Vendor-specific fields
            <>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  placeholder="Your Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="company@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <small style={{color: '#666', fontSize: '0.85rem'}}>
                  Any valid email address
                </small>
              </div>
            </>
          ) : (
            // Non-vendor fields (Student, Staff, TA, Professor)
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <small style={{color: '#666', fontSize: '0.85rem'}}>
                  Any email works in development mode
                </small>
              </div>

              <div className="form-group">
                <label>ID Number *</label>
                <input
                  type="text"
                  placeholder="Your university ID number"
                  value={formData.id_number}
                  onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => {
                const newPassword = e.target.value;
                setFormData({...formData, password: newPassword});
                setPasswordStrength(calculatePasswordStrength(newPassword));
              }}
              required
              minLength="6"
            />
            {formData.password && (
              <div style={{marginTop: '0.5rem'}}>
                <div style={{
                  height: '4px',
                  background: '#E5E5E5',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength / 4) * 100}%`,
                    background: getPasswordStrengthColor(passwordStrength),
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <small style={{
                  color: getPasswordStrengthColor(passwordStrength),
                  fontSize: '0.85rem',
                  marginTop: '0.25rem',
                  display: 'block'
                }}>
                  Password strength: {getPasswordStrengthLabel(passwordStrength)}
                </small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
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

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link href="/auth/login">Sign in</Link></p>
          <Link href="/" className="back-link">← Back to Home</Link>
        </div>

        <div className="info-box">
          <h4>📋 Registration Requirements:</h4>
          <ul>
            <li><strong>Student:</strong> GUC email + ID number (Instant access)</li>
            <li><strong>Staff/TA/Professor:</strong> GUC email + ID number (Requires admin approval)</li>
            <li><strong>Vendor:</strong> Company name + Any email (Instant access)</li>
            <li><strong>Admin/EventsOffice:</strong> Cannot register (Contact existing admin)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
