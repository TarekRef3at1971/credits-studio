import React from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '1.5rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={24} color="var(--accent-gold)" />
          <span style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: '1.2rem', 
            letterSpacing: '0.2em',
            fontWeight: 700 
          }}>
            CREDITS <span style={{ color: 'var(--accent-gold)' }}>STUDIO</span>
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
          {['Services', 'Portfolio', 'Contact'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                fontWeight: 600,
                transition: 'var(--transition-smooth)',
                opacity: 0.8
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--accent-gold)';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.opacity = '0.8';
              }}
            >
              {item}
            </a>
          ))}
          <Link 
            to="/auth" 
            className="glass"
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--accent-gold)';
                e.currentTarget.style.color = 'black';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--accent-gold)';
            }}
          >
            Access Studio
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
