// src/components/ProjectPanel.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FolderOpen, Trash2 } from 'lucide-react';
import { login, register, getProjects, saveProject, deleteProject } from '../utils/api';

export default function ProjectPanel({ credits, setCredits, moduleType, onProjectSaved }) {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const token = localStorage.getItem('token');

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const data = await getProjects();
      if (Array.isArray(data)) {
        if (moduleType) {
          setProjects(data.filter(p => p.name.startsWith(`${moduleType}_`)));
        } else {
          setProjects(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProjects(); }, [token]);

  const handleSaveClick = () => {
    if (!token) return setShowAuth(true);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!projectName.trim()) return alert("Please enter a project name.");
    const prefix = moduleType ? `${moduleType}_` : '';
    const finalName = `${prefix}${projectName}`;

    // Check if name already exists
    const exists = projects.some(p => p.name === finalName);
    if (exists) {
      alert("A project with this name already exists. Please choose a different name to avoid overwriting.");
      return;
    }

    try {
      await saveProject(finalName, { credits });
      setShowSaveModal(false);
      setProjectName('');
      setShowSuccessModal(true);
      fetchProjects();
      if (onProjectSaved) {
        onProjectSaved();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save project: " + err.message);
    }
  };

  const handleAuth = async () => {
    const fn = isLogin ? login : register;
    const payload = isLogin ? { email, password } : { username, email, password };
    const res = await fn(...Object.values(payload));
    if (res.token) {
      localStorage.setItem('token', res.token);
      setShowAuth(false);
      fetchProjects();
    } else {
      alert(res.msg || 'Auth failed');
    }
  };

  const loadProject = (projectData) => {
    try {
      const parsed = typeof projectData === 'string' ? JSON.parse(projectData) : projectData;
      if (parsed && parsed.credits) {
        setCredits(parsed.credits);
      }
    } catch (err) {
      console.error("Failed to load project", err);
      alert("Failed to load project");
    }
  };

  const requestDelete = (e, id) => {
    e.stopPropagation();
    setDeleteCandidate(id);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteProject(deleteCandidate);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project", err);
    }
    setDeleteCandidate(null);
  };

  const getDisplayName = (name) => {
    const prefix = `${moduleType}_`;
    if (moduleType && name.startsWith(prefix)) {
      return name.substring(prefix.length);
    }
    return name;
  };

  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <button onClick={handleSaveClick} className="btn-primary"
              style={{ background: 'var(--accent-gold)', color: 'black', padding: '0.8rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Save size={18} style={{ marginRight: 8 }} /> SAVE PROJECT
      </button>

      {token && projects.length > 0 && (
        <div style={{ textAlign: 'left', marginTop: '1rem' }}>
          <div 
            onClick={() => setShowProjects(!showProjects)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              color: 'var(--accent-gold)', cursor: 'pointer', marginBottom: '0.8rem',
              fontSize: '0.8rem', letterSpacing: '0.1em', fontWeight: 'bold'
            }}
          >
            <FolderOpen size={16} /> 
            {showProjects ? "HIDE SAVED PROJECTS" : "LOAD SAVED PROJECT"}
          </div>

          {showProjects && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {projects.map(p => (
                <div 
                  key={p.id}
                  onClick={() => loadProject(p.data)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.8rem', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)', borderRadius: '8px',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                      {getDisplayName(p.name)}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => requestDelete(e, p.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    title="Delete Project"
                    onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSaveModal && createPortal(
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999
        }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '320px', position: 'relative' }}>
            <button onClick={() => setShowSaveModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', textAlign: 'center' }}>SAVE PROJECT</h3>
            <input 
              type="text" 
              placeholder="Project Name" 
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px', marginBottom: '1rem' }} 
            />
            <button onClick={handleConfirmSave} className="btn-primary" style={{ width: '100%', background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '0.8rem' }}>SAVE TO CLOUD</button>
          </div>
        </div>,
        document.body
      )}

      {showSuccessModal && createPortal(
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999
        }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '320px', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowSuccessModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ color: '#4ade80', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <Save size={48} />
            </div>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>SUCCESS</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Project saved successfully to the cloud.</p>
            <button onClick={() => setShowSuccessModal(false)} className="btn-primary" style={{ width: '100%', background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '0.8rem' }}>CONTINUE</button>
          </div>
        </div>,
        document.body
      )}

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

      {showAuth && createPortal(
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '320px', position: 'relative' }}>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: 'white' }}>
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)', textAlign: 'center' }}>
              {isLogin ? 'Login' : 'Register'}
            </h3>
            {!isLogin && (
              <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
            )}
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: '0.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} />
            <button onClick={handleAuth} className="btn-primary" style={{ width: '100%', background: 'var(--accent-gold)', color: 'black', padding: '0.8rem' }}>
              {isLogin ? 'Login' : 'Register'}
            </button>
            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
              <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Create an account' : 'Already have one? Login'}
              </span>
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
