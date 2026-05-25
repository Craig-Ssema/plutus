import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Flame } from 'lucide-react';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all
        ${theme === 'dark' 
          ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/50' 
          : 'bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 shadow-lg'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {theme === 'dark' ? (
        <>
          <Flame className="w-4 h-4" />
          <span>Dark Theme</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          <span>Gradient Theme</span>
        </>
      )}
    </motion.button>
  );
};

export default ThemeSwitcher;
