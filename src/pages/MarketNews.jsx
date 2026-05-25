import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import News from '@/components/hub/News';

const MarketNews = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <>
      <Helmet>
        <title>Market News - Plutus</title>
        <meta name="description" content="Stay updated with the latest market trends and financial news." />
      </Helmet>
      
      <div className={cn(
        "min-h-screen pt-20 pb-8 px-4",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' : 'bg-gray-50'
      )}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/hub')}
              className={cn(
                "flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-gray-400 hover:text-white'
                  : 'hover:bg-white/60 text-gray-600'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hub
            </button>
            <h1 className={cn(
              "text-4xl font-bold tracking-tight mb-2",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Market News
            </h1>
            <p className={cn(
              "text-lg",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Stay informed with the latest market trends and breaking news
            </p>
          </motion.div>

          {/* News Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <News />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MarketNews;
