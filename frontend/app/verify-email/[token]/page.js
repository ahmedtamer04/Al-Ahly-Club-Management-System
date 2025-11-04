'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false); // Prevent multiple API calls

  useEffect(() => {
    // Prevent running multiple times
    if (hasVerified.current) {
      console.log('Already verified, skipping...');
      return;
    }
    
    const verifyEmail = async () => {
      hasVerified.current = true; // Set flag immediately
      try {
        const token = params.token;
        
        console.log('=== VERIFY EMAIL FRONTEND DEBUG ===');
        console.log('Token:', token);
        
        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        console.log('Calling API...');
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const apiResponse = await fetch(`${API_BASE_URL}/admin/verify-email/${token}`);
        console.log('HTTP Status:', apiResponse.status);
        console.log('HTTP OK:', apiResponse.ok);
        
        const response = await apiResponse.json();
        console.log('API Response:', response);
        
        if (!apiResponse.ok) {
          throw new Error(response.message || 'Verification failed');
        }
        
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
        
      } catch (error) {
        console.error('=== VERIFICATION ERROR ===');
        console.error('Error object:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        console.error('========================');
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [params.token, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {status === 'verifying' && (
          <>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 1s linear infinite'
            }}>
              ⏳
            </div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Verifying Your Email</h2>
            <p style={{ color: '#666' }}>Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#4caf50', marginBottom: '10px' }}>Email Verified!</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Redirecting to login page in 3 seconds...
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#f44336', marginBottom: '10px' }}>Verification Failed</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/auth/login')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#fff',
                  color: '#2196f3',
                  border: '1px solid #2196f3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Sign Up Again
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
