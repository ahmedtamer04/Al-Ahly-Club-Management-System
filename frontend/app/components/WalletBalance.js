'use client';

import { useState, useEffect } from 'react';
import { paymentAPI } from '@/utils/api';

/**
 * WalletBalance Component
 * Displays user's wallet balance with option to top up
 * Can be used in dashboard or as standalone widget
 */
export default function WalletBalance({ compact = false }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.getWalletBalance();
      setWallet(response.wallet);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(topUpAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setTopUpError('Please enter a valid amount');
      return;
    }

    if (amount > 10000) {
      setTopUpError('Maximum top-up amount is $10,000');
      return;
    }

    setTopUpLoading(true);
    setTopUpError('');

    try {
      const response = await paymentAPI.topUpWallet(amount);
      
      if (response.success) {
        setWallet(response.wallet);
        setTopUpAmount('');
        setShowTopUp(false);
        alert(`Successfully added $${amount.toFixed(2)} to your wallet!`);
      }
    } catch (err) {
      setTopUpError(err.message || 'Failed to top up wallet');
    } finally {
      setTopUpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`wallet-balance ${compact ? 'compact' : ''}`}>
        <div className="loading">Loading wallet...</div>
        <style jsx>{`
          .wallet-balance {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: ${compact ? '16px' : '24px'};
            border-radius: 12px;
            color: white;
          }
          .loading {
            text-align: center;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`wallet-balance ${compact ? 'compact' : ''}`}>
      <div className="wallet-header">
        <div className="wallet-icon">💰</div>
        <div className="wallet-info">
          <div className="wallet-label">Wallet Balance</div>
          <div className="wallet-amount">
            ${wallet?.balance?.toFixed(2) || '0.00'}
            <span className="currency">{wallet?.currency || 'USD'}</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="wallet-actions">
          {!showTopUp ? (
            <button
              onClick={() => setShowTopUp(true)}
              className="btn-top-up"
            >
              + Add Funds
            </button>
          ) : (
            <form onSubmit={handleTopUp} className="top-up-form">
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.01"
                min="1"
                max="10000"
                className="top-up-input"
                disabled={topUpLoading}
              />
              
              <div className="top-up-actions">
                <button
                  type="submit"
                  disabled={topUpLoading}
                  className="btn-confirm"
                >
                  {topUpLoading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUp(false);
                    setTopUpAmount('');
                    setTopUpError('');
                  }}
                  disabled={topUpLoading}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>

              {topUpError && (
                <div className="error-message">{topUpError}</div>
              )}
            </form>
          )}
        </div>
      )}

      <style jsx>{`
        .wallet-balance {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: ${compact ? '16px' : '24px'};
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .wallet-balance.compact {
          min-width: 200px;
        }

        .wallet-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .wallet-icon {
          font-size: ${compact ? '32px' : '48px'};
          line-height: 1;
        }

        .wallet-info {
          flex: 1;
        }

        .wallet-label {
          font-size: ${compact ? '12px' : '14px'};
          opacity: 0.9;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .wallet-amount {
          font-size: ${compact ? '24px' : '32px'};
          font-weight: bold;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .currency {
          font-size: ${compact ? '14px' : '16px'};
          opacity: 0.8;
          font-weight: normal;
        }

        .wallet-actions {
          margin-top: 20px;
        }

        .btn-top-up {
          width: 100%;
          padding: 12px;
          background-color: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.4);
          color: white;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-top-up:hover {
          background-color: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.6);
        }

        .top-up-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .top-up-input {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .top-up-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .top-up-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.8);
          background-color: rgba(255, 255, 255, 0.3);
        }

        .top-up-actions {
          display: flex;
          gap: 8px;
        }

        .btn-confirm,
        .btn-cancel {
          flex: 1;
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-confirm {
          background-color: #10b981;
          border: none;
          color: white;
        }

        .btn-confirm:hover:not(:disabled) {
          background-color: #059669;
        }

        .btn-confirm:disabled {
          background-color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
        }

        .btn-cancel {
          background-color: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.4);
          color: white;
        }

        .btn-cancel:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .error-message {
          background-color: rgba(255, 100, 100, 0.3);
          color: white;
          padding: 8px;
          border-radius: 6px;
          font-size: 14px;
          border: 1px solid rgba(255, 100, 100, 0.5);
        }
      `}</style>
    </div>
  );
}
