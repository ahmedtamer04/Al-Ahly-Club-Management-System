import Link from 'next/link';
import Image from 'next/image';
import './landing.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">
            <h1>GUC Events</h1>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#events">Events</a></li>
            <li><a href="#about">About</a></li>
            <li><Link href="/auth/login" className="btn-login">Login</Link></li>
            <li><Link href="/auth/register" className="btn-register">Register</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Discover Amazing
              <span className="highlight"> University Events</span>
            </h1>
            <p className="hero-subtitle">
              Join workshops, trips, conferences, and bazaars organized by the German University in Cairo
            </p>
            <div className="hero-buttons">
              <Link href="/auth/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link href="#events" className="btn btn-secondary">
                Explore Events
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <h3>500+</h3>
                <p>Events Hosted</p>
              </div>
              <div className="stat">
                <h3>10K+</h3>
                <p>Students Participated</p>
              </div>
              <div className="stat">
                <h3>50+</h3>
                <p>Vendor Partners</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose GUC Events?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Academic Workshops</h3>
              <p>Learn from industry experts and professors in cutting-edge topics</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚌</div>
              <h3>Exciting Trips</h3>
              <p>Explore Egypt's rich history and beautiful destinations with classmates</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎪</div>
              <h3>Campus Bazaars</h3>
              <p>Discover unique products from local vendors and student entrepreneurs</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Tech Conferences</h3>
              <p>Network with professionals and stay updated on industry trends</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Easy Registration</h3>
              <p>Simple, fast event registration with instant confirmation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Real-time Updates</h3>
              <p>Get notified about new events and registration deadlines</p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Showcase */}
      <section id="events" className="events-showcase">
        <div className="container">
          <h2 className="section-title">Upcoming Events</h2>
          <div className="events-grid">
            <div className="event-card">
              <div className="event-badge">Workshop</div>
              <h3>React Development Masterclass</h3>
              <p className="event-date">📅 December 20, 2025</p>
              <p className="event-location">📍 Computer Lab 2</p>
              <p className="event-description">
                Learn advanced React patterns, hooks, and state management
              </p>
              <div className="event-footer">
                <span className="event-price">Free</span>
                <Link href="/auth/register" className="btn-link">Register →</Link>
              </div>
            </div>

            <div className="event-card">
              <div className="event-badge">Trip</div>
              <h3>Luxor Historical Adventure</h3>
              <p className="event-date">📅 December 25-27, 2025</p>
              <p className="event-location">📍 Luxor, Egypt</p>
              <p className="event-description">
                3-day trip to explore temples and Valley of the Kings
              </p>
              <div className="event-footer">
                <span className="event-price">750 EGP</span>
                <Link href="/auth/register" className="btn-link">Register →</Link>
              </div>
            </div>

            <div className="event-card">
              <div className="event-badge">Conference</div>
              <h3>AI & Blockchain Summit</h3>
              <p className="event-date">📅 January 5-7, 2026</p>
              <p className="event-location">📍 Conference Center</p>
              <p className="event-description">
                International summit on emerging technologies
              </p>
              <div className="event-footer">
                <span className="event-price">200 EGP</span>
                <Link href="/auth/register" className="btn-link">Register →</Link>
              </div>
            </div>

            <div className="event-card">
              <div className="event-badge">Bazaar</div>
              <h3>Spring Artisan Bazaar</h3>
              <p className="event-date">📅 December 28-29, 2025</p>
              <p className="event-location">📍 GUC Plaza</p>
              <p className="event-description">
                Local vendors, food, crafts, and student businesses
              </p>
              <div className="event-footer">
                <span className="event-price">Free Entry</span>
                <Link href="/auth/register" className="btn-link">Visit →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About GUC Events</h2>
              <p>
                The German University in Cairo Events Platform is your gateway to 
                academic excellence, cultural experiences, and professional networking.
              </p>
              <p>
                We organize workshops, educational trips, conferences, and campus bazaars 
                that enrich student life and foster community engagement.
              </p>
              <ul className="about-list">
                <li>✓ 500+ events organized annually</li>
                <li>✓ 10,000+ active participants</li>
                <li>✓ 50+ vendor partnerships</li>
                <li>✓ Seamless registration process</li>
              </ul>
            </div>
            <div className="about-image">
              <div className="image-placeholder">
                <h3>🎓</h3>
                <p>GUC Events Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Join?</h2>
          <p>Start exploring amazing events and experiences today</p>
          <div className="cta-buttons">
            <Link href="/auth/register" className="btn btn-primary">
              Create Account
            </Link>
            <Link href="/auth/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>GUC Events</h4>
              <p>German University in Cairo</p>
              <p>Events Management Platform</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/auth/login">Login</Link></li>
                <li><Link href="/auth/register">Register</Link></li>
                <li><a href="#events">Events</a></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: events@guc.edu.eg</p>
              <p>Phone: +20 123 456 7890</p>
              <p>Location: New Cairo, Egypt</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 GUC Events. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
