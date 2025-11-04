'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

// Load Stripe publishable key from environment
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Card payments will not work.');
  console.log('Current env keys:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
} else if (stripePublishableKey.includes('PASTE_YOUR')) {
  console.error('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY contains placeholder text. Please replace with actual Stripe key.');
} else {
  console.log('✓ Stripe publishable key loaded:', stripePublishableKey.substring(0, 20) + '...');
}

const stripePromise = stripePublishableKey && !stripePublishableKey.includes('PASTE_YOUR') 
  ? loadStripe(stripePublishableKey).catch(err => {
      console.error('Failed to load Stripe:', err);
      return null;
    })
  : null;

/**
 * StripeProvider Component
 * Wraps children with Stripe Elements context for card payment forms
 * Required for any component using Stripe payment elements
 */
export default function StripeProvider({ children, clientSecret, amount }) {
  const [options, setOptions] = useState(null);

  useEffect(() => {
    if (clientSecret) {
      setOptions({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0070f3',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#df1b41',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      });
    }
  }, [clientSecret]);

  // Don't render if Stripe is not configured
  if (!stripePromise) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff3cd', 
        color: '#856404', 
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <strong style={{ fontSize: '16px' }}>⚠️ Stripe Not Configured</strong>
        <p style={{ margin: '10px 0 5px 0' }}>Card payments are currently unavailable.</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          Please add your Stripe Publishable Key to <code>frontend/.env.local</code>
        </p>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>
          You can still use <span style={{ color: '#10b981' }}>Wallet Payment</span> instead.
        </p>
      </div>
    );
  }

  // Wait for clientSecret and options to be ready
  if (!clientSecret || !options) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading payment form...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
