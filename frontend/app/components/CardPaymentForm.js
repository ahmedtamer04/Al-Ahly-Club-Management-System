'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

/**
 * CardPaymentForm Component
 * Secure card payment form using Stripe Elements
 * Must be wrapped in StripeProvider with clientSecret
 */
export default function CardPaymentForm({ onSuccess, onError, onCancel, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        if (onError) onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      if (onError) onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-payment-form">
      <div className="payment-amount">
        <strong>Amount to pay:</strong> ${amount?.toFixed(2) || '0.00'}
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div className="error-message" style={{ color: '#df1b41', marginTop: '12px' }}>
          {errorMessage}
        </div>
      )}

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn-primary"
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: isProcessing ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
          }}
        >
          {isProcessing ? 'Processing...' : `Pay $${amount?.toFixed(2) || '0.00'}`}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="btn-secondary"
            style={{
              padding: '12px 24px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <style jsx>{`
        .card-payment-form {
          width: 100%;
        }
        .payment-amount {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          font-size: 18px;
        }
      `}</style>
    </form>
  );
}
