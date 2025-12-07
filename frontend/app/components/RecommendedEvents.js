"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { recommendationAPI } from '@/utils/api';

export default function RecommendedEvents({ refreshTrigger }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  // Auto-refresh when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - refreshing recommendations');
      fetchRecommendations();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing recommendations');
      fetchRecommendations();
    }, 30 * 1000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await recommendationAPI.getRecommendations();
      console.log('Recommendations data:', data);
      
      // Filter out invalid recommendations (missing _id or required fields)
      const validRecommendations = (data.recommendations || []).filter(item => {
        if (!item._id) {
          console.warn('Skipping recommendation without _id:', item);
          return false;
        }
        if (item.item_type === 'event' && !item.name) {
          console.warn('Skipping event without name:', item);
          return false;
        }
        if (item.item_type === 'gym' && !item.type) {
          console.warn('Skipping gym session without type:', item);
          return false;
        }
        return true;
      });
      
      console.log('Valid recommendations:', validRecommendations);
      setRecommendations(validRecommendations);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getItemIcon = (item) => {
    if (item.item_type === 'gym') {
      return '💪';
    }
    const icons = {
      'Workshop': '🎓',
      'Trip': '✈️',
      'Bazaar': '🛍️',
      'Booth': '🏪',
      'Conference': '📊'
    };
    return icons[item.type] || '📅';
  };

  const getItemTitle = (item) => {
    if (item.item_type === 'gym') {
      return item.type; // Gym type like "Yoga", "Pilates"
    }
    return item.name;
  };

  const getItemDate = (item) => {
    if (item.item_type === 'gym') {
      return formatDate(item.date);
    }
    return formatDate(item.start_date);
  };

  const getItemLocation = (item) => {
    if (item.item_type === 'gym') {
      return 'Gym';
    }
    return item.location;
  };

  const getItemLink = (item) => {
    if (item.item_type === 'gym') {
      return `/student/gym`;
    }
    return `/student/events/${item._id}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>✨ Recommended for You</h2>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading recommendations...
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Recommendations error:', error);
    return null;
  }

  if (recommendations.length === 0) {
    // Show a helpful message instead of hiding completely
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>✨ Recommended for You</h2>
          <p style={styles.subtitle}>
            We'll show personalized recommendations once you start registering for events or gym sessions
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎯</span>
          <p style={{ color: '#666', marginBottom: '20px' }}>No recommendations yet</p>
          <Link href="/student/events" style={styles.viewAllLink}>
            Browse All Events →
          </Link>
        </div>
      </div>
    );
  }

  // Check if these are personalized or random recommendations
  const hasPersonalization = recommendations.some(r => 
    r.recommendation_reasons && 
    r.recommendation_reasons.length > 0 && 
    !r.recommendation_reasons.includes('New events for you to explore')
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>✨ Recommended for You</h2>
        <p style={styles.subtitle}>
          {hasPersonalization 
            ? 'Events picked just for you based on your interests and activity'
            : 'Explore these events and gym sessions to get started'
          }
        </p>
      </div>

      <div style={styles.grid}>
        {recommendations.map((item) => (
          <Link 
            key={item._id} 
            href={getItemLink(item)}
            style={styles.cardLink}
          >
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.eventIcon}>{getItemIcon(item)}</span>
                <span style={{
                  ...styles.badge,
                  background: item.item_type === 'gym' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : getEventColor(item.type)
                }}>
                  {item.item_type === 'gym' ? 'Gym Session' : item.type}
                </span>
              </div>

              <h3 style={styles.eventName}>{getItemTitle(item)}</h3>

              <div style={styles.eventInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoIcon}>📍</span>
                  <span style={styles.infoText}>{getItemLocation(item)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoIcon}>📅</span>
                  <span style={styles.infoText}>{getItemDate(item)}</span>
                </div>
                {item.item_type === 'gym' && item.time && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoIcon}>⏰</span>
                    <span style={styles.infoText}>{item.time}</span>
                  </div>
                )}
              </div>

              {item.recommendation_reasons && item.recommendation_reasons.length > 0 && (
                <div style={styles.reasonsContainer}>
                  {item.recommendation_reasons.map((reason, index) => (
                    <div key={index} style={styles.reason}>
                      <span style={styles.reasonDot}>•</span>
                      <span style={styles.reasonText}>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.cardFooter}>
                <span style={styles.viewDetails}>View Details →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/student/events" style={styles.viewAllLink}>
          View All Events →
        </Link>
      </div>
    </div>
  );
}

function getEventColor(type) {
  const colors = {
    'Workshop': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'Trip': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'Bazaar': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'Booth': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'Conference': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  };
  return colors[type] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
}

const styles = {
  container: {
    margin: '0 0 40px 0',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#7f8c8d',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid transparent',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  eventIcon: {
    fontSize: '32px',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  eventName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 16px 0',
    lineHeight: '1.4',
  },
  eventInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoIcon: {
    fontSize: '14px',
  },
  infoText: {
    fontSize: '14px',
    color: '#555',
  },
  reasonsContainer: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  reason: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '6px',
  },
  reasonDot: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: '16px',
    lineHeight: '1.4',
  },
  reasonText: {
    fontSize: '13px',
    color: '#555',
    lineHeight: '1.4',
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #ecf0f1',
  },
  viewDetails: {
    fontSize: '14px',
    color: '#3498db',
    fontWeight: '600',
  },
  viewAllLink: {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'transform 0.2s',
  },
};
