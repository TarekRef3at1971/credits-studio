import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Play, Users, Layers } from 'lucide-react';

const services = [
  {
    icon: <Play size={32} />,
    title: "Beginning Credits",
    description: "Captivating title sequences that set the mood and tone of your project from the very first frame.",
    price: "From $299"
  },
  {
    icon: <FileText size={32} />,
    title: "End Credits Roll",
    description: "Professional, legally-compliant rolling credits with perfect pacing and elegant typography.",
    price: "From $199"
  },
  {
    icon: <Layers size={32} />,
    title: "Full Package",
    description: "Comprehensive credits management from opening titles to final frame, including legal review.",
    price: "Custom Quote"
  }
];

const Services = () => {
  return (
    <section id="services" className="section-padding">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Our <span className="cinematic-text">Expertise</span></h2>
          <div style={{ width: '80px', height: '2px', background: 'var(--accent-gold)', margin: '0 auto' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                transition: 'var(--transition-smooth)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
                e.currentTarget.style.transform = 'translateY(-10px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                {service.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', letterSpacing: '0.1em' }}>{service.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', flexGrow: 1 }}>
                {service.description}
              </p>
              <span style={{ 
                fontFamily: 'var(--font-accent)', 
                color: 'var(--accent-silver)',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                {service.price}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
