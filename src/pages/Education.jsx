import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { PlayCircle, BookOpen, TrendingUp, Award } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const Education = () => {
  const { theme } = useTheme();
  const tutorials = [
    {
      title: 'Getting Started with Trading',
      duration: '12:34',
      level: 'Beginner',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'Modern trading platform interface with charts',
    },
    {
      title: 'Technical Analysis Fundamentals',
      duration: '18:45',
      level: 'Intermediate',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'Technical analysis charts and indicators',
    },
    {
      title: 'Risk Management Strategies',
      duration: '15:22',
      level: 'Intermediate',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'Risk management concept with portfolio',
    },
    {
      title: 'Advanced Trading Techniques',
      duration: '22:10',
      level: 'Advanced',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'Advanced trading strategies visualization',
    },
    {
      title: 'Market Psychology',
      duration: '16:55',
      level: 'Intermediate',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'Market psychology and trader mindset',
    },
    {
      title: 'Portfolio Diversification',
      duration: '14:30',
      level: 'Beginner',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'Diversified investment portfolio concept',
    },
  ];

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-700';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-700';
      case 'Advanced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Helmet>
        <title>Education - TradeFlow</title>
        <meta name="description" content="Learn trading with our comprehensive video tutorials and educational resources for all skill levels." />
      </Helmet>

      <div className={cn(
        "pt-16 min-h-screen",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? '' : 'bg-gray-50'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className={cn(
              "text-4xl md:text-5xl font-bold mb-4",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>Education Center</h1>
            <p className={cn(
              "text-xl",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>Master trading with expert-led tutorials</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className={cn(
              "rounded-2xl p-6 shadow-lg",
              theme === 'dark'
                ? 'bg-zinc-900 border border-red-900/30'
                : theme === 'gradient'
                ? 'bg-white/20 backdrop-blur-md border border-white/30'
                : 'bg-white'
            )}>
              <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className={cn(
                "text-xl font-semibold mb-2",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Comprehensive Guides</h3>
              <p className={cn(
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>Step-by-step tutorials for every skill level</p>
            </div>
            <div className={cn(
              "rounded-2xl p-6 shadow-lg",
              theme === 'dark'
                ? 'bg-zinc-900 border border-red-900/30'
                : theme === 'gradient'
                ? 'bg-white/20 backdrop-blur-md border border-white/30'
                : 'bg-white'
            )}>
              <TrendingUp className="w-10 h-10 text-green-600 mb-4" />
              <h3 className={cn(
                "text-xl font-semibold mb-2",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Real-World Examples</h3>
              <p className={cn(
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>Learn from actual market scenarios</p>
            </div>
            <div className={cn(
              "rounded-2xl p-6 shadow-lg",
              theme === 'dark'
                ? 'bg-zinc-900 border border-red-900/30'
                : theme === 'gradient'
                ? 'bg-white/20 backdrop-blur-md border border-white/30'
                : 'bg-white'
            )}>
              <Award className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className={cn(
                "text-xl font-semibold mb-2",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Expert Instructors</h3>
              <p className={cn(
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>Learn from professional traders</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tutorials.map((tutorial, index) => (
              <motion.a
                key={index}
                href={`https://www.youtube.com/watch?v=${tutorial.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={cn(
                  "rounded-2xl overflow-hidden shadow-lg hover:shadow-xl group",
                  theme === 'dark'
                    ? 'bg-zinc-900 border border-red-900/30'
                    : theme === 'gradient'
                    ? 'bg-white/20 backdrop-blur-md border border-white/30'
                    : 'bg-white'
                )}
              >
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <img alt={tutorial.title} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1700142909513-63c574cdda3f" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-white opacity-90 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {tutorial.duration}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(tutorial.level)}`}>
                      {tutorial.level}
                    </span>
                  </div>
                  <h3 className={cn(
                    "text-lg font-semibold group-hover:text-blue-600",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {tutorial.title}
                  </h3>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Education;