import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import CreditsEngine from './components/CreditsEngine';
import BeginningCredits from './components/BeginningCredits';
import Contact from './components/Contact';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      
      {/* Portfolio Placeholder Section */}
      <section id="portfolio" className="section-padding" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Selected <span className="cinematic-text">Works</span></h2>
          <div style={{ 
            height: '400px', 
            background: 'linear-gradient(45deg, #0a0a0c, #1a1a1f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--accent-gold)',
            opacity: 0.5
          }}>
            <p style={{ letterSpacing: '0.5em', textTransform: 'uppercase' }}>Portfolio Gallery Coming Soon</p>
          </div>
        </div>
      </section>

      <Contact />

      {/* Footer */}
      <footer style={{ padding: '4rem 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', letterSpacing: '0.2em' }}>
            © {new Date().getFullYear()} CREDITS STUDIO. ALL RIGHTS RESERVED.
          </p>
          <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--accent-gold)' }}>
            "The end is just the beginning."
          </p>
        </div>
      </footer>
    </>
  );
}

function SafeNavigationLink({ to, children }) {
  const [showWarning, React_useState] = React.useState(false);
  const navigate = useNavigate();

  const handleNavigate = () => {
    React_useState(false);
    navigate(to);
  };

  return (
    <>
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); React_useState(true); }}
        style={{ color: 'var(--accent-silver)', textDecoration: 'none', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}
      >
        {children}
      </a>
      {showWarning && createPortal(
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999
        }}>
          <div style={{ background: '#2a0000', border: '2px solid #ff4444', padding: '3rem 2rem', borderRadius: '12px', width: '450px', textAlign: 'center', boxShadow: '0 0 50px rgba(255,0,0,0.6)' }}>
            <h3 style={{ color: '#ff4444', fontSize: '1.8rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900' }}>STOP! UNSAVED WORK</h3>
            <p style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem', lineHeight: '1.5' }}>
              If you leave this page now, <strong>ALL your current unsaved progress will be permanently lost!</strong>
            </p>
            <p style={{ color: 'var(--accent-gold)', marginBottom: '2.5rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Please close this warning and use the save tools before leaving.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => React_useState(false)} style={{ flex: 1, padding: '1rem', background: '#ff4444', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase' }}>STAY & SAVE WORK</button>
              <button onClick={handleNavigate} style={{ padding: '1rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Leave Anyway</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project" element={
            <>
              <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                <div className="container">
                  <SafeNavigationLink to="/dashboard">
                    &larr; Back to Dashboard
                  </SafeNavigationLink>
                </div>
              </div>
              <CreditsEngine />
            </>
          } />
          <Route path="/opening-titles" element={
            <>
              <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                <div className="container">
                  <SafeNavigationLink to="/dashboard">
                    &larr; Back to Dashboard
                  </SafeNavigationLink>
                </div>
              </div>
              <BeginningCredits />
            </>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
