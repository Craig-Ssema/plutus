import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Community from '@/components/hub/Community';

const CommunityPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Community - Plutus</title>
        <meta name="description" content="Connect with traders worldwide and share insights." />
      </Helmet>

      <div className="min-h-screen pt-20 pb-6 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Slim Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3"
          >
            <button
              onClick={() => navigate('/hub')}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              title="Back to Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
                Community
              </h1>
              <p className="text-sm text-gray-500">
                Connect with traders worldwide
              </p>
            </div>
          </motion.div>

          {/* Community Content */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Community />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;
