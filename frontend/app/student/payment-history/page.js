'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymentAPI } from '@/utils/api';
import StudentLayout from '@/app/components/StudentLayout';
import '@/app/dashboard.css';

/**
 * PaymentHistory Page
 * Displays user's payment history and wallet transactions
 * Can be accessed by Student, Staff, TA, and Professor roles
 */
export default function PaymentHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'transactions'
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'payments') {
        const response = await paymentAPI.getPaymentHistory();
        setPayments(response.payments || []);
      } else {
        const response = await paymentAPI.getWalletTransactions();
        setTransactions(response.transactions || []);
        // Get current wallet balance from API (includes all refunds)
        const balanceResponse = await paymentAPI.getWalletBalance();
        setWalletBalance(balanceResponse.wallet?.balance || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: '#10b981',
      pending: '#f59e0b',
      failed: '#ef4444',
      refunded: '#6b7280',
    };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: statusColors[status] || '#6b7280' }}
      >
        {status}
      </span>
    );
  };

  const getTransactionTypeBadge = (type) => {
    const typeColors = {
      credit: '#10b981',
      debit: '#ef4444',
      payment: '#0070f3',
      refund: '#10b981',
      'top-up': '#8b5cf6',
    };

    const typeEmojis = {
      credit: '💰',
      debit: '💸',
      payment: '💳',
      refund: '↩️',
      'top-up': '➕',
    };

    return (
      <span
        className="transaction-type-badge"
        style={{ backgroundColor: typeColors[type] || '#6b7280' }}
      >
        {typeEmojis[type] || ''} {type}
      </span>
    );
  };

  return (
    <StudentLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <button onClick={() => router.back()} className="back-button">
            ← Back
          </button>
          <h1>💰 Payment History</h1>
          <p>View your payment history and wallet transactions</p>
        </div>

            <div className="tabs">
        <button
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Payment History
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💰 Wallet Transactions
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="wallet-balance-card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>💰 Current Wallet Balance</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${walletBalance.toFixed(2)}</div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading {activeTab}...</p>
        </div>
      ) : (
        <>
          {activeTab === 'payments' && (
            <div className="payments-section">
              {payments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <h3>No Payments Yet</h3>
                  <p>Your payment history will appear here</p>
                </div>
              ) : (
                <div className="payments-grid">
                  {payments.map((payment) => (
                    <div key={payment._id} className="payment-card">
                      <div className="payment-header">
                        <div className="payment-event">
                          <h3>{payment.event_id?.name || 'Event'}</h3>
                          <span className="event-type">
                            {payment.event_id?.type || 'N/A'}
                          </span>
                        </div>
                        {getStatusBadge(payment.payment_status)}
                      </div>

                      <div className="payment-details">
                        <div className="payment-row">
                          <span className="label">Amount:</span>
                          <span className="value amount">
                            ${payment.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>

                        <div className="payment-row">
                          <span className="label">Method:</span>
                          <span className="value">
                            {payment.payment_method === 'wallet' ? '💰 Wallet' : '💳 Card'}
                          </span>
                        </div>

                        <div className="payment-row">
                          <span className="label">Date:</span>
                          <span className="value">{formatDate(payment.paid_at)}</span>
                        </div>

                        {payment.stripe_payment_intent_id && (
                          <div className="payment-row">
                            <span className="label">Transaction ID:</span>
                            <span className="value transaction-id">
                              {payment.stripe_payment_intent_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="transactions-section">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <h3>No Transactions Yet</h3>
                  <p>Your wallet transactions will appear here</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map((transaction, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-left">
                        {getTransactionTypeBadge(transaction.type)}
                        <div className="transaction-info">
                          <div className="transaction-description">
                            {transaction.description || 'Transaction'}
                          </div>
                          <div className="transaction-date">
                            {formatDate(transaction.timestamp)}
                          </div>
                        </div>
                      </div>

                      <div className="transaction-right">
                        <span
                          className={`transaction-amount ${
                            transaction.type === 'credit' || transaction.type === 'top-up' || transaction.type === 'refund'
                              ? 'positive'
                              : 'negative'
                          }`}
                        >
                          {transaction.type === 'credit' || transaction.type === 'top-up' || transaction.type === 'refund'
                            ? '+'
                            : '-'}
                          ${transaction.amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .back-button {
          background: none;
          border: none;
          color: #0070f3;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          margin-bottom: 16px;
          border-radius: 8px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .back-button:hover {
          background-color: #f0f7ff;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e5e5;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #0070f3;
        }

        .tab.active {
          color: #0070f3;
          border-bottom-color: #0070f3;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #fcc;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0070f3;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .empty-state p {
          margin: 0;
          color: #999;
        }

        .payments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .payment-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
        }

        .payment-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .payment-event h3 {
          margin: 0 0 4px 0;
          color: #1a1a1a;
          font-size: 18px;
        }

        .event-type {
          display: inline-block;
          padding: 2px 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          text-transform: capitalize;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .payment-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .payment-row .label {
          color: #666;
          font-size: 14px;
        }

        .payment-row .value {
          color: #1a1a1a;
          font-weight: 500;
        }

        .payment-row .value.amount {
          font-size: 20px;
          font-weight: bold;
          color: #0070f3;
        }

        .transaction-id {
          font-family: monospace;
          font-size: 12px;
          color: #666;
        }

        .transactions-list {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .transaction-item:last-child {
          border-bottom: none;
        }

        .transaction-item:hover {
          background-color: #f8f9fa;
        }

        .transaction-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .transaction-type-badge {
          padding: 6px 12px;
          border-radius: 8px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .transaction-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .transaction-description {
          color: #1a1a1a;
          font-weight: 500;
        }

        .transaction-date {
          color: #999;
          font-size: 13px;
        }

        .transaction-right {
          text-align: right;
        }

        .transaction-amount {
          font-size: 18px;
          font-weight: bold;
        }

        .transaction-amount.positive {
          color: #10b981;
        }

        .transaction-amount.negative {
          color: #ef4444;
        }
      `}</style>
      </div>
    </StudentLayout>
  );
}
