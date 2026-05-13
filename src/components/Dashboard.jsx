import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Play, FileText, LogOut, Camera, FolderOpen, Trash2 } from 'lucide-react';
import { getProjects, deleteProject } from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const fetchProj = async () => {
    try {
      const data = await getProjects();
      if (Array.isArray(data)) setProjects(data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProj();
  }, []);

  const requestDelete = (e, id) => {
    e.stopPropagation();
    setDeleteCandidate(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteProject(deleteCandidate);
      setDeleteCandidate(null);
      fetchProj();
    } catch (e) {
      console.error(e);
      alert("Error deleting project.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleLoadProject = (p) => {
    if (p.name.startsWith('BEGIN_')) {
      navigate('/opening-titles', { state: { loadProject: p.data } });
    } else if (p.name.startsWith('END_')) {
      navigate('/project', { state: { loadProject: p.data } });
    } else {
      // Default to end credits if no prefix or old project
      navigate('/project', { state: { loadProject: p.data } });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Dashboard Navbar */}
      <nav className="glass" style={{
        padding: '1.5rem 0',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: '4rem'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Camera size={24} color="var(--accent-gold)" />
            <span style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '1.2rem', 
              letterSpacing: '0.2em',
              fontWeight: 700,
              color: 'white'
            }}>
              CREDITS <span style={{ color: 'var(--accent-gold)' }}>STUDIO</span>
            </span>
          </Link>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
              WELCOME, {user.username || 'CREATOR'}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Select Your <span className="cinematic-text">Production Module</span></h1>
          <p style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Choose which type of credits sequence you'd like to design today.</p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          maxWidth: '800px',
          margin: '0 auto',
          marginBottom: '3rem'
        }}>
          
          {/* Beginning Credits Option */}
          <Link to="/opening-titles" style={{ textDecoration: 'none', color: 'inherit' }}>
            <motion.div
              whileHover={{ y: -7, borderColor: 'var(--accent-gold)' }}
              className="glass"
              style={{
                padding: '2.8rem 1.4rem',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                transition: 'var(--transition-smooth)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                <Play size={34} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.7rem', letterSpacing: '0.1em' }}>Beginning Credits</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.63rem' }}>
                Design captivating opening title sequences and text animations for your project.
              </p>
            </motion.div>
          </Link>

          {/* End Credits Option */}
          <Link to="/project" style={{ textDecoration: 'none', color: 'inherit' }}>
            <motion.div
              whileHover={{ y: -7, borderColor: 'var(--accent-gold)' }}
              className="glass"
              style={{
                padding: '2.8rem 1.4rem',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                transition: 'var(--transition-smooth)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                <FileText size={34} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.7rem', letterSpacing: '0.1em' }}>End Credits Roll</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.63rem' }}>
                Format, design, and animate your rolling end credits block automatically.
              </p>
            </motion.div>
          </Link>

          {/* Continue Previous Work Card */}
          <div onClick={() => setShowProjects(!showProjects)} style={{ textDecoration: 'none', color: 'inherit' }}>
            <motion.div
              whileHover={{ y: -7, borderColor: 'var(--accent-gold)' }}
              className="glass"
              style={{
                padding: '2.8rem 1.4rem',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                transition: 'var(--transition-smooth)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                <FolderOpen size={34} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {showProjects ? 'Hide Previous Work' : 'Continue Previous Work'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.63rem' }}>
                Quickly resume your saved progress on previous titles and credits.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Continue Previous Work Section */}
        {showProjects && (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}
            >
              {projects.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>NO SAVED PROJECTS FOUND</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                  {/* Beginning Credits Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', letterSpacing: '0.1em', textAlign: 'center' }}>BEGINNING CREDITS</h4>
                    {projects.filter(p => p.name.startsWith('BEGIN_')).map(p => (
                      <div 
                        key={p.id}
                        onClick={() => handleLoadProject(p)}
                        style={{
                          padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                          borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '1.1rem', color: 'white' }}>{p.name.substring(6)}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last updated: {new Date(p.updated_at).toLocaleDateString()}</span>
                        </div>
                        <button 
                          onClick={(e) => requestDelete(e, p.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
                          title="Delete Project"
                          onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {projects.filter(p => p.name.startsWith('BEGIN_')).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>No projects found</div>
                    )}
                  </div>

                  {/* End Credits Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', letterSpacing: '0.1em', textAlign: 'center' }}>END CREDITS</h4>
                    {projects.filter(p => p.name.startsWith('END_')).map(p => (
                      <div 
                        key={p.id}
                        onClick={() => handleLoadProject(p)}
                        style={{
                          padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                          borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '1.1rem', color: 'white' }}>{p.name.substring(4)}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last updated: {new Date(p.updated_at).toLocaleDateString()}</span>
                        </div>
                        <button 
                          onClick={(e) => requestDelete(e, p.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
                          title="Delete Project"
                          onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {projects.filter(p => p.name.startsWith('END_')).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>No projects found</div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

      </div>

      {deleteCandidate && createPortal(
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999
        }}>
          <div style={{ background: '#2a0000', border: '2px solid #ff4444', padding: '3rem 2rem', borderRadius: '12px', width: '400px', textAlign: 'center', boxShadow: '0 0 30px rgba(255,0,0,0.5)' }}>
            <h3 style={{ color: '#ff4444', fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Warning!</h3>
            <p style={{ color: 'white', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.5' }}>
              You are about to delete a saved project. This action is <strong>PERMANENT</strong> and <strong>CANNOT BE UNDONE</strong>.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeleteCandidate(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CANCEL</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '1rem', background: '#ff4444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}>DELETE IT</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
