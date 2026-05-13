// src/utils/wordParser.js
// Parses a .docx file using jszip to directly extract xml
// Any text run with a red hue (hue < 20° or > 340°) is considered a title.
// Black or non‑red runs are considered names belonging to the most recent title.

import JSZip from 'jszip';

// Helper: check if a color should be treated as a title (anything not black)
function isTitleColor(rgb) {
  // rgb is like "#FF3333" or "FF3333"
  const hex = rgb.replace(/^#/, "");
  if (!hex || hex.length !== 6 || hex === "000000" || hex.toLowerCase() === "auto") return false;
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // If the color is extremely dark (near black), treat it as black (false)
  if (r < 30 && g < 30 && b < 30) return false;
  
  // Otherwise, it's considered a title color
  return true;
}

export async function parseDocxFile(file) {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  // get the raw xml string
  const documentXml = await loadedZip.file("word/document.xml").async("text");
  
  // Parse relationships for images
  let relMap = {};
  const relsFile = loadedZip.file("word/_rels/document.xml.rels");
  if (relsFile) {
    const relsXmlText = await relsFile.async("text");
    const parser = new DOMParser();
    const relsDoc = parser.parseFromString(relsXmlText, "application/xml");
    const relElements = relsDoc.getElementsByTagName("Relationship");
    for (let rel of relElements) {
        relMap[rel.getAttribute("Id")] = rel.getAttribute("Target");
    }
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, "application/xml");
  
  // Use namespace-aware tag selection or fallback to local name
  const paragraphs = xmlDoc.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "p");
  const pList = paragraphs.length > 0 ? paragraphs : xmlDoc.getElementsByTagName("w:p");

  const plates = [];
  let currentPlate = null;

  for (let p of pList) {
    const runs = p.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "r");
    const rList = runs.length > 0 ? runs : p.getElementsByTagName("w:r");
    
    let titleAccumulator = "";
    let nameAccumulator = "";
    let lastColorWasTitle = false;

    for (let r of rList) {
      const texts = r.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "t");
      const tList = texts.length > 0 ? texts : r.getElementsByTagName("w:t");
      if (tList.length === 0) continue;
      
      let text = "";
      for (let t of tList) {
        text += t.textContent;
      }
      if (!text) continue;

      // Check color
      const colors = r.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "color");
      const cList = colors.length > 0 ? colors : r.getElementsByTagName("w:color");
      
      let isTitleRun = false;
      if (cList.length > 0) {
        const valAttr = cList[0].getAttribute("w:val") || cList[0].getAttribute("val");
        if (valAttr) {
          isTitleRun = isTitleColor(valAttr);
        }
      }
      
      // If the run is pure whitespace, it inherits the color of the preceding text to avoid word splitting
      if (text.trim() === "") {
        isTitleRun = lastColorWasTitle;
      }

      if (isTitleRun) {
        titleAccumulator += text;
      } else {
        nameAccumulator += text;
      }
      
      lastColorWasTitle = isTitleRun;
    }

    const trimmedTitle = titleAccumulator.trim();
    const cleanName = nameAccumulator.replace(/^[\s:-]+/, '').trim();

    // Look for images in this paragraph
    const drawings = p.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "drawing");
    const dList = drawings.length > 0 ? drawings : p.getElementsByTagName("w:drawing");
    let imageDataUrl = null;

    if (dList.length > 0) {
        for (let d of dList) {
            const blips = d.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "blip");
            const bList = blips.length > 0 ? blips : d.getElementsByTagName("a:blip");
            if (bList.length > 0) {
                const rId = bList[0].getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed") || bList[0].getAttribute("r:embed");
                if (rId && relMap[rId]) {
                    // target paths are usually like "media/image1.jpeg" relative to "word/"
                    let targetPath = relMap[rId];
                    if (!targetPath.startsWith("word/")) {
                        targetPath = "word/" + targetPath;
                    }
                    const imageFile = loadedZip.file(targetPath);
                    if (imageFile) {
                        const base64 = await imageFile.async("base64");
                        const ext = targetPath.split('.').pop().toLowerCase();
                        const mime = ext === 'png' ? 'image/png' : (ext === 'jpeg' || ext === 'jpg' ? 'image/jpeg' : 'image/png');
                        imageDataUrl = `data:${mime};base64,${base64}`;
                        break; // only take the first image found in the paragraph
                    }
                }
            }
        }
    }

    if (!trimmedTitle && !cleanName && !imageDataUrl) continue; // skip completely empty lines

    if (trimmedTitle) {
      // We found a title! Start a new plate.
      currentPlate = { 
        id: crypto.randomUUID(), 
        role: trimmedTitle, 
        names: [], 
        language: 'en',
        fontSize: '20px',
        logo: ''
      };
      plates.push(currentPlate);
    }

    if (cleanName) {
      // We found a name! Attach it to the current plate.
      if (!currentPlate) {
        currentPlate = { 
          id: crypto.randomUUID(), 
          role: "", 
          names: [],
          language: 'en',
          fontSize: '20px',
          logo: ''
        };
        plates.push(currentPlate);
      }
      currentPlate.names.push(cleanName);
    }

    if (imageDataUrl) {
      if (!currentPlate) {
        currentPlate = { 
          id: crypto.randomUUID(), 
          role: "", 
          names: [],
          language: 'en',
          fontSize: '20px',
          logo: ''
        };
        plates.push(currentPlate);
      }
      currentPlate.logo = imageDataUrl;
    }
  }

  // Ensure each plate has at least one name (even empty string)
  plates.forEach(p => {
    if (p.names.length === 0) p.names = [""];
  });

  return plates;
}
