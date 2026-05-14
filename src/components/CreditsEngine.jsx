import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Download, Play, Save, GripVertical, 
  Image as ImageIcon, Languages, X, Search, ArrowRight, FilePlus, ChevronUp, ChevronDown
} from 'lucide-react';
import { saveProject } from '../utils/api';
import { writePsd } from 'ag-psd';
import WordImporter from '../components/WordImporter';
import ProjectPanel from '../components/ProjectPanel';
import UploadedFilesList from '../components/UploadedFilesList';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Row Component ---
const SortableCreditRow = ({ 
  credit, 
  index,
  onUpdate, 
  onRemove, 
  onAddName, 
  onRemoveName, 
  onUpdateName,
  globalTitleBold,
  globalTitleItalic,
  globalNameBold,
  globalNameItalic,
  plateRefs,
  onPreviewClick,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: credit.id });
  
  const fileInputRef = useRef(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '2rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
    position: 'relative'
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(credit.id, 'logo', reader.result);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    onUpdate(credit.id, 'logo', '');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Common cinematic font sizes
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64];

  return (
    <div 
      ref={(el) => {
        setNodeRef(el);
        if (plateRefs.current) plateRefs.current[credit.id] = el;
      }} 
      style={style}
      id={`plate-editor-${credit.id}`}
    >
      {/* Move buttons overlay */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem', 
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        zIndex: 10
      }}>
        <button 
          disabled={isFirst}
          onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: isFirst ? 'gray' : 'var(--accent-gold)', cursor: isFirst ? 'default' : 'pointer', padding: '4px', borderRadius: '4px' }}
        >
          <ChevronUp size={18} />
        </button>
        <button 
          disabled={isLast}
          onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: isLast ? 'gray' : 'var(--accent-gold)', cursor: isLast ? 'default' : 'pointer', padding: '4px', borderRadius: '4px' }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 150px', gap: '2rem' }}>
        
        {/* Left Content: Vertical Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: '900', 
              color: 'var(--accent-gold)', 
              fontFamily: 'var(--font-heading)',
              lineHeight: '1'
            }}>
              {index + 1}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onPreviewClick(); }}
              title="Locate in Preview"
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)',
                borderRadius: '16px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-gold)'; e.currentTarget.style.color = 'black'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent-gold)'; }}
            >
              WATCH IN PREVIEW
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>TITLE</label>
            <input 
              value={credit.role} 
              onChange={(e) => onUpdate(credit.id, 'role', e.target.value)}
              placeholder="e.g. DIRECTOR"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)', 
                padding: '1rem', 
                color: 'var(--accent-gold)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                textTransform: 'uppercase',
                fontWeight: globalTitleBold ? 'bold' : 'normal',
                fontStyle: globalTitleItalic ? 'italic' : 'normal',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>NAME(S)</label>
            {credit.names.map((name, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  value={name}
                  onChange={(e) => onUpdateName(credit.id, idx, e.target.value)}
                  placeholder="NAME"
                  style={{ 
                    flex: 1, 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--glass-border)', 
                    padding: '0.8rem', 
                    color: 'white',
                    fontFamily: 'var(--font-body)',
                    fontSize: credit.fontSize,
                    fontWeight: globalNameBold ? 'bold' : 'normal',
                    fontStyle: globalNameItalic ? 'italic' : 'normal',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={() => onRemoveName(credit.id, idx)} 
                  style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                  title="Remove Name"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => onAddName(credit.id)}
              style={{ 
                alignSelf: 'flex-start',
                background: 'transparent', 
                border: '1px dashed var(--accent-gold)', 
                color: 'var(--accent-gold)', 
                padding: '0.5rem 1rem', 
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              + {credit.names.length === 0 ? 'ADD NAME' : 'ADD ANOTHER NAME'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.15em', fontWeight: 'bold' }}>FONT SIZE:</span>
              <select 
                value={parseInt(credit.fontSize)} 
                onChange={(e) => onUpdate(credit.id, 'fontSize', `${e.target.value}px`)}
                style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem' }}
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => onRemove(credit.id)}
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
            >
              DELETE PLATE
            </button>
          </div>
        </div>

        {/* Right Content: Logo Placeholder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="image/*"
          />
          <div 
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            onClick={() => fileInputRef.current.click()}
            style={{ 
              width: '150px', 
              height: '150px', 
              background: credit.logo ? `url("${credit.logo}") center/contain no-repeat` : 'rgba(255,255,255,0.02)',
              border: '2px dashed var(--glass-border)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              position: 'relative'
            }}
          >
            {!credit.logo && (
              <>
                <ImageIcon size={32} style={{ marginBottom: '10px' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>CHOOSE LOCAL<br/>IMAGE FILE</span>
              </>
            )}
            
            {credit.logo && isLogoHovered && (
              <div 
                onClick={handleRemoveLogo} 
                style={{ 
                  position: 'absolute', 
                  bottom: '8px', 
                  right: '8px', 
                  background: 'rgba(255, 0, 0, 0.8)', 
                  color: 'white', 
                  borderRadius: '4px', 
                  padding: '4px', 
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Load Image</span>
        </div>

      </div>
    </div>
  );
};

// --- Main Engine Component ---
const CreditsEngine = () => {
  const location = useLocation();
  const [credits, setCredits] = useState([
    { 
      id: '1', 
      role: '',
      names: [''], 
      language: 'ar',
      fontSize: '24px', // Numerical default
      logo: ''
    }
  ]);

  useEffect(() => {
    if (location.state?.loadProject) {
      try {
        const parsed = typeof location.state.loadProject === 'string' 
          ? JSON.parse(location.state.loadProject) 
          : location.state.loadProject;
        if (parsed && parsed.credits) {
          setCredits(parsed.credits);
        }
      } catch (err) {
        console.error("Failed to load project from state", err);
      }
      // Clear the state so it doesn't reload on subsequent navigation
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [globalTitleBold, setGlobalTitleBold] = useState(false);
  const [globalTitleItalic, setGlobalTitleItalic] = useState(false);
  const [globalNameBold, setGlobalNameBold] = useState(false);
  const [globalNameItalic, setGlobalNameItalic] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('End_Credits');
  const [gapBetweenPlates, setGapBetweenPlates] = useState(300);
  const [gapAfterTitle, setGapAfterTitle] = useState(150);
  const [gapBetweenNames, setGapBetweenNames] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
    window.isProjectDirty = isDirty;
  }, [isDirty]);

  const handleExportClick = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.subscription_status || user.subscription_status !== 'active') {
      setShowPricingModal(true);
    } else {
      setShowExportModal(true);
    }
  };

  useEffect(() => {
    window.isProjectDirty = false;
    const handleBeforeUnload = (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = 'WARNING: You have unsaved changes! Please click Cancel to stay on this page, and use the SAVE button to save your project, otherwise you will lose your work.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Prevent browser back button
    window.history.pushState(null, null, window.location.href);
    const handlePopState = (e) => {
      if (isDirtyRef.current) {
        const leave = window.confirm('WARNING: You have unsaved changes! Please click Cancel to stay on this page, and use the SAVE button to save your project, otherwise you will lose your work.');
        if (!leave) {
          window.history.pushState(null, null, window.location.href);
          return;
        }
      }
      window.history.go(-1);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const resetProject = () => {
    setCredits([{ id: crypto.randomUUID(), role: '', names: [''], fontSize: '24px', logo: '' }]);
    setGlobalTitleBold(false);
    setGlobalTitleItalic(false);
    setGlobalNameBold(false);
    setGlobalNameItalic(false);
    setGapBetweenPlates(300);
    setGapAfterTitle(150);
    setGapBetweenNames(100);
    setSearchQuery("");
    setExportFileName("End_Credits");
    setShowNewProjectModal(false);
  };

  const handleSaveAndReset = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to save projects! Please login via the SAVE PROJECT button first, or choose 'Discard & Create New'.");
      return;
    }
    try {
      await saveProject('END_Untitled', { credits });
      resetProject();
    } catch (e) {
      alert("Error saving project: " + e.message);
    }
  };

  const filteredCredits = credits.filter(c => {
     if (!searchQuery) return true;
     const q = searchQuery.toLowerCase();
     if (c.role && c.role.toLowerCase().includes(q)) return true;
     if (c.names.some(n => n && n.toLowerCase().includes(q))) return true;
     return false;
  });

  const plateRefs = useRef({});
  const previewRefs = useRef({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const movePlate = (index, dir) => {
    if (dir === 'up' && index > 0) {
      setCredits((prev) => arrayMove(prev, index, index - 1));
      setIsDirty(true);
    } else if (dir === 'down' && index < credits.length - 1) {
      setCredits((prev) => arrayMove(prev, index, index + 1));
      setIsDirty(true);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCredits((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setIsDirty(true);
    }
  };

  const addRow = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setCredits([...credits, { 
      id: newId, 
      role: '',
      names: [''], 
      language: 'ar',
      fontSize: '20px', // Numerical default
      logo: ''
    }]);
    setIsDirty(true);
  };

  const scrollToPlate = (id) => {
    const el = plateRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 20px var(--accent-gold)';
      setTimeout(() => el.style.boxShadow = 'none', 1000);
    }
  };

  const scrollToPreviewPlate = (id) => {
    const el = previewRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const originalBg = el.style.background;
      el.style.background = 'rgba(212, 175, 55, 0.2)';
      el.style.borderRadius = '8px';
      setTimeout(() => el.style.background = originalBg, 1000);
    }
  };

  const removeRow = (id) => {
    setCredits(credits.filter(c => c.id !== id));
    setIsDirty(true);
  };

  const updateRow = (id, field, value) => {
    setCredits(credits.map(c => c.id === id ? { ...c, [field]: value } : c));
    setIsDirty(true);
  };

  const addName = (id) => {
    setCredits(credits.map(c => c.id === id ? { ...c, names: [...c.names, ''] } : c));
    setIsDirty(true);
  };

  const removeName = (id, idx) => {
    setCredits(credits.map(c => c.id === id ? { ...c, names: c.names.filter((_, i) => i !== idx) } : c));
    setIsDirty(true);
  };

  const updateName = (id, idx, value) => {
    setCredits(credits.map(c => c.id === id ? { 
      ...c, 
      names: c.names.map((n, i) => i === idx ? value : n) 
    } : c));
    setIsDirty(true);
  };

  const generatePsdBuffer = async () => {
      const docWidth = 1920;
      
      const titleFontSize = 72;
      const nameFontSize = 72;

      // Step 0: Pre-load logos asynchronously
      const loadedLogos = {};
      for (const plate of credits) {
          if (plate.logo) {
              const img = new Image();
              img.src = plate.logo;
              await new Promise((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve(); // Skip on error
              });
              
              if (img.width > 0 && img.height > 0) {
                  // Scale logo to fit nicely (e.g., max width 800, max height 400)
                  const maxWidth = 800;
                  const maxHeight = 400;
                  let width = img.width;
                  let height = img.height;
                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                  if (ratio < 1) {
                      width = width * ratio;
                      height = height * ratio;
                  }
                  
                  // Draw into canvas to extract PixelData
                  const canvas = document.createElement('canvas');
                  canvas.width = docWidth;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, (docWidth - width) / 2, 0, width, height);
                  
                  loadedLogos[plate.id] = { canvas, height };
              }
          }
      }
      
      // Step 1: Pre-calculate Y positions
      let currentY = 100;
      const plateDataList = [];

      for (let i = 0; i < credits.length; i++) {
        const plate = credits[i];
        
        const pData = {
           role: plate.role,
           names: plate.names,
           titleY: currentY,
           logoId: plate.id,
           logoY: 0,
           nameYPositions: []
        };
        
        if (plate.role && plate.role.trim()) {
           currentY += gapAfterTitle;
        }

        if (loadedLogos[plate.id]) {
           pData.logoY = currentY;
           currentY += loadedLogos[plate.id].height + 100; // 100px gap after logo
        }

        for (let j = 0; j < plate.names.length; j++) {
            if (!plate.names[j].trim()) {
               pData.nameYPositions.push(0);
               continue;
            }
            pData.nameYPositions.push(currentY);
            currentY += gapBetweenNames;
        }
        
        plateDataList.push(pData);
        currentY += gapBetweenPlates;
      }

      const overallHeight = currentY > 100 ? currentY - gapBetweenPlates : 1080;
      const docHeight = overallHeight + 100;

      // Step 2: Build Photoshop Children array (Index 0 is BOTTOM layer, Last Index is TOP layer)
      const children = [];

      // 1. Background (Absolute Bottom)
      const bgSize = docWidth * docHeight * 4;
      const bgData = new Uint8Array(bgSize);
      // R, G, B are already 0. We just need to set Alpha (A) to 255 for opaque black.
      for (let i = 3; i < bgSize; i += 4) {
          bgData[i] = 255;
      }

      children.push({
          name: 'Background',
          imageData: {
              width: docWidth,
              height: docHeight,
              data: bgData
          }
      });

      // 2. Groups (Plate N -> Plate 1)
      for (let i = plateDataList.length - 1; i >= 0; i--) {
         const pData = plateDataList[i];
         const groupChildren = [];

         // Inside group, Names bottom-up (Name N -> Name 1)
         for (let j = pData.names.length - 1; j >= 0; j--) {
             if (!pData.names[j].trim()) continue;
             groupChildren.push({
                name: pData.names[j],
                text: {
                    text: pData.names[j],
                    paragraphStyle: { justification: 'center' },
                    style: {
                        font: { name: 'ArialMT' },
                        fontSize: nameFontSize,
                        fillColor: { r: 255, g: 255, b: 255, a: 255 }
                    },
                    transform: [1, 0, 0, 1, docWidth / 2, pData.nameYPositions[j]]
                }
             });
         }

         // Image below title, above names
         if (loadedLogos[pData.logoId]) {
             groupChildren.push({
                 name: 'Image',
                 canvas: loadedLogos[pData.logoId].canvas,
                 left: 0,
                 top: pData.logoY
             });
         }

         // Title at the very top of the group
         if (pData.role && pData.role.trim()) {
             groupChildren.push({
                name: pData.role,
                text: {
                    text: pData.role,
                    paragraphStyle: { justification: 'center' },
                    style: {
                        font: { name: 'ArialMT' },
                        fontSize: titleFontSize,
                        fillColor: { r: 212, g: 175, b: 55, a: 255 }
                    },
                    transform: [1, 0, 0, 1, docWidth / 2, pData.titleY]
                }
             });
         }

         children.push({
            name: pData.role || `Plate ${i+1}`,
            opened: true,
            children: groupChildren
         });
      }

      const psdData = {
          width: docWidth,
          height: docHeight,
          channels: 3,
          bitsPerChannel: 8,
          colorMode: 3, // RGB
          children: children
      };

      const isPsb = docHeight > 30000;
      return {
          buffer: writePsd(psdData, { psb: isPsb }),
          ext: isPsb ? '.psb' : '.psd'
      };
  };

  const handleSavePsd = async () => {
    try {
      const { buffer, ext } = await generatePsdBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const filename = (exportFileName || 'End_Credits') + ext;

      if (window.showSaveFilePicker) {
         try {
             const handle = await window.showSaveFilePicker({
                 suggestedName: filename,
                 types: [{ 
                     description: ext === '.psb' ? 'Photoshop Big Document' : 'Photoshop Document', 
                     accept: { 'image/vnd.adobe.photoshop': [ext] } 
                 }]
             });
             const writable = await handle.createWritable();
             await writable.write(blob);
             await writable.close();
         } catch (e) {
             if (e.name !== 'AbortError') throw e;
         }
      } else {
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
      }
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      alert('Error generating PSD: ' + err.message);
    }
  };

  const handleSharePsd = async () => {
    try {
      const { buffer, ext } = await generatePsdBuffer();
      const filename = (exportFileName || 'End_Credits') + ext;
      const file = new File([buffer], filename, { type: 'image/vnd.adobe.photoshop' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
              title: filename,
              files: [file]
          });
      } else {
          alert('Sharing files is not supported on this device/browser. Please use Save to Computer.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
          console.error(err);
          alert('Error sharing PSD: ' + err.message);
      }
    }
  };

  const handleExportToFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        alert("Your browser doesn't support folder selection. Please use Chrome or Edge.");
        return;
      }
      
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const folderName = `${exportFileName}_Titles`;
      const newDirHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });

      // Generate PSD
      const { buffer, ext } = await generatePsdBuffer();
      const psdBlob = new Blob([buffer], { type: 'application/octet-stream' });
      const psdFilename = exportFileName + ext;
      const psdFileHandle = await newDirHandle.getFileHandle(psdFilename, { create: true });
      const psdWritable = await psdFileHandle.createWritable();
      await psdWritable.write(psdBlob);
      await psdWritable.close();

      // Generate AE Script
      const aeScript = `
// Antigravity Credits Studio - After Effects Importer
app.beginUndoGroup("Import Credits PSD");
var psdFile = new File($.fileName).parent.getFiles("*.psd")[0] || new File($.fileName).parent.getFiles("*.psb")[0];
if (!psdFile) {
    psdFile = File.openDialog("Select your exported Credits PSD file");
}
if (psdFile !== null) {
    var io = new ImportOptions(psdFile);
    if (io.canImportAs(ImportAsType.COMP_CROPPED_LAYERS)) {
        io.importAs = ImportAsType.COMP_CROPPED_LAYERS;
    } else {
        io.importAs = ImportAsType.COMP;
    }
    
    var importedComp = app.project.importFile(io);
    
    if (importedComp instanceof CompItem) {
        var duration = 60; // 60 seconds default duration
        var importedAudio = null;

        // Prompt for Audio
        var audioFile = File.openDialog("Select an Audio file for the credits (or click Cancel to skip)", "*.*");
        if (audioFile !== null) {
            var audioIo = new ImportOptions(audioFile);
            importedAudio = app.project.importFile(audioIo);
            if (importedAudio && importedAudio.duration > 0) {
                duration = importedAudio.duration;
            }
        }

        var mainComp = app.project.items.addComp("Credits Roll - 1920x1080", 1920, 1080, 1, duration, 25);
        
        if (importedAudio !== null) {
            mainComp.layers.add(importedAudio);
        }

        // Create a Null object to control the scroll
        var scrollNull = mainComp.layers.addNull(duration);
        scrollNull.name = "SCROLL CONTROL";

        // Extract layers from the imported precomp into main comp and parent them to the Null
        for (var i = importedComp.numLayers; i >= 1; i--) {
            var copiedLayer = importedComp.layer(i);
            copiedLayer.copyToComp(mainComp);
            // After copying, the new layer is placed at the top (index 1)
            mainComp.layer(1).parent = scrollNull;
        }

        // The Null starts in the center: [1920/2, 1080/2] = [960, 540].
        // To push the Top Layer down to the bottom of the screen (Y=1080), the Null moves down by 1080.
        var startY = 540 + 1080;
        
        // To push the Bottom Layer (Y=importedComp.height) up to the top of the screen (Y=0), the Null moves up by importedComp.height.
        var endY = 540 - importedComp.height;
        
        scrollNull.position.setValueAtTime(0, [960, startY]);
        scrollNull.position.setValueAtTime(duration, [960, endY]);
        
        mainComp.openInViewer();
        alert("Success! Credits imported, Null created, and scroll animation linked to audio duration (" + Math.round(duration) + "s).");
    } else {
        alert("The PSD was imported but not as a composition.");
    }
}
app.endUndoGroup();
`;
      const aeFilename = exportFileName + '_AE_Importer.jsx';
      const aeFileHandle = await newDirHandle.getFileHandle(aeFilename, { create: true });
      const aeWritable = await aeFileHandle.createWritable();
      await aeWritable.write(new Blob([aeScript], { type: 'text/plain' }));
      await aeWritable.close();

      setShowExportModal(false);
      alert(`Success! Created folder "${folderName}" containing the Photoshop file and the After Effects script.`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        alert('Error exporting to folder: ' + err.message);
      }
    }
  };


  return (
    <section id="engine" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem' }}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>End Credits <span className="cinematic-text">Writer</span></h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 0.8fr 1.2fr', gap: '3rem', alignItems: 'start' }}>
          
          {/* Left Sidebar (Sticky) */}
          <div style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', zIndex: 50, height: 'calc(100vh - 4rem)', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <WordImporter credits={credits} setCredits={setCredits} moduleType="END" />
            
            <button onClick={addRow} className="btn-primary" style={{ padding: '0.8rem', background: 'var(--accent-gold)', color: 'black', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> ADD NEW PLATE
            </button>

            <button onClick={() => setShowNewProjectModal(true)} className="btn-primary" style={{ padding: '0.8rem', background: 'transparent', border: '1px solid var(--accent-silver)', color: 'var(--accent-silver)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FilePlus size={18} style={{ marginRight: '8px' }} /> NEW PROJECT
            </button>

            <button onClick={handleExportClick} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#31A8FF', border: 'none', color: 'white', padding: '0.8rem' }}>
              <Download size={18} /> EXPORT TO ADOBE
            </button>

            <ProjectPanel credits={credits} setCredits={setCredits} moduleType="END" onProjectSaved={() => setIsDirty(false)} />
            <UploadedFilesList setCredits={setCredits} moduleType="END" />

          </div>

          {/* Editor Side (Middle) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              position: 'sticky',
              top: 0,
              zIndex: 100,
              marginBottom: '1.5rem',
              background: 'var(--bg-primary)',
              paddingBottom: '1rem',
              paddingTop: '2rem',
              marginTop: '-2rem'
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search plates for text..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '1rem 1rem 1rem 3rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--glass-border)', 
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* STYLING & SPACING SETTINGS */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="glass" style={{ flex: 0.6, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--accent-gold)', fontWeight: 'bold', textAlign: 'center' }}>TITLE STYLING</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={globalTitleBold} 
                        onChange={(e) => { setGlobalTitleBold(e.target.checked); setIsDirty(true); }} 
                        style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>BOLD</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={globalTitleItalic} 
                        onChange={(e) => { setGlobalTitleItalic(e.target.checked); setIsDirty(true); }} 
                        style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>ITALIC</span>
                    </label>
                  </div>
                </div>

                <div className="glass" style={{ flex: 0.6, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>NAME STYLING</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={globalNameBold} 
                        onChange={(e) => { setGlobalNameBold(e.target.checked); setIsDirty(true); }} 
                        style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>BOLD</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={globalNameItalic} 
                        onChange={(e) => { setGlobalNameItalic(e.target.checked); setIsDirty(true); }} 
                        style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>ITALIC</span>
                    </label>
                  </div>
                </div>

                <div className="glass" style={{ flex: 2, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#31A8FF', fontWeight: 'bold' }}>TITLES SPACING (in pixels)</span>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>PLATE</span>
                      <input type="number" value={gapBetweenPlates} onChange={e => setGapBetweenPlates(Number(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', padding: '0.2rem', fontSize: '0.8rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>TITLE</span>
                      <input type="number" value={gapAfterTitle} onChange={e => setGapAfterTitle(Number(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', padding: '0.2rem', fontSize: '0.8rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>NAME</span>
                      <input type="number" value={gapBetweenNames} onChange={e => setGapBetweenNames(Number(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center', padding: '0.2rem', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredCredits.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredCredits.map((credit) => {
                  const fullIndex = credits.findIndex(c => c.id === credit.id);
                  return (
                  <SortableCreditRow 
                    key={credit.id}
                    index={fullIndex}
                    credit={credit}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    onAddName={addName}
                    onRemoveName={removeName}
                    onUpdateName={updateName}
                    globalTitleBold={globalTitleBold}
                    globalTitleItalic={globalTitleItalic}
                    globalNameBold={globalNameBold}
                    globalNameItalic={globalNameItalic}
                    plateRefs={plateRefs}
                    onPreviewClick={() => scrollToPreviewPlate(credit.id)}
                    onMoveUp={(idx) => movePlate(idx, 'up')}
                    onMoveDown={(idx) => movePlate(idx, 'down')}
                    isFirst={fullIndex === 0}
                    isLast={fullIndex === credits.length - 1}
                  />
                )})}
              </SortableContext>
            </DndContext>
            <UploadedFilesList setCredits={setCredits} />
          </div>

          {/* Preview Side */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div className="glass" style={{ 
              height: '700px', 
              position: 'relative', 
              overflowY: isPlaying ? 'hidden' : 'auto',
              overflowX: 'hidden',
              background: 'black',
              border: '2px solid var(--accent-gold)',
              borderRadius: '16px'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '1rem', 
                zIndex: 100
              }}>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ 
                    background: isPlaying ? 'var(--accent-gold)' : 'transparent', 
                    border: '1px solid var(--accent-gold)',
                    color: isPlaying ? 'black' : 'var(--accent-gold)',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Play size={20} fill={isPlaying ? 'black' : 'none'} />
                </button>
              </div>

              <div 
                className={isPlaying ? "credits-roll" : ""} 
                style={{
                  padding: '10rem 2rem',
                  textAlign: 'center',
                  color: 'white',
                  animationDuration: `${credits.length * 5 + 10}s`
                }}
              >
                {credits.map((c, i) => (
                  <div 
                    key={c.id} 
                    ref={(el) => { if (previewRefs.current) previewRefs.current[c.id] = el; }}
                    onClick={() => !isPlaying && scrollToPlate(c.id)}
                    style={{ 
                      marginBottom: `${gapBetweenPlates * 0.3}px`, 
                      cursor: !isPlaying ? 'pointer' : 'default',
                      padding: '1rem',
                      transition: 'transform 0.2s, background 0.3s'
                    }} 
                    onMouseEnter={(e) => !isPlaying && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => !isPlaying && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {c.role && (
                      <div style={{ 
                        fontSize: '1.1rem', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.4em', 
                        color: 'var(--accent-gold)',
                        marginBottom: `${gapAfterTitle * 0.3}px`,
                        fontWeight: globalTitleBold ? 'bold' : 'normal',
                        fontStyle: globalTitleItalic ? 'italic' : 'normal',
                        fontFamily: 'var(--font-heading)'
                      }}>
                        {c.role}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gapBetweenNames * 0.3}px` }}>
                      {c.names.map((name, idx) => (
                        <div key={idx} style={{ 
                          fontSize: c.fontSize, 
                          fontFamily: 'var(--font-body)', 
                          letterSpacing: '0.15em',
                          fontWeight: globalNameBold ? 'bold' : 'normal',
                          fontStyle: globalNameItalic ? 'italic' : 'normal'
                        }}>
                          {name || '---'}
                        </div>
                      ))}
                    </div>

                    {c.logo && (
                      <img 
                        src={c.logo} 
                        alt="logo" 
                        style={{ maxWidth: '150px', maxHeight: '100px', marginTop: '2rem', opacity: 1 }} 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {!isPlaying && (
              <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                💡 Click a plate in preview to jump to it in the editor
              </p>
            )}
          </div>

        </div>
      </div>

      {showPricingModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass" style={{ padding: '3rem', borderRadius: '16px', width: '500px', position: 'relative', textAlign: 'center', border: '1px solid var(--accent-gold)' }}>
            <button onClick={() => setShowPricingModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem', letterSpacing: '0.1em' }}>UNLOCK PRO</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.5' }}>
              Exporting high-resolution PSD files with automated After Effects scripts is a premium feature.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Monthly Studio Pass</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '1rem' }}>$29<span style={{ fontSize: '1rem', color: 'gray' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', color: '#e0e0e0', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li>✓ Unlimited PSD Exports</li>
                <li>✓ After Effects Auto-Sync Script</li>
                <li>✓ Advanced Typography Controls</li>
                <li>✓ Priority Support</li>
              </ul>
            </div>

            <button 
              onClick={() => {
                alert("Redirecting to Lemon Squeezy Checkout...");
                // Note: Integration point for Lemon Squeezy script
                // e.g. LemonSqueezy.Url.Open('https://your-store.lemonsqueezy.com/checkout/buy/variant-id');
              }} 
              className="btn-primary" 
              style={{ width: '100%', background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.1em' }}
            >
              UPGRADE NOW
            </button>
            <p style={{ color: 'gray', fontSize: '0.75rem', marginTop: '1rem' }}>Secure checkout powered by Lemon Squeezy. Cancel anytime.</p>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setShowExportModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', textAlign: 'center' }}>EXPORT TO ADOBE</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>PROJECT NAME</label>
              <input 
                type="text" 
                value={exportFileName} 
                onChange={(e) => setExportFileName(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleExportToFolder} className="btn-primary" style={{ width: '100%', background: '#9933FF', color: 'white', border: 'none', padding: '1rem' }}>
                EXPORT FOLDER TO COMPUTER
              </button>
              <button onClick={handleSharePsd} className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent-silver)', color: 'var(--accent-silver)', padding: '1rem' }}>
                SHARE / EMAIL PSD ONLY
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setShowNewProjectModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', textAlign: 'center' }}>NEW PROJECT</h3>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Do you want to save the current project before creating a new one? Any unsaved changes will be lost.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleSaveAndReset} className="btn-primary" style={{ width: '100%', background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '1rem' }}>
                SAVE & CREATE NEW
              </button>
              <button onClick={resetProject} className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '1rem' }}>
                DISCARD & CREATE NEW
              </button>
              <button onClick={() => setShowNewProjectModal(false)} className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem' }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreditsEngine;
