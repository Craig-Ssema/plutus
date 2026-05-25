import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TradeGuest = () => {
    const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Professional Trading Terminal - Plutus</title>
        <meta name="description" content="Sign in to access our powerful trading terminal with lightning-fast execution and an institutional-grade toolset." />
      </Helmet>
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-indigo-100 text-indigo-600 p-4 rounded-full mb-6">
                <Layers className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Institutional-Grade Trading Awaits
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Sign in to our professional trading terminal and execute your strategy with precision, speed, and confidence.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left mb-12">
                <FeatureCard icon={<Zap />} title="Swift Execution" description="Place orders in milliseconds with our low-latency matching engine." />
                <FeatureCard icon={<Layers />} title="Full Order Book" description="Gain deep market insights with real-time, level-2 order data." />
                <FeatureCard icon={<Shield />} title="Total Security" description="Trade with peace of mind, knowing your assets are secure." />
            </div>

            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 text-lg rounded-xl shadow-lg"
            >
              Sign In to Start Trading
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-indigo-600 mb-3">{React.cloneElement(icon, { className: 'w-8 h-8' })}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
    </div>
);

export default TradeGuest;