// src/components/WordImporter.jsx
import React, { useState } from "react";
import { parseDocxFile } from "../utils/wordParser";
import { X } from "lucide-react";

export default function WordImporter({ credits, setCredits, moduleType }) {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewPlates, setPreviewPlates] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingPlates, setPendingPlates] = useState([]);

  const handleFiles = async (files) => {
    if (!files.length) return;
    const file = files[0];
    if (!file.name.endsWith('.docx')) {
      alert('Only .docx files are supported');
      return;
    }
    setParsing(true);
    try {
      const plates = await parseDocxFile(file);
      
      // Save to localStorage
      const newFile = {
        id: Date.now(),
        filename: file.name,
        plates,
        timestamp: Date.now()
      };
      const storageKey = `uploaded_word_files_${moduleType || 'DEFAULT'}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updated = [newFile, ...existing].slice(0, 50); // keep max 50 to avoid size limits
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('word-file-uploaded', { detail: { moduleType } }));

      setPendingPlates(plates);
      const isSingleEmptyPlate = credits.length === 1 && 
        (!credits[0].role || credits[0].role.trim() === '') && 
        (credits[0].names.length === 0 || (credits[0].names.length === 1 && credits[0].names[0].trim() === '')) &&
        !credits[0].logo;

      if (credits.length === 0 || isSingleEmptyPlate) {
        // No existing plates or just one empty placeholder – just apply
        setCredits(plates);
      } else {
        // Existing plates with content – ask user what to do
        setShowModal(true);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to parse the document');
    }
    setParsing(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);

  const confirmAction = (type) => {
    // type: 'overwrite' or 'append'
    if (type === 'overwrite') {
      setCredits(pendingPlates);
    } else if (type === 'append') {
      setCredits([...credits, ...pendingPlates]);
    }
    setShowModal(false);
    setPendingPlates([]);
  };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById('word-input').click()}
        style={{
          border: dragActive ? '2px dashed var(--accent-gold)' : '2px dashed var(--accent-gold)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '0.5rem',
          background: dragActive ? 'rgba(212,175,55,0.1)' : 'transparent',
        }}
      >
        {parsing ? (
          <span style={{ color: 'var(--text-secondary)' }}>Parsing document...</span>
        ) : (
          <>
            <p style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Drag & drop a Word (.docx) file here, or click to select.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
              Non-black text → Title, Black text → Names
            </p>
          </>
        )}
        <input
          id="word-input"
          type="file"
          accept=".docx"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="modal" style={{
            background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '100%'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-gold)' }}>Import Credits</h3>
            <p>Existing plates detected. Choose how to import the new data.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => confirmAction('overwrite')} style={{ flex: 1, background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '0.5rem' }}>Overwrite</button>
              <button onClick={() => confirmAction('append')} style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '0.5rem' }}>Append</button>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#ff4444' }}><X size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
