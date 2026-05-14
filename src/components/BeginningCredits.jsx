import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Trash2, Download, Play, GripVertical, 
  Image as ImageIcon, X, Search, FilePlus, ChevronUp, ChevronDown
} from 'lucide-react';
import { saveProject } from '../utils/api';
import { writePsd } from 'ag-psd';
import WordImporter from './WordImporter';
import ProjectPanel from './ProjectPanel';
import UploadedFilesList from './UploadedFilesList';
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

function hexToRgba(hex) {
  let c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length === 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return { r: (c>>16)&255, g: (c>>8)&255, b: c&255, a: 255 };
  }
  return { r: 255, g: 255, b: 255, a: 255 };
}

const getQuadrant = (index, startQ, dir) => {
    if (dir === 'FIX') return startQ;
    if (dir === 'CENTER') return 'CENTER';
    // Pattern Maps: Z_DOWN (Start TR, Zigzag: 2-1-4-3), Z_UP (Start TL, Zigzag: 1-2-3-4)
    const zDownMap = { 1: [2, 1, 4, 3], 2: [2, 1, 4, 3], 3: [2, 1, 4, 3], 4: [2, 1, 4, 3] };
    const zUpMap = { 1: [1, 2, 3, 4], 2: [1, 2, 3, 4], 3: [1, 2, 3, 4], 4: [1, 2, 3, 4] };
    const altVMap = { 1: [1, 4], 2: [2, 3], 3: [3, 2], 4: [4, 1] };
    const altHMap = { 1: [1, 2], 2: [2, 1], 3: [3, 4], 4: [4, 3] };

    if (dir === 'Z_DOWN') return zDownMap[startQ][index % 4];
    if (dir === 'Z_UP') return zUpMap[startQ][index % 4];
    if (dir === 'ALT_V') return altVMap[startQ][index % 2];
    if (dir === 'ALT_H') return altHMap[startQ][index % 2];
    return startQ;
};

const ZDownSVG = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="8" y2="26" />
    <polyline points="4 22 8 26 12 22" />
    <line x1="8" y1="26" x2="24" y2="6" />
    <polyline points="18 6 24 6 24 12" />
    <line x1="24" y1="6" x2="24" y2="26" />
    <polyline points="20 22 24 26 28 22" />
  </svg>
);

const ZUpSVG = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="26" x2="8" y2="6" />
    <polyline points="4 10 8 6 12 10" />
    <line x1="8" y1="6" x2="24" y2="26" />
    <polyline points="24 20 24 26 18 26" />
    <line x1="24" y1="26" x2="24" y2="6" />
    <polyline points="20 10 24 6 28 10" />
  </svg>
);

const AltVSVG = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="6" x2="16" y2="26" />
    <polyline points="12 10 16 6 20 10" />
    <polyline points="12 22 16 26 20 22" />
  </svg>
);

const AltHSVG = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="16" x2="26" y2="16" />
    <polyline points="10 12 6 16 10 20" />
    <polyline points="22 12 26 16 22 20" />
  </svg>
);

const CenterSVG = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="16" cy="16" r="4" />
    <circle cx="16" cy="16" r="12" strokeDasharray="4 4" />
  </svg>
);

// --- Sortable Row Component ---
const SortableCreditRow = ({ 
  credit, 
  index,
  onUpdate, 
  onRemove, 
  onAddName, 
  onRemoveName, 
  onUpdateName,
  onPlateClick,
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

  return (
    <div ref={setNodeRef} style={style} onClick={() => onPlateClick && onPlateClick(index)}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', zIndex: 10 }}>
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

      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>
            {index + 1}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>TITLE</label>
          <input 
            value={credit.role} 
            onChange={(e) => onUpdate(credit.id, 'role', e.target.value)}
            placeholder="e.g. DIRECTOR"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '1rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)', fontSize: '1rem', textTransform: 'uppercase', outline: 'none' }}
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
                style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '0.8rem', color: 'white', fontFamily: 'var(--font-body)', fontSize: '24px', outline: 'none' }}
              />
              <button onClick={() => onRemoveName(credit.id, idx)} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button onClick={() => onAddName(credit.id)} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--accent-gold)', color: 'var(--accent-gold)', padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            + ADD NAME
          </button>
        </div>

        {/* Position Override */}
        <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginRight: '5px' }}>POSITION OVERRIDE:</span>
          <button onClick={() => onUpdate(credit.id, 'overridePosition', 'NONE')} style={{ padding: '4px 8px', background: (!credit.overridePosition || credit.overridePosition === 'NONE') ? 'var(--accent-gold)' : 'transparent', color: (!credit.overridePosition || credit.overridePosition === 'NONE') ? 'black' : 'gray', border: '1px solid gray', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>AUTO</button>
          {[1, 2, 3, 4].map(q => (
             <button key={q} onClick={() => onUpdate(credit.id, 'overridePosition', q)} style={{ padding: '4px 8px', background: credit.overridePosition === q ? 'var(--accent-gold)' : 'transparent', color: credit.overridePosition === q ? 'black' : 'gray', border: '1px solid gray', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>{q}</button>
          ))}
          <button onClick={() => onUpdate(credit.id, 'overridePosition', 'CENTER')} style={{ padding: '4px 8px', background: credit.overridePosition === 'CENTER' ? 'var(--accent-gold)' : 'transparent', color: credit.overridePosition === 'CENTER' ? 'black' : 'gray', border: '1px solid gray', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>C</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
             <ImageIcon size={16} /> {credit.logo ? 'CHANGE LOGO' : 'ADD LOGO'}
          </button>
          {credit.logo && <button onClick={handleRemoveLogo} style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>REMOVE LOGO</button>}

          <button onClick={() => onRemove(credit.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
            DELETE PLATE
          </button>
        </div>
      </div>
    </div>
  );
};

const BeginningCredits = () => {
  const location = useLocation();
  const [credits, setCredits] = useState([
    { id: crypto.randomUUID(), role: '', names: [''], logo: '', overridePosition: 'NONE' }
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
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
    window.isProjectDirty = isDirty;
  }, [isDirty]);
  
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

  const [searchQuery, setSearchQuery] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('Opening_Titles');
  
  const handleExportClick = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.subscription_status || user.subscription_status !== 'active') {
      setShowPricingModal(true);
    } else {
      setShowExportModal(true);
    }
  };
  
  // Placement & Animation State
  const [startingQuadrant, setStartingQuadrant] = useState(1);
  const [appearanceDirection, setAppearanceDirection] = useState('FIX');
  const [activePlateIndex, setActivePlateIndex] = useState(0);
  
  const [fadeIn, setFadeIn] = useState(true);
  const [fadeInDuration, setFadeInDuration] = useState(1);
  const [fadeOut, setFadeOut] = useState(true);
  const [fadeOutDuration, setFadeOutDuration] = useState(1);
  
  const [blurIn, setBlurIn] = useState(false);
  const [blurInDuration, setBlurInDuration] = useState(1);
  const [blurOut, setBlurOut] = useState(false);
  const [blurOutDuration, setBlurOutDuration] = useState(1);
  
  const [titleColor, setTitleColor] = useState('#D4AF37');
  const [nameColor, setNameColor] = useState('#FFFFFF');

  useEffect(() => {
      if (!credits || credits.length === 0) return;
      if (activePlateIndex >= credits.length) {
          setActivePlateIndex(credits.length - 1);
      }
  }, [credits, activePlateIndex]);

  const platePositions = useMemo(() => {
      let patternIndex = 0;
      return credits.map(c => {
          if (c.overridePosition && c.overridePosition !== 'NONE') {
              return c.overridePosition;
          }
          const pos = getQuadrant(patternIndex, startingQuadrant, appearanceDirection);
          patternIndex++;
          return pos;
      });
  }, [credits, startingQuadrant, appearanceDirection]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const movePlate = (index, dir) => {
    if (dir === 'up' && index > 0) {
      setCredits((prev) => arrayMove(prev, index, index - 1));
      setActivePlateIndex(index - 1);
      setIsDirty(true);
    } else if (dir === 'down' && index < credits.length - 1) {
      setCredits((prev) => arrayMove(prev, index, index + 1));
      setActivePlateIndex(index + 1);
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
      setCredits([...credits, { id: crypto.randomUUID(), role: '', names: [''], logo: '', overridePosition: 'NONE' }]);
      setActivePlateIndex(credits.length); // switch to newly created plate
      setIsDirty(true);
  };
  const updateRow = (id, field, value) => { setCredits(credits.map(c => c.id === id ? { ...c, [field]: value } : c)); setIsDirty(true); };
  const removeRow = (id) => { setCredits(credits.filter(c => c.id !== id)); setIsDirty(true); };
  const addName = (id) => { setCredits(credits.map(c => c.id === id ? { ...c, names: [...c.names, ''] } : c)); setIsDirty(true); };
  const removeName = (id, idx) => { setCredits(credits.map(c => c.id === id ? { ...c, names: c.names.filter((_, i) => i !== idx) } : c)); setIsDirty(true); };
  const updateName = (id, idx, value) => { setCredits(credits.map(c => c.id === id ? { ...c, names: c.names.map((n, i) => i === idx ? value : n) } : c)); setIsDirty(true); };

  const resetProject = () => {
    setCredits([{ id: crypto.randomUUID(), role: '', names: [''], logo: '', overridePosition: 'NONE' }]);
    setActivePlateIndex(0);
    setShowNewProjectModal(false);
  };

  const handleSaveAndReset = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to save projects!");
      return;
    }
    try {
      await saveProject('BEGIN_Untitled', { credits });
      resetProject();
    } catch (e) {
      alert("Error saving project: " + e.message);
    }
  };

  const generatePsdBuffer = async () => {
    const docWidth = 1920;
    const docHeight = 1080;
    
    // Create black background canvas
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = docWidth;
    bgCanvas.height = docHeight;
    const ctx = bgCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, docWidth, docHeight);

    const children = [
      {
        name: "Background",
        canvas: bgCanvas
      }
    ];

    credits.forEach((c, i) => {
      const q = platePositions[i];
      let xPos, centerY;
      const justification = 'center';

      if (q === 'CENTER') {
          xPos = docWidth / 2;
          centerY = docHeight / 2;
      } else {
          const isLeft = (q === 1 || q === 4);
          const isTop = (q === 1 || q === 2);
          xPos = isLeft ? (docWidth / 4) : (docWidth * 3 / 4);
          centerY = isTop ? (docHeight / 4) : (docHeight * 3 / 4);
      }
      
      const roleHeight = c.role ? 60 : 0;
      const validNames = c.names.filter(n => n);
      const namesHeight = validNames.length * 100;
      const totalHeight = roleHeight + namesHeight;
      let currentY = centerY - (totalHeight / 2);

      const groupChildren = [];

      if (c.role) {
         groupChildren.push({
            name: "Title",
            left: 0, top: 0, right: docWidth, bottom: docHeight,
            text: {
                text: c.role,
                transform: [1, 0, 0, 1, xPos, currentY + 50],
                style: {
                    font: { name: 'ArialMT' },
                    fontSize: 50,
                    fillColor: hexToRgba(titleColor)
                },
                paragraphStyle: {
                    justification: justification
                }
            }
         });
         currentY += 60;
      }

      validNames.forEach(name => {
         groupChildren.push({
            name: "Name",
            left: 0, top: 0, right: docWidth, bottom: docHeight,
            text: {
                text: name,
                transform: [1, 0, 0, 1, xPos, currentY + 80],
                style: {
                    font: { name: 'ArialMT' },
                    fontSize: 80,
                    fillColor: hexToRgba(nameColor)
                },
                paragraphStyle: {
                    justification: justification
                }
            }
         });
         currentY += 100;
      });

      children.push({
          name: `Plate ${i + 1}`,
          opened: true,
          children: groupChildren
      });
    });

    const psdData = { width: docWidth, height: docHeight, channels: 3, bitsPerChannel: 8, colorMode: 3, children };
    return { buffer: writePsd(psdData), ext: '.psd' };
  };

  const handleExportToFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        alert("Your browser doesn't support folder selection. Please use Chrome or Edge.");
        return;
      }
      
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const folderName = `${exportFileName}_OpeningTitles`;
      const newDirHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });

      const { buffer, ext } = await generatePsdBuffer();
      const psdBlob = new Blob([buffer], { type: 'application/octet-stream' });
      const psdFilename = exportFileName + ext;
      const psdFileHandle = await newDirHandle.getFileHandle(psdFilename, { create: true });
      const psdWritable = await psdFileHandle.createWritable();
      await psdWritable.write(psdBlob);
      await psdWritable.close();

      const aeScript = `
// Antigravity Credits Studio - Opening Titles AE Importer
app.beginUndoGroup("Import Opening Titles PSD");
var psdFile = new File($.fileName).parent.getFiles("*.psd")[0] || new File($.fileName).parent.getFiles("*.psb")[0];
if (!psdFile) { psdFile = File.openDialog("Select your exported Opening Titles PSD file"); }

var bgVideo = File.openDialog("Select the Background Video (Cancel to skip and use 60s comp)");

if (psdFile !== null) {
    var duration = 60;
    var bgItem = null;
    if (bgVideo !== null) {
        bgItem = app.project.importFile(new ImportOptions(bgVideo));
        if (bgItem) duration = bgItem.duration;
    }
    
    var io = new ImportOptions(psdFile);
    if (io.canImportAs(ImportAsType.COMP_CROPPED_LAYERS)) {
        io.importAs = ImportAsType.COMP_CROPPED_LAYERS;
    } else {
        io.importAs = ImportAsType.COMP;
    }
    
    var importedPsd = app.project.importFile(io);
    
    if (importedPsd instanceof CompItem) {
        var numPlates = importedPsd.numLayers;
        var plateDuration = duration / numPlates;
        
        var mainComp = app.project.items.addComp("Opening Titles - ${exportFileName}", 1920, 1080, 1, duration, (bgItem ? bgItem.frameRate : 25));
        var fps = mainComp.frameRate;
        if (bgItem) mainComp.layers.add(bgItem);
        
        var doFadeIn = ${fadeIn};
        var fadeInDur = ${fadeInDuration} / fps;
        var doFadeOut = ${fadeOut};
        var fadeOutDur = ${fadeOutDuration} / fps;
        
        var doBlurIn = ${blurIn};
        var blurInDur = ${blurInDuration} / fps;
        var doBlurOut = ${blurOut};
        var blurOutDur = ${blurOutDuration} / fps;
        
        // Layers in PSD are numbered from top to bottom
        for (var i = 1; i <= numPlates; i++) {
            var copiedLayer = importedPsd.layer(i);
            copiedLayer.copyToComp(mainComp);
            var newLayer = mainComp.layer(1);
            
            var sliceIndex = i - 1;
            var inTime = sliceIndex * plateDuration;
            var outTime = inTime + plateDuration;
            
            newLayer.inPoint = inTime;
            newLayer.outPoint = outTime;
            
            if (doFadeIn) {
                newLayer.opacity.setValueAtTime(inTime, 0);
                newLayer.opacity.setValueAtTime(inTime + fadeInDur, 100);
            }
            if (doFadeOut) {
                newLayer.opacity.setValueAtTime(outTime - fadeOutDur, 100);
                newLayer.opacity.setValueAtTime(outTime, 0);
            }
            
            if (doBlurIn || doBlurOut) {
                var blurFx = newLayer.property("Effects").addProperty("ADBE Gaussian Blur 2");
                if (doBlurIn) {
                    blurFx.property("Blurriness").setValueAtTime(inTime, 50);
                    blurFx.property("Blurriness").setValueAtTime(inTime + blurInDur, 0);
                }
                if (doBlurOut) {
                    blurFx.property("Blurriness").setValueAtTime(outTime - blurOutDur, 0);
                    blurFx.property("Blurriness").setValueAtTime(outTime, 50);
                }
            }
        }
        mainComp.openInViewer();
        alert("Success! Opening Titles created and synced!");
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
      if (err.name !== 'AbortError') alert('Error exporting to folder: ' + err.message);
    }
  };

  const filteredCredits = credits.filter(c => !searchQuery || c.role.toLowerCase().includes(searchQuery.toLowerCase()) || c.names.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())));

  const renderButton = (type, content) => {
    const isActive = appearanceDirection === type;
    return (
        <button 
            onClick={() => setAppearanceDirection(type)} 
            style={{ 
                width: '60px', height: '60px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)', 
                border: `1px solid ${isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}`, 
                color: isActive ? 'var(--accent-gold)' : 'gray', 
                borderRadius: '8px', 
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {content}
        </button>
    );
  };

  const currentQuad = platePositions[activePlateIndex] || 1;
  const currentPlate = credits[activePlateIndex] || { role: '', names: [] };

  return (
    <section id="engine" style={{ background: 'var(--bg-primary)', height: '100vh', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem 0' }}>
        <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Beginning Credits <span className="cinematic-text">Designer</span></h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '210px 2.4fr 1.2fr', gap: '2rem', alignItems: 'start', height: 'calc(100vh - 5rem)', padding: '0 2rem' }}>
        
        {/* Left Sidebar */}
        <div className="custom-scrollbar" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 0 }}>
          <WordImporter credits={credits} setCredits={setCredits} moduleType="BEGIN" />
          <button onClick={addRow} className="btn-primary" style={{ padding: '0.8rem', background: 'var(--accent-gold)', color: 'black', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Plus size={18} style={{ marginRight: '8px' }} /> ADD NEW PLATE</button>
          <button onClick={() => setShowNewProjectModal(true)} className="btn-primary" style={{ padding: '0.8rem', background: 'transparent', border: '1px solid var(--accent-silver)', color: 'var(--accent-silver)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FilePlus size={18} style={{ marginRight: '8px' }} /> NEW PROJECT</button>
          <button onClick={handleExportClick} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#31A8FF', border: 'none', color: 'white', padding: '0.8rem' }}><Download size={18} /> EXPORT TO ADOBE</button>
          <ProjectPanel credits={credits} setCredits={setCredits} moduleType="BEGIN" onProjectSaved={() => setIsDirty(false)} />
          <UploadedFilesList setCredits={setCredits} moduleType="BEGIN" />
        </div>

        {/* Middle Canvas & Settings Area */}
        <div className="custom-scrollbar" style={{ height: '100%', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
            
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-start', justifyContent: 'center' }}>
                {/* Left-side Vertical Order Panel */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'flex-start' }}>
                    <p style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center', color: 'var(--accent-gold)', fontSize: '0.7rem', letterSpacing: '0.1em', margin: 0, fontWeight: 'bold' }}>APPEARANCE ORDER</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {renderButton('FIX', <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>FIX</span>)}
                        {renderButton('CENTER', <CenterSVG />)}
                        {renderButton('ALT_V', <AltVSVG />)}
                        {renderButton('ALT_H', <AltHSVG />)}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Horizontal row for Canvas and Color Panel */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ 
                            flex: 1, aspectRatio: '16/9', border: '1px solid var(--glass-border)', position: 'relative', background: '#050505', borderRadius: '4px', overflow: 'hidden'
                        }}>
                        {/* Safe Area Guides */}
                        <div style={{ position: 'absolute', inset: '10%', border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 1 }} />
                        <div style={{ position: 'absolute', inset: '5%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none', zIndex: 1 }} />
                        
                        {/* Central crosshair guides */}
                        <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none', zIndex: 1 }} />
                        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none', zIndex: 1 }} />
                        
                        {/* Quadrant Selection Grid */}
                        <div style={{ position: 'absolute', inset: '10%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '10px', zIndex: 30 }}>
                            {[1, 2, 4, 3].map(q => {
                                const isStart = startingQuadrant === q;
                                const isCurrent = currentQuad === q;
                                
                                return (
                                    <div 
                                        key={q} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Jump to next plate in this quadrant
                                            const nextIndex = platePositions.findIndex((pos, i) => pos === q && i > activePlateIndex);
                                            if (nextIndex !== -1) {
                                                setActivePlateIndex(nextIndex);
                                            } else {
                                                const firstIndex = platePositions.findIndex((pos) => pos === q);
                                                if (firstIndex !== -1) setActivePlateIndex(firstIndex);
                                            }
                                            setStartingQuadrant(q);
                                            // If we were in CENTER mode, this click should ideally switch the mode or jump
                                            setAppearanceDirection('FIX'); 
                                        }} 
                                        style={{ 
                                            border: isCurrent ? '2px solid var(--accent-gold)' : (isStart ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.05)'), 
                                            background: isCurrent ? 'rgba(212,175,55,0.1)' : 'transparent',
                                            opacity: (currentQuad === 'CENTER' && !isCurrent) ? 0.1 : 1,
                                            cursor: 'pointer', borderRadius: '8px', position: 'relative',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {(currentQuad !== 'CENTER' || isCurrent) && (
                                            <>
                                                <span style={{ position: 'absolute', top: '5px', left: '10px', color: isCurrent ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 'bold' }}>{q}</span>
                                                {isStart && <span style={{ position: 'absolute', top: '5px', right: '10px', color: 'var(--accent-gold)', fontSize: '0.6rem', opacity: isCurrent ? 1 : 0.4 }}>START</span>}
                                                
                                                {/* Live Text Preview for the Current Quadrant */}
                                                {isCurrent && currentPlate && (
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        inset: '1rem', 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        justifyContent: (q === 1 || q === 2) ? 'flex-start' : 'flex-end',
                                                        alignItems: (q === 1 || q === 4) ? 'flex-start' : 'flex-end',
                                                        textAlign: (q === 1 || q === 4) ? 'left' : 'right',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {currentPlate.role && <span style={{ color: titleColor, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>{currentPlate.role}</span>}
                                                        {currentPlate.names.map((n, idx) => (
                                                            <span key={idx} style={{ color: nameColor, fontSize: '1.2rem', whiteSpace: 'nowrap' }}>{n || 'NAME'}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Center Area Override Visualization */}
                        <div style={{ 
                            position: 'absolute', 
                            top: '30%', left: '30%', width: '40%', height: '40%',
                            pointerEvents: 'auto', 
                            cursor: 'pointer',
                            border: currentQuad === 'CENTER' ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            background: currentQuad === 'CENTER' ? 'rgba(212,175,55,0.1)' : 'transparent', 
                            opacity: (currentQuad !== 'CENTER') ? 0.2 : 1,
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            transition: 'all 0.3s',
                            zIndex: 40
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const nextIndex = platePositions.findIndex((pos, i) => pos === 'CENTER' && i > activePlateIndex);
                            if (nextIndex !== -1) {
                                setActivePlateIndex(nextIndex);
                            } else {
                                const firstIndex = platePositions.findIndex((pos) => pos === 'CENTER');
                                if (firstIndex !== -1) setActivePlateIndex(firstIndex);
                            }
                            setAppearanceDirection('CENTER');
                        }}>
                            {currentQuad === 'CENTER' && currentPlate && (
                                <div style={{ textAlign: 'center', overflow: 'hidden', padding: '10px' }}>
                                    {currentPlate.role && <span style={{ color: titleColor, fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px', display: 'block' }}>{currentPlate.role}</span>}
                                    {currentPlate.names.map((n, idx) => (
                                        <span key={idx} style={{ color: nameColor, fontSize: '1.2rem', whiteSpace: 'nowrap', display: 'block' }}>{n || 'NAME'}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                    
                    {/* Manual Slider for Plate Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                            <span style={{ fontWeight: 'bold' }}>PREVIEWING PLATE: <strong style={{ color: 'white' }}>{(activePlateIndex || 0) + 1} OF {credits?.length || 1}</strong></span>
                            <span style={{ color: 'var(--text-secondary)' }}>SLIDE TO PREVIEW</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max={Math.max(0, (credits?.length || 1) - 1)} 
                            value={activePlateIndex} 
                            onChange={(e) => setActivePlateIndex(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>
          </div>

        </div>

        {/* Right Section: Plates List */}
        <div className="custom-scrollbar" style={{ height: '100%', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-primary)', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Search plates for text..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', outline: 'none' }} />
            </div>

            {/* Animation Block */}
            <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ color: 'var(--accent-gold)', textAlign: 'center', letterSpacing: '0.1em', marginBottom: '1rem', fontSize: '0.9rem' }}>ANIMATION</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* In Row */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.1em', width: '50px' }}>IN</span>
                        <div style={{ display: 'flex', flex: 1, gap: '1rem', justifyContent: 'flex-start', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'white', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={fadeIn} onChange={(e) => setFadeIn(e.target.checked)} /> Fade
                                </label>
                                <input type="number" min="0" step="1" disabled={!fadeIn} value={fadeInDuration} onChange={(e) => setFadeInDuration(Number(e.target.value))} style={{ width: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: fadeIn ? 'white' : 'gray', padding: '0.2rem', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }} title="Duration (frames)" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'white', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={blurIn} onChange={(e) => setBlurIn(e.target.checked)} /> Blur
                                </label>
                                <input type="number" min="0" step="1" disabled={!blurIn} value={blurInDuration} onChange={(e) => setBlurInDuration(Number(e.target.value))} style={{ width: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: blurIn ? 'white' : 'gray', padding: '0.2rem', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }} title="Duration (frames)" />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: 'auto' }}>(in frames)</span>
                        </div>
                    </div>

                    {/* Out Row */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.1em', width: '50px' }}>OUT</span>
                        <div style={{ display: 'flex', flex: 1, gap: '1rem', justifyContent: 'flex-start', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'white', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={fadeOut} onChange={(e) => setFadeOut(e.target.checked)} /> Fade
                                </label>
                                <input type="number" min="0" step="1" disabled={!fadeOut} value={fadeOutDuration} onChange={(e) => setFadeOutDuration(Number(e.target.value))} style={{ width: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: fadeOut ? 'white' : 'gray', padding: '0.2rem', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }} title="Duration (frames)" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'white', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={blurOut} onChange={(e) => setBlurOut(e.target.checked)} /> Blur
                                </label>
                                <input type="number" min="0" step="1" disabled={!blurOut} value={blurOutDuration} onChange={(e) => setBlurOutDuration(Number(e.target.value))} style={{ width: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: blurOut ? 'white' : 'gray', padding: '0.2rem', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }} title="Duration (frames)" />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: 'auto' }}>(in frames)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Color Controls */}
            <div className="glass" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ color: 'var(--accent-gold)', textAlign: 'center', letterSpacing: '0.1em', margin: 0, fontSize: '0.9rem' }}>COLORS</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 'bold' }}>TITLE COLOR</span>
                        <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} style={{ background: 'transparent', border: 'none', width: '28px', height: '28px', cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 'bold' }}>NAME COLOR</span>
                        <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} style={{ background: 'transparent', border: 'none', width: '28px', height: '28px', cursor: 'pointer' }} />
                    </div>
                </div>
            </div>
            <div style={{ height: '2px', background: 'var(--accent-gold)', width: '100%', opacity: 0.6, borderRadius: '1px' }} />
          </div>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredCredits.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {filteredCredits.map((c, i) => (
                <SortableCreditRow 
                  key={c.id} 
                  credit={c} 
                  index={i} 
                  onPlateClick={setActivePlateIndex} 
                  onUpdate={updateRow} 
                  onRemove={removeRow} 
                  onAddName={addName} 
                  onRemoveName={removeName} 
                  onUpdateName={updateName} 
                  onMoveUp={(idx) => movePlate(idx, 'up')}
                  onMoveDown={(idx) => movePlate(idx, 'down')}
                  isFirst={i === 0}
                  isLast={i === filteredCredits.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

      </div>

      {/* Modals */}
      {showPricingModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
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
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setShowExportModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', textAlign: 'center' }}>EXPORT TO ADOBE</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>PROJECT NAME</label>
              <input type="text" value={exportFileName} onChange={(e) => setExportFileName(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }} />
            </div>
            <button onClick={handleExportToFolder} className="btn-primary" style={{ width: '100%', background: '#9933FF', color: 'white', border: 'none', padding: '1rem' }}>EXPORT FOLDER TO COMPUTER</button>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setShowNewProjectModal(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', textAlign: 'center' }}>NEW PROJECT</h3>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Do you want to save the current project before creating a new one? Any unsaved changes will be lost.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleSaveAndReset} className="btn-primary" style={{ width: '100%', background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '1rem' }}>SAVE & CREATE NEW</button>
              <button onClick={resetProject} className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '1rem' }}>DISCARD & CREATE NEW</button>
              <button onClick={() => setShowNewProjectModal(false)} className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BeginningCredits;
