import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Newspaper, MessageSquare, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const HubLanding = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const cards = [
    {
      id: 'news',
      title: 'Market News',
      description: 'Stay updated with the latest market trends, breaking news, and financial insights from top sources.',
      icon: Newspaper,
      route: '/hub/news',
      color: 'blue',
      stats: [
        { label: 'Daily Updates', value: '50+', icon: TrendingUp },
        { label: 'News Sources', value: '15+', icon: Newspaper }
      ],
      features: [
        'Real-time market updates',
        'Crypto & stock news',
        'Expert analysis',
        'Breaking news alerts'
      ]
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Connect with traders worldwide, share insights, and learn from experienced investors in our vibrant community.',
      icon: MessageSquare,
      route: '/hub/community',
      color: 'purple',
      stats: [
        { label: 'Active Users', value: '10K+', icon: Users },
        { label: 'Daily Posts', value: '500+', icon: MessageSquare }
      ],
      features: [
        'Discussion forums',
        'Trading strategies',
        'Expert Q&A',
        'Community polls'
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Trading Hub - Plutus</title>
        <meta name="description" content="Access market news and connect with the trading community." />
      </Helmet>
      
      <div className={cn(
        "min-h-screen pt-20 pb-12 px-4",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' : 'bg-gray-50'
      )}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className={cn(
              "text-5xl font-bold tracking-tight mb-4",
              theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
            )}>
              Trading Hub
            </h1>
            <p className={cn(
              "text-xl max-w-2xl mx-auto",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
            )}>
              Your central destination for market insights and community connections
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(card.route)}
                className={cn(
                  "relative group cursor-pointer rounded-2xl p-8 transition-all duration-300",
                  theme === 'dark'
                    ? 'bg-zinc-900 border border-red-900/30 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/20'
                    : theme === 'gradient'
                    ? 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-[1.02]'
                    : 'bg-white border border-gray-200 hover:border-blue-500/50 hover:shadow-xl'
                )}
              >
                {/* Icon & Title */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-4 rounded-xl",
                      theme === 'dark'
                        ? card.color === 'blue'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-purple-900/30 text-purple-400'
                        : card.color === 'blue'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                    )}>
                      <card.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className={cn(
                        "text-2xl font-bold mb-1",
                        theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                      )}>
                        {card.title}
                      </h2>
                    </div>
                  </div>
                  <ArrowRight className={cn(
                    "w-6 h-6 transition-transform group-hover:translate-x-1",
                    theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/50' : 'text-gray-600'
                  )} />
                </div>

                {/* Description */}
                <p className={cn(
                  "text-base mb-6",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>
                  {card.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {card.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className={cn(
                        "p-4 rounded-lg",
                        theme === 'dark' ? 'bg-zinc-800' : theme === 'gradient' ? 'bg-white/5' : 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={cn(
                          "w-4 h-4",
                          theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/50' : 'text-gray-600'
                        )} />
                        <p className={cn(
                          "text-xs",
                          theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/50' : 'text-gray-600'
                        )}>
                          {stat.label}
                        </p>
                      </div>
                      <p className={cn(
                        "text-2xl font-bold",
                        theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                      )}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {card.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        card.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                      )} />
                      <span className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-white/80' : 'text-gray-700'
                      )}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hover Effect */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                  card.color === 'blue'
                    ? 'bg-gradient-to-br from-blue-500/5 to-transparent'
                    : 'bg-gradient-to-br from-purple-500/5 to-transparent'
                )} />
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "mt-12 p-6 rounded-xl text-center",
              theme === 'dark'
                ? 'bg-zinc-900 border border-red-900/30'
                : theme === 'gradient'
                ? 'bg-white/10 backdrop-blur-md border border-white/20'
                : 'bg-white border border-gray-200'
            )}
          >
            <p className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
            )}>
              Choose a section above to explore market insights and connect with the community
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default HubLanding;
