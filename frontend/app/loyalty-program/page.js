'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loyaltyProgramAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function LoyaltyProgramVendorsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'discount', 'name'

  // Load user data on client side only
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = getUser();
      if (userData) {
        setUser(userData);
      } else {
        // Redirect to login if not authenticated
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isClient && user) {
      fetchVendors();
    }
  }, [isClient, user]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await loyaltyProgramAPI.getAllLoyaltyVendors();
      setVendors(response.vendors || []);
    } catch (err) {
      console.error('Error fetching loyalty vendors:', err);
      setError(err.response?.data?.message || 'Failed to load loyalty program vendors');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'Student': return '/student';
      case 'Staff': return '/staff';
      case 'TA': return '/staff';
      case 'Professor': return '/staff';
      case 'EventsOffice': return '/eventsoffice';
      case 'Admin': return '/admin';
      default: return '/';
    }
  };

  const getRoleSidebarLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'Student':
        return [
          { href: '/student', label: '🏠 Dashboard' },
          { href: '/student/events', label: '📅 Browse Events' },
          { href: '/student/favorites', label: '⭐ My Favorites' },
          { href: '/student/my-registrations', label: '🎫 My Registrations' },
          { href: '/student/payment-history', label: '💰 Payment History' },
          { href: '/polls-voting', label: '📊 Vote for Vendors' },
          { href: '/loyalty-program', label: '🎁 Loyalty Program', active: true },
          { href: '/student/facilities', label: '🏢 Facilities' },
          { href: '/student/gym/schedule', label: '💪 Gym Schedule' },
          { href: '/student/profile', label: '👤 Profile' }
        ];
      case 'Staff':
        return [
          { href: '/staff', label: '🏠 Dashboard' },
          { href: '/staff/events', label: '📅 Events' },
          { href: '/staff/favorites', label: '⭐ My Favorites' },
          { href: '/staff/payment-history', label: '💰 Payment History' },
          { href: '/polls-voting', label: '📊 Vote for Vendors' },
          { href: '/loyalty-program', label: '🎁 Loyalty Program', active: true },
          { href: '/staff/gym/schedule', label: '💪 Gym Schedule' },
          { href: '/staff/profile', label: '👤 Profile' }
        ];
      case 'TA':
        return [
          { href: '/ta', label: '🏠 Dashboard' },
          { href: '/ta/events', label: '📅 Browse Events' },
          { href: '/ta/favorites', label: '⭐ My Favorites' },
          { href: '/ta/my-events', label: '✏️ My Events' },
          { href: '/ta/payment-history', label: '💰 Payment History' },
          { href: '/polls-voting', label: '📊 Vote for Vendors' },
          { href: '/loyalty-program', label: '🎁 Loyalty Program', active: true },
          { href: '/ta/gym', label: '💪 Gym Schedule' },
          { href: '/ta/profile', label: '👤 Profile' }
        ];
      case 'Professor':
        return [
          { href: '/professor', label: '🏠 Dashboard' },
          { href: '/professor/events', label: '📅 Events' },
          { href: '/professor/favorites', label: '⭐ My Favorites' },
          { href: '/professor/workshops', label: '🎨 My Workshops' },
          { href: '/professor/payment-history', label: '💰 Payment History' },
          { href: '/polls-voting', label: '📊 Vote for Vendors' },
          { href: '/loyalty-program', label: '🎁 Loyalty Program', active: true },
          { href: '/professor/gym', label: '💪 Gym Schedule' },
          { href: '/professor/profile', label: '👤 Profile' }
        ];
      case 'EventsOffice':
        return [
          { href: '/eventsoffice', label: '🏠 Dashboard' },
          { href: '/eventsoffice/events', label: '📅 Events' },
          { href: '/loyalty-program', label: '🎁 Loyalty Program', active: true }
        ];
      case 'Admin':
        return [
          { href: '/admin', label: '🏠 Dashboard' },
          { href: '/admin/vendor-requests', label: '👥 Vendor Requests' },
          { href: '/loyalty-program', label: '🎁 Loyalty Program', active: true }
        ];
      default:
        return [];
    }
  };

  const filteredAndSortedVendors = () => {
    let filtered = vendors;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.vendor.name.toLowerCase().includes(term) ||
        vendor.vendor.company_name?.toLowerCase().includes(term) ||
        vendor.promo_code.toLowerCase().includes(term)
      );
    }

    // Sort
    switch (sortBy) {
      case 'discount':
        return [...filtered].sort((a, b) => b.discount_rate - a.discount_rate);
      case 'name':
        return [...filtered].sort((a, b) => 
          (a.vendor.name || '').localeCompare(b.vendor.name || '')
        );
      case 'recent':
      default:
        return [...filtered].sort((a, b) => 
          new Date(b.approved_at || b.created_at) - new Date(a.approved_at || a.created_at)
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isClient || !user) {
    return <div>Loading...</div>;
  }

  const sidebarLinks = getRoleSidebarLinks();
  const displayVendors = filteredAndSortedVendors();

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">
              {user.role === 'Student' && '🎓'} 
              {user.role === 'Staff' && '👔'} 
              {user.role === 'TA' && '👨‍🏫'} 
              {user.role === 'Professor' && '👨‍🏫'} 
              {user.role === 'EventsOffice' && '📋'} 
              {user.role === 'Admin' && '👑'} 
              {' '}
              {user.first_name} {user.last_name}
            </span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            {sidebarLinks.map((link, idx) => (
              <li key={idx}>
                <Link 
                  href={link.href} 
                  className={link.active ? 'active' : ''}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="main-content">
          <h1>GUC Loyalty Program 🎁</h1>
          <p style={{color: '#666', marginBottom: '2rem'}}>
            View all vendors participating in the GUC Loyalty Program and their exclusive discounts for GUC community members.
          </p>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fee',
              color: '#dc3545',
              borderRadius: '8px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}

          {/* Search and Filter */}
          <section className="section" style={{marginBottom: '2rem'}}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{flex: '1', minWidth: '250px'}}>
                <input
                  type="text"
                  placeholder="🔍 Search by vendor name, company, or promo code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="recent">Sort by: Most Recent</option>
                  <option value="discount">Sort by: Highest Discount</option>
                  <option value="name">Sort by: Vendor Name</option>
                </select>
              </div>
            </div>
          </section>

          {/* Vendors List */}
          {loading ? (
            <div className="loading" style={{textAlign: 'center', padding: '3rem'}}>
              Loading loyalty program vendors...
            </div>
          ) : displayVendors.length === 0 ? (
            <div className="empty-state">
              <p>
                {searchTerm 
                  ? '🔍 No vendors found matching your search' 
                  : '🎁 No vendors are currently participating in the loyalty program'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-secondary"
                  style={{marginTop: '1rem'}}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <section className="section">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {displayVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '2px solid #e0e0e0',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Vendor Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '2px solid #f0f0f0'
                    }}>
                      <div>
                        <h3 style={{
                          margin: '0 0 0.25rem 0',
                          color: '#333',
                          fontSize: '1.25rem'
                        }}>
                          {vendor.vendor.name}
                        </h3>
                        {vendor.vendor.company_name && (
                          <p style={{
                            margin: 0,
                            color: '#666',
                            fontSize: '0.9rem'
                          }}>
                            {vendor.vendor.company_name}
                          </p>
                        )}
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        textAlign: 'center'
                      }}>
                        {vendor.discount_rate}% OFF
                      </div>
                    </div>

                    {/* Promo Code */}
                    <div style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: '#e3f2fd',
                      borderRadius: '8px',
                      border: '2px dashed #1976d2'
                    }}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Promo Code:
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        color: '#1976d2',
                        letterSpacing: '2px'
                      }}>
                        {vendor.promo_code}
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div style={{marginBottom: '1rem'}}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Terms & Conditions:
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#333',
                        lineHeight: '1.6',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {vendor.terms_and_conditions}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#999',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      Approved: {formatDate(vendor.approved_at)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.25rem'}}>
                  🎁 {displayVendors.length} Vendor{displayVendors.length !== 1 ? 's' : ''} Participating
                </h3>
                <p style={{margin: 0, opacity: 0.9}}>
                  Use the promo codes above to enjoy exclusive discounts at these vendors!
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

