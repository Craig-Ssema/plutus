import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: 'dark',
      name: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes',
      preview: 'bg-gradient-to-br from-zinc-900 to-black',
      iconColor: 'text-purple-400'
    },
    {
      id: 'light', 
      name: 'Light',
      icon: Sun,
      description: 'Clean and bright',
      preview: 'bg-gradient-to-br from-gray-50 to-white',
      iconColor: 'text-yellow-500'
    },
    {
      id: 'gradient',
      name: 'Gradient',
      icon: Sparkles,
      description: 'Dynamic and modern',
      preview: 'bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700',
      iconColor: 'text-blue-400'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className={cn(
          "text-lg font-semibold mb-2",
          theme === 'dark' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'
        )}>
          Theme Preference
        </h3>
        <p className={cn(
          "text-sm mb-4",
          theme === 'dark' ? 'text-gray-400' : theme === 'light' ? 'text-gray-600' : 'text-white/70'
        )}>
          Choose your preferred visual theme
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.id;
          
          return (
            <motion.button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all",
                isSelected 
                  ? theme === 'dark'
                    ? "border-purple-500 bg-purple-900/20"
                    : theme === 'light'
                    ? "border-blue-500 bg-blue-50"
                    : "border-white/50 bg-white/10"
                  : theme === 'dark'
                    ? "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                    : theme === 'light'
                    ? "border-gray-200 bg-white hover:border-gray-300"
                    : "border-white/20 bg-white/5 hover:border-white/30"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="selectedTheme"
                  className={cn(
                    "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center",
                    theme === 'dark' ? "bg-purple-500" : theme === 'light' ? "bg-blue-500" : "bg-white"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
              
              <div className="space-y-3">
                {/* Preview */}
                <div className={cn(
                  "h-12 rounded-lg shadow-inner",
                  themeOption.preview
                )} />
                
                {/* Icon and Name */}
                <div className="flex flex-col items-center space-y-1">
                  <Icon className={cn("w-5 h-5", themeOption.iconColor)} />
                  <span className={cn(
                    "font-medium text-sm",
                    theme === 'dark' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'
                  )}>
                    {themeOption.name}
                  </span>
                  <span className={cn(
                    "text-xs",
                    theme === 'dark' ? 'text-gray-500' : theme === 'light' ? 'text-gray-500' : 'text-white/60'
                  )}>
                    {themeOption.description}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
