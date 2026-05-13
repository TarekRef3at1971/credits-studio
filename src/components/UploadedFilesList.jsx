import React, { useState, useEffect } from 'react';
import { FileText, Clock, Trash2 } from 'lucide-react';

export default function UploadedFilesList({ setCredits, moduleType }) {
  const [files, setFiles] = useState([]);

  const loadFiles = () => {
    try {
      const storageKey = `uploaded_word_files_${moduleType || 'DEFAULT'}`;
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const now = Date.now();
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      
      // Filter out files older than 90 days
      const validFiles = stored.filter(f => (now - f.timestamp) <= ninetyDaysMs);
      
      if (validFiles.length !== stored.length) {
        localStorage.setItem(storageKey, JSON.stringify(validFiles));
      }
      
      setFiles(validFiles);
    } catch (e) {
      console.error("Error loading uploaded files", e);
    }
  };

  useEffect(() => {
    loadFiles();
    const handleEvent = (e) => {
      if (e.detail?.moduleType === moduleType) {
        loadFiles();
      }
    };
    window.addEventListener('word-file-uploaded', handleEvent);
    return () => window.removeEventListener('word-file-uploaded', handleEvent);
  }, [moduleType]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const updated = files.filter(f => f.id !== id);
    const storageKey = `uploaded_word_files_${moduleType || 'DEFAULT'}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setFiles(updated);
  };

  if (files.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ 
        fontSize: '0.8rem', 
        letterSpacing: '0.1em', 
        textTransform: 'uppercase', 
        color: 'var(--accent-gold)',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Clock size={16} /> Recent Word Files (90 Days)
      </h3>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem',
        maxHeight: '200px',
        overflowY: 'auto',
        paddingRight: '0.5rem'
      }}>
        {files.map(f => (
          <div 
            key={f.id}
            onClick={() => setCredits(f.plates)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.8rem 1rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflow: 'hidden' }}>
              <FileText size={16} color="var(--accent-silver)" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                  {f.filename}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {new Date(f.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button 
              onClick={(e) => handleDelete(e, f.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              title="Remove from history"
              onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
