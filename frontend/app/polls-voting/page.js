'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pollAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function PollsVotingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState({}); // Track which votes are being processed

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const userData = getUser();
      if (userData) {
        setUser(userData);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isClient && user) {
      fetchPolls();
    }
  }, [isClient, user]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await pollAPI.getPollsForVoting();
      setPolls(response.polls || []);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError(err.response?.data?.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, applicationId) => {
    const key = `${pollId}-${applicationId}`;
    setVoting(prev => ({ ...prev, [key]: true }));

    try {
      const response = await pollAPI.voteForApplication(pollId, applicationId);
      // Update the poll in state
      setPolls(prevPolls => prevPolls.map(poll => {
        if (poll._id === pollId) {
          return {
            ...poll,
            applications: poll.applications.map(app => {
              if (app._id === applicationId) {
                return {
                  ...app,
                  vote_count: response.vote_count,
                  has_voted: true
                };
              }
              return app;
            })
          };
        }
        return poll;
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit vote');
    } finally {
      setVoting(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveVote = async (pollId, applicationId) => {
    const key = `${pollId}-${applicationId}`;
    setVoting(prev => ({ ...prev, [key]: true }));

    try {
      const response = await pollAPI.removeVote(pollId, applicationId);
      // Update the poll in state
      setPolls(prevPolls => prevPolls.map(poll => {
        if (poll._id === pollId) {
          return {
            ...poll,
            applications: poll.applications.map(app => {
              if (app._id === applicationId) {
                return {
                  ...app,
                  vote_count: response.vote_count,
                  has_voted: false
                };
              }
              return app;
            })
          };
        }
        return poll;
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove vote');
    } finally {
      setVoting(prev => ({ ...prev, [key]: false }));
    }
  };

  const getRoleDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'Student': return '/student';
      case 'Staff': return '/staff';
      case 'TA': return '/ta';
      case 'Professor': return '/professor';
      default: return '/';
    }
  };

  const getRoleSidebarLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'Student':
        return [
          { href: '/student', label: '🏠 Dashboard' },
          { href: '/student/events', label: '📅 Events' },
          { href: '/polls-voting', label: '📊 Vote for Vendors', active: true },
          { href: '/loyalty-program', label: '🎁 Loyalty Program' }
        ];
      case 'Staff':
        return [
          { href: '/staff', label: '🏠 Dashboard' },
          { href: '/staff/events', label: '📅 Events' },
          { href: '/polls-voting', label: '📊 Vote for Vendors', active: true },
          { href: '/loyalty-program', label: '🎁 Loyalty Program' }
        ];
      case 'TA':
        return [
          { href: '/ta', label: '🏠 Dashboard' },
          { href: '/ta/events', label: '📅 Events' },
          { href: '/polls-voting', label: '📊 Vote for Vendors', active: true },
          { href: '/loyalty-program', label: '🎁 Loyalty Program' }
        ];
      case 'Professor':
        return [
          { href: '/professor', label: '🏠 Dashboard' },
          { href: '/professor/events', label: '📅 Events' },
          { href: '/polls-voting', label: '📊 Vote for Vendors', active: true },
          { href: '/loyalty-program', label: '🎁 Loyalty Program' }
        ];
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };

  if (!isClient || !user) {
    return <div>Loading...</div>;
  }

  const sidebarLinks = getRoleSidebarLinks();

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
          <h1>Vote for Vendors 📊</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Help decide which vendors should set up booths in the platform. Vote for your favorite vendors!
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

          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
              Loading polls...
            </div>
          ) : polls.length === 0 ? (
            <div className="empty-state">
              <p>📊 No open polls available for voting at the moment</p>
              <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                Polls need to be opened by Events Office and have an active application deadline to appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {polls.map((poll) => {
                const deadlinePassed = isDeadlinePassed(poll.application_deadline);
                const sortedApplications = [...poll.applications].sort((a, b) => b.vote_count - a.vote_count);

                return (
                  <section key={poll._id} className="section">
                    <div style={{
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      marginBottom: '1.5rem'
                    }}>
                      <h2 style={{ margin: '0 0 0.5rem 0' }}>{poll.title}</h2>
                      <p style={{ margin: '0.5rem 0', opacity: 0.9 }}>{poll.description}</p>
                      <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Duration:</strong> {formatDate(poll.start_date)} - {formatDate(poll.end_date)}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Voting Deadline:</strong> 
                          <span style={{ 
                            fontWeight: deadlinePassed ? 'bold' : 'normal',
                            textDecoration: deadlinePassed ? 'line-through' : 'none'
                          }}>
                            {' '}{formatDate(poll.application_deadline)}
                            {deadlinePassed && ' (Passed)'}
                          </span>
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Vendors to Select:</strong> {poll.max_vendors} • 
                          <strong> Applications:</strong> {poll.total_applications}
                        </p>
                      </div>
                    </div>

                    {deadlinePassed ? (
                      <div style={{
                        padding: '1rem',
                        background: '#fff3cd',
                        borderRadius: '8px',
                        border: '1px solid #ffc107',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: 0, color: '#856404', fontWeight: '600' }}>
                          ⏰ Voting deadline has passed
                        </p>
                      </div>
                    ) : sortedApplications.length === 0 ? (
                      <div className="empty-state" style={{
                        padding: '2rem',
                        textAlign: 'center',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '2px dashed #ddd'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontWeight: '600' }}>
                          ⏳ No vendor applications yet
                        </p>
                        <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>
                          Vendors can still apply. Check back later to vote!
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '1.5rem'
                      }}>
                        {sortedApplications.map((app) => {
                          const voteKey = `${poll._id}-${app._id}`;
                          const isVoting = voting[voteKey];

                          return (
                            <div
                              key={app._id}
                              style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: app.has_voted ? '2px solid #28a745' : '2px solid #e0e0e0',
                                transition: 'transform 0.2s, box-shadow 0.2s'
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#333' }}>
                                    {app.business_name}
                                  </h3>
                                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                                    {app.vendor.name}
                                  </p>
                                  {app.business_type && (
                                    <p style={{ margin: '0.25rem 0', color: '#999', fontSize: '0.85rem' }}>
                                      {app.business_type}
                                    </p>
                                  )}
                                </div>
                                <div style={{
                                  padding: '0.5rem 1rem',
                                  background: app.has_voted ? '#28a745' : '#007bff',
                                  color: 'white',
                                  borderRadius: '20px',
                                  fontWeight: 'bold',
                                  fontSize: '1.1rem',
                                  textAlign: 'center',
                                  minWidth: '60px'
                                }}>
                                  {app.vote_count}
                                </div>
                              </div>

                              <p style={{ 
                                color: '#666', 
                                marginBottom: '1rem', 
                                fontSize: '0.9rem',
                                lineHeight: '1.6'
                              }}>
                                {app.business_description}
                              </p>

                              <div style={{ marginBottom: '1rem' }}>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                                  <strong>Products:</strong> {app.products_offered}
                                </p>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                                  <strong>Booth Size:</strong> {app.preferred_booth_size}
                                </p>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {app.has_voted ? (
                                  <button
                                    onClick={() => handleRemoveVote(poll._id, app._id)}
                                    disabled={isVoting || deadlinePassed}
                                    style={{
                                      flex: 1,
                                      padding: '0.75rem',
                                      background: isVoting || deadlinePassed ? '#ccc' : '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: isVoting || deadlinePassed ? 'not-allowed' : 'pointer',
                                      fontWeight: '600',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    {isVoting ? 'Removing...' : '✓ Remove Vote'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleVote(poll._id, app._id)}
                                    disabled={isVoting || deadlinePassed}
                                    style={{
                                      flex: 1,
                                      padding: '0.75rem',
                                      background: isVoting || deadlinePassed ? '#ccc' : '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: isVoting || deadlinePassed ? 'not-allowed' : 'pointer',
                                      fontWeight: '600',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    {isVoting ? 'Voting...' : '👍 Vote'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

