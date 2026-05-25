import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Newspaper, MessageSquare } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import News from '@/components/hub/News';
import Community from '@/components/hub/Community';

const Hub = () => {
  const [activeTab, setActiveTab] = useState('news');
  const { theme } = useTheme();

  const tabs = [
    { id: 'news', name: 'Market News', icon: Newspaper },
    { id: 'community', name: 'Community', icon: MessageSquare },
  ];

  return (
    <>
      <Helmet>
        <title>Hub - Plutus</title>
        <meta name="description" content="Stay updated with market news and connect with the trading community." />
      </Helmet>
      
      <div className={cn(
        "min-h-screen pt-20 pb-8 px-4",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? '' : 'bg-gray-50'
      )}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className={cn(
              "text-4xl font-bold tracking-tight mb-2",
              theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-gray-900' : 'text-gray-900'
            )}>
              Trading Hub
            </h1>
            <p className={cn(
              "text-lg",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-800' : 'text-gray-600'
            )}>
              Stay informed and connect with traders worldwide
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className={cn(
            "flex space-x-2 mb-6 p-1 rounded-xl",
            theme === 'dark'
              ? 'bg-zinc-900 border border-red-900/30'
              : theme === 'gradient'
              ? 'bg-white/20 backdrop-blur-md border border-white/30'
              : 'bg-white border border-gray-200'
          )}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30'
                      : theme === 'gradient'
                      ? 'bg-white/40 backdrop-blur-md text-gray-900 shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-red-900/20'
                      : theme === 'gradient'
                    ? 'text-gray-800 hover:text-gray-900 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'news' && <News />}
              {activeTab === 'community' && <Community />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Hub;
