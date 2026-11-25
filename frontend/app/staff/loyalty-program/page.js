'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import StaffLayout from '@/app/components/StaffLayout';
import '@/app/dashboard.css';

export default function StaffLoyaltyProgramPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loyalty/partners', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffLayout>
      <h1>GUC Loyalty Program 🎁</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Enjoy exclusive discounts from our partner vendors as a staff member!
      </p>

      <section className="section">
        {loading ? (
          <div className="loading">Loading partners...</div>
        ) : partners.length === 0 ? (
          <div className="empty-state">
            <p>🎁 No loyalty partners available yet</p>
          </div>
        ) : (
          <div className="admin-grid">
            {partners.map((partner) => (
              <div key={partner._id} className="admin-card">
                <div className="card-header">
                  <h3>{partner.vendor_name}</h3>
                  <span className={`status ${partner.is_active ? 'active' : 'inactive'}`}>
                    {partner.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div className="card-content">
                  <p><strong>Discount:</strong> {partner.discount_percentage}% off</p>
                  {partner.discount_details && (
                    <p><strong>Details:</strong> {partner.discount_details}</p>
                  )}
                  {partner.terms_conditions && (
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                      <strong>Terms:</strong> {partner.terms_conditions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </StaffLayout>
  );
}
