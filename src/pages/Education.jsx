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
        return 'bg-emerald-50 text-emerald-700';
      case 'Intermediate':
        return 'bg-blue-50 text-blue-700';
      case 'Advanced':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Helmet>
        <title>Education - Plutus</title>
        <meta name="description" content="Learn trading with our comprehensive video tutorials and educational resources for all skill levels." />
      </Helmet>

      <div className="pt-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-gray-900">Education Center</h1>
            <p className="text-sm text-gray-600">Master trading with expert-led tutorials</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="plutus-card p-6">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1.5 text-gray-900">Comprehensive Guides</h3>
              <p className="text-sm text-gray-600">Step-by-step tutorials for every skill level</p>
            </div>
            <div className="plutus-card p-6">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1.5 text-gray-900">Real-World Examples</h3>
              <p className="text-sm text-gray-600">Learn from actual market scenarios</p>
            </div>
            <div className="plutus-card p-6">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1.5 text-gray-900">Expert Instructors</h3>
              <p className="text-sm text-gray-600">Learn from professional traders</p>
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
                className="plutus-card plutus-card-hover overflow-hidden group"
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
                  <h3 className="text-base font-semibold group-hover:text-blue-600 text-gray-900 transition-colors">
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