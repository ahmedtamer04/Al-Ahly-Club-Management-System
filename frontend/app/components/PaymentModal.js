'use client';

import { useState, useEffect } from 'react';
import { paymentAPI } from '@/utils/api';
import StripeProvider from './StripeProvider';
import CardPaymentForm from './CardPaymentForm';

/**
 * PaymentModal Component
 * Modal for selecting payment method (Wallet or Card) and processing payment
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - called when modal closes
 * - eventId: string - ID of the event being paid for
 * - registrationId: string - ID of the registration
 * - amount: number - payment amount
 * - eventName: string - name of the event
 * - eventType: string - 'workshop' or 'trip'
 */
export default function PaymentModal({
  isOpen,
  onClose,
  eventId,
  registrationId,
  amount,
  eventName,
  eventType,
  onPaymentSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState(null); // null, 'wallet', 'card'
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    try {
      const response = await paymentAPI.getWalletBalance();
      setWalletBalance(response.wallet?.balance || 0);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    }
  };

  const handleWalletPayment = async () => {
    if (walletBalance < amount) {
      setError(`Insufficient balance. You have $${walletBalance.toFixed(2)}, but need $${amount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await paymentAPI.payWithWallet(eventId, registrationId);
      
      if (response.success) {
        if (onPaymentSuccess) {
          onPaymentSuccess(response.payment);
        }
        alert('Payment successful! ✓');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentSetup = async () => {
    // Check if Stripe is configured
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setError('⚠️ Stripe is not configured. Card payments are unavailable. Please use wallet payment or contact support.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await paymentAPI.createStripeIntent(eventId, registrationId);
      
      console.log('Stripe intent response:', response);
      
      if (response.client_secret) {
        setClientSecret(response.client_secret);
        setPaymentId(response.payment_id);
        setPaymentMethod('card');
      } else {
        setError('Failed to initialize card payment: ' + (response.message || 'No client secret received'));
      }
    } catch (err) {
      console.error('Card payment setup error:', err);
      setError(err.message || 'Failed to setup card payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentSuccess = async (paymentIntent) => {
    try {
      const response = await paymentAPI.confirmStripePayment(paymentId, paymentIntent.id);
      
      if (response.success) {
        if (onPaymentSuccess) {
          onPaymentSuccess(response.payment);
        }
        alert('Payment successful! ✓');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm payment');
    }
  };

  const resetModal = () => {
    setPaymentMethod(null);
    setClientSecret(null);
    setPaymentId(null);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Complete Payment</h2>
          <button onClick={handleClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          <div className="event-info">
            <h3>{eventName}</h3>
            <p className="event-type">{eventType === 'workshop' ? 'Workshop' : 'Trip'}</p>
            <p className="amount">Amount: <strong>${amount?.toFixed(2)}</strong></p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!paymentMethod && (
            <div className="payment-method-selection">
              <h3>Choose Payment Method</h3>
              
              <div className="wallet-option">
                <div className="wallet-info">
                  <span className="wallet-label">💳 Wallet Balance:</span>
                  <span className="wallet-balance">${walletBalance.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleWalletPayment}
                  disabled={loading || walletBalance < amount}
                  className="btn-wallet"
                >
                  {walletBalance < amount ? 'Insufficient Balance' : 'Pay with Wallet'}
                </button>
              </div>

              <div className="divider">
                <span>OR</span>
              </div>

              <button
                onClick={handleCardPaymentSetup}
                disabled={loading}
                className="btn-card"
              >
                💳 Pay with Credit/Debit Card
              </button>
            </div>
          )}

          {paymentMethod === 'card' && clientSecret && (
            <div className="card-payment-section">
              <button
                onClick={resetModal}
                className="back-btn"
              >
                ← Back to payment options
              </button>
              
              <StripeProvider clientSecret={clientSecret} amount={amount}>
                <CardPaymentForm
                  amount={amount}
                  onSuccess={handleCardPaymentSuccess}
                  onError={(err) => setError(err.message || 'Card payment failed')}
                  onCancel={resetModal}
                />
              </StripeProvider>
            </div>
          )}
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e5e5e5;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 24px;
            color: #1a1a1a;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 32px;
            color: #666;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            line-height: 1;
          }

          .close-btn:hover {
            color: #000;
          }

          .modal-body {
            padding: 20px;
          }

          .event-info {
            background-color: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
          }

          .event-info h3 {
            margin: 0 0 8px 0;
            color: #1a1a1a;
          }

          .event-type {
            color: #666;
            font-size: 14px;
            margin: 0 0 12px 0;
          }

          .amount {
            font-size: 18px;
            margin: 0;
            color: #1a1a1a;
          }

          .error-message {
            background-color: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            border: 1px solid #fcc;
          }

          .payment-method-selection {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .payment-method-selection h3 {
            margin: 0 0 16px 0;
            color: #1a1a1a;
            font-size: 18px;
          }

          .wallet-option {
            border: 2px solid #e5e5e5;
            border-radius: 8px;
            padding: 16px;
          }

          .wallet-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .wallet-label {
            font-size: 16px;
            color: #666;
          }

          .wallet-balance {
            font-size: 20px;
            font-weight: bold;
            color: #0070f3;
          }

          .btn-wallet, .btn-card {
            width: 100%;
            padding: 14px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-wallet {
            background-color: #10b981;
            color: white;
          }

          .btn-wallet:hover:not(:disabled) {
            background-color: #059669;
          }

          .btn-wallet:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          .btn-card {
            background-color: #0070f3;
            color: white;
          }

          .btn-card:hover:not(:disabled) {
            background-color: #0051cc;
          }

          .divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: #999;
            margin: 8px 0;
          }

          .divider::before,
          .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #e5e5e5;
          }

          .divider span {
            padding: 0 10px;
            font-weight: 600;
          }

          .card-payment-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .back-btn {
            background: none;
            border: none;
            color: #0070f3;
            cursor: pointer;
            font-size: 14px;
            padding: 8px 0;
            text-align: left;
          }

          .back-btn:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    </div>
  );
}
