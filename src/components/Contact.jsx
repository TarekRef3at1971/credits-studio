import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '3rem' }}>
          <h2 style={{ fontSize: '2rem' }}>Get in <span className="cinematic-text">Touch</span></h2>
          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '50%' }}>
                <Mail size={20} color="var(--accent-gold)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Email Us</div>
                <div style={{ fontSize: '1.1rem' }}>studio@creditsstudio.com</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '50%' }}>
                <Phone size={20} color="var(--accent-gold)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Call Us</div>
                <div style={{ fontSize: '1.1rem' }}>+1 (555) CINEMA-0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
