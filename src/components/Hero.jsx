import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section style={{
      height: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url("/hero-bg.png") center/cover no-repeat'
    }}>
      {/* Overlay for cinematic feel */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(5,5,5,1) 90%)',
        zIndex: 1
      }} />

      {/* Credit Roll Animation Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        opacity: 0.15,
        pointerEvents: 'none'
      }}>
        <div className="credits-roll" style={{
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          fontSize: '0.9rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <div>Executive Producer <br/> <strong>AURUM PRODUCTIONS</strong></div>
          <div>Director <br/> <strong>THE VISIONARY</strong></div>
          <div>Screenplay <br/> <strong>WRITTEN BY LIGHT</strong></div>
          <div>Cinematography <br/> <strong>SHADOW & BOKEH</strong></div>
          <div>Edited by <br/> <strong>TIME ITSELF</strong></div>
          <div>Starring <br/> <strong>YOUR MASTERPIECE</strong></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)', 
            marginBottom: '1rem',
            textShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
          }}>
            YOUR TITLES FROM TEXT TO <span className="cinematic-text">ANIMATION</span> IN ONE CLICK
          </h1>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginBottom: '3rem',
            maxWidth: '800px',
            marginInline: 'auto',
            color: 'var(--text-secondary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontSize: '0.9rem'
          }}>
            <p>
              Every masterpiece deserves a perfect introduction and a timeless conclusion.
            </p>
            <p style={{ color: 'var(--accent-gold)' }}>
              All you have to do is color your titles and we do the rest in one click.
            </p>
            <p>
              You can either start here or in Microsoft Word, we handle the rest.
            </p>
            <p style={{ opacity: 0.8 }}>
              All adjustments are automatic, and readjustments take no time.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <Link to="/auth" className="btn-primary">START YOUR PRODUCTION</Link>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          color: 'var(--accent-gold)',
          opacity: 0.6
        }}
      >
        <div style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, var(--accent-gold), transparent)' }} />
      </motion.div>
    </section>
  );
};

export default Hero;
