import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';


export const PageContainer = ({ children, className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "min-h-screen",
      theme === 'dark' 
        ? 'bg-black text-white'
        : theme === 'gradient'
        ? 'bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a3a52] text-white'
        : 'bg-gray-50 text-gray-900',
      className
    )}>
      {children}
    </div>
  );
};


export const ThemedCard = ({ children, className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "rounded-2xl shadow-lg border overflow-hidden",
      theme === 'dark'
        ? 'bg-zinc-900 border-red-900/30 text-white'
        : theme === 'gradient'
        ? 'bg-white/10 backdrop-blur-md border-white/20 text-white'
        : 'bg-white border-gray-200 text-gray-900',
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Input component with proper theme support
 */
export const ThemedInput = ({ className = '', ...props }) => {
  const { theme } = useTheme();
  
  return (
    <input
      className={cn(
        "w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors",
        theme === 'dark'
          ? 'bg-zinc-800 border border-red-900/30 text-white placeholder:text-gray-500 focus:ring-orange-500'
          : theme === 'gradient'
          ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:ring-white/50'
          : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500',
        className
      )}
      {...props}
    />
  );
};


export const getTextColor = (theme, variant = 'primary') => {
  const colors = {
    primary: {
      dark: 'text-white',
      gradient: 'text-white',
      light: 'text-gray-900'
    },
    secondary: {
      dark: 'text-gray-400',
      gradient: 'text-white/70',
      light: 'text-gray-600'
    },
    muted: {
      dark: 'text-gray-500',
      gradient: 'text-white/50',
      light: 'text-gray-400'
    }
  };
  
  return colors[variant][theme] || colors.primary[theme];
};

/**
 * Get theme-appropriate background color classes
 */
export const getBgColor = (theme, variant = 'primary') => {
  const colors = {
    primary: {
      dark: 'bg-zinc-900',
      gradient: 'bg-white/10 backdrop-blur-md',
      light: 'bg-white'
    },
    secondary: {
      dark: 'bg-zinc-800',
      gradient: 'bg-white/5 backdrop-blur-sm',
      light: 'bg-gray-50'
    },
    hover: {
      dark: 'hover:bg-zinc-800',
      gradient: 'hover:bg-white/15',
      light: 'hover:bg-gray-100'
    }
  };
  
  return colors[variant][theme] || colors.primary[theme];
};

/**
 * Get theme-appropriate border color classes
 */
export const getBorderColor = (theme) => {
  return theme === 'dark' 
    ? 'border-red-900/30'
    : theme === 'gradient'
    ? 'border-white/20'
    : 'border-gray-200';
};
