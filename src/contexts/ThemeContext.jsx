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
  // Plutus uses a single professional light theme.
  // The theme API surface is kept intact so existing components don't break,
  // but 'light' is now the only theme.
  const [theme] = useState('light');

  useEffect(() => {
    localStorage.setItem('plutus-theme', 'light');
    document.documentElement.classList.remove('theme-dark', 'theme-gradient');
    document.documentElement.classList.add('theme-light');
    document.body.classList.remove('theme-dark', 'theme-gradient');
    document.body.classList.add('theme-light');
  }, []);

  const setTheme = () => {};
  const toggleTheme = () => {};

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: false,
    isLight: true,
    isGradient: false
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
