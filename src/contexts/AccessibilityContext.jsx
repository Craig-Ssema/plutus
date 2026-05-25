import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(16); // Base font size
  const [contrast, setContrast] = useState('normal'); // 'normal' or 'high'
  const [seizureSafe, setSeizureSafe] = useState(false);
  const [visionImpaired, setVisionImpaired] = useState(false);
  const [adhdFriendly, setAdhdFriendly] = useState(false);
  const [readingMask, setReadingMask] = useState({
    enabled: false,
    y: 0,
    height: 100
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('contrast-high', 'contrast-normal');
    root.classList.add(`contrast-${contrast}`);
    root.style.fontSize = `${fontSize}px`;
  }, [fontSize, contrast]);

  // Track mouse position for reading mask
  useEffect(() => {
    if (readingMask.enabled) {
      const handleMouseMove = (e) => {
        setReadingMask(prev => ({
          ...prev,
          y: e.clientY
        }));
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [readingMask.enabled]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));
  const toggleContrast = () => setContrast(prev => prev === 'normal' ? 'high' : 'normal');
  const toggleSeizureSafe = () => setSeizureSafe(prev => !prev);
  const toggleVisionImpaired = () => setVisionImpaired(prev => !prev);
  const toggleAdhdFriendly = () => setAdhdFriendly(prev => !prev);
  const toggleReadingMask = () => setReadingMask(prev => ({ ...prev, enabled: !prev.enabled }));
  
  const resetAccessibility = () => {
    setFontSize(16);
    setContrast('normal');
    setSeizureSafe(false);
    setVisionImpaired(false);
    setAdhdFriendly(false);
    setReadingMask({ enabled: false, y: 0, height: 100 });
  };

  const value = useMemo(() => ({
    fontSize,
    contrast,
    seizureSafe,
    visionImpaired,
    adhdFriendly,
    readingMask,
    increaseFontSize,
    decreaseFontSize,
    toggleContrast,
    toggleSeizureSafe,
    toggleVisionImpaired,
    toggleAdhdFriendly,
    toggleReadingMask,
    resetAccessibility,
  }), [fontSize, contrast, seizureSafe, visionImpaired, adhdFriendly, readingMask]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
