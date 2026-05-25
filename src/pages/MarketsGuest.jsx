import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, TrendingUp, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const MarketsGuest = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
  return (
    <>
      <Helmet>
        <title>Explore Markets - Plutus</title>
        <meta name="description" content="Discover global markets. Sign in for real-time data, advanced charting, and powerful trading tools." />
      </Helmet>
      <div className={cn(
        "pt-16 min-h-screen flex items-center justify-center",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? '' : 'bg-gray-50'
      )}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={cn(
              "inline-block p-4 rounded-full mb-6",
              theme === 'dark'
                ? 'bg-red-900/30 text-orange-400'
                : 'bg-blue-100 text-blue-600'
            )}>
                <BarChart className="w-12 h-12" />
            </div>
            <h1 className={cn(
              "text-4xl md:text-6xl font-bold mb-4 tracking-tight",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Unlock Real-Time Market Insights
            </h1>
            <p className={cn(
              "text-xl max-w-2xl mx-auto mb-10",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Sign in to access live prices, interactive charts, and analysis tools for thousands of assets across global markets.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left mb-12">
                <FeatureCard theme={theme} icon={<TrendingUp />} title="Live Data" description="Track every tick with real-time data streams from global exchanges." />
                <FeatureCard theme={theme} icon={<BarChart />} title="Advanced Charting" description="Utilize professional-grade tools to analyze market trends." />
                <FeatureCard theme={theme} icon={<Lock />} title="Secure Access" description="Your journey into the markets is protected with top-tier security." />
            </div>

            <Button
              onClick={() => navigate('/')}
              size="lg"
              className={cn(
                "text-white px-10 py-6 text-lg rounded-xl shadow-lg transition-all",
                theme === 'dark'
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-lg hover:shadow-red-500/50'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              Sign In to View Markets
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

const FeatureCard = ({ icon, title, description, theme }) => (
    <div className={cn(
      "p-6 rounded-2xl shadow-sm border",
      theme === 'dark'
        ? 'bg-zinc-900 border-red-900/30'
        : theme === 'gradient'
        ? 'bg-white/20 backdrop-blur-md border-white/30'
        : 'bg-white border-gray-100'
    )}>
        <div className={cn(
          "mb-3",
          theme === 'dark' ? 'text-orange-400' : 'text-blue-600'
        )}>{React.cloneElement(icon, { className: 'w-8 h-8' })}</div>
        <h3 className={cn(
          "text-xl font-semibold mb-2",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>{title}</h3>
        <p className={cn(
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>{description}</p>
    </div>
);

export default MarketsGuest;