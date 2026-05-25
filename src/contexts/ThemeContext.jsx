import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('plutus-theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem('plutus-theme', theme);
    
    // Update document class for global styles
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-gradient');
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Also update body class for gradient theme
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-gradient');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const toggleTheme = () => {
    // Cycle through: dark -> light -> gradient -> dark
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'gradient';
      return 'dark';
    });
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isGradient: theme === 'gradient'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
