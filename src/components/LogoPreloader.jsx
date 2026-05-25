import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LogoPreloader = ({ onComplete, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
        >
          {/* Rocket Launch Container */}
          <motion.div
            initial={{ y: '100vh', scale: 0.5 }}
            animate={{ 
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 1.2,
              ease: [0.34, 1.56, 0.64, 1], // Bouncy easing for rocket effect
              times: [0, 1]
            }}
            className="relative"
          >
            {/* Black Glow Effect - Multiple Layers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.8, 0.6],
                scale: [0.8, 1.3, 1.1]
              }}
              transition={{
                duration: 1.2,
                times: [0, 0.5, 1],
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full bg-black/40 blur-3xl"
              style={{ width: '200%', height: '200%', left: '-50%', top: '-50%' }}
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0.7],
                scale: [0.5, 1.5, 1.2]
              }}
              transition={{
                duration: 1.2,
                times: [0, 0.5, 1],
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full bg-gray-900/60 blur-2xl"
              style={{ width: '150%', height: '150%', left: '-25%', top: '-25%' }}
            />

            {/* Rocket Trail Effect */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scaleY: [0, 2, 0]
              }}
              transition={{
                duration: 1,
                times: [0, 0.3, 1],
                ease: "easeOut"
              }}
              className="absolute left-1/2 -translate-x-1/2 top-full w-24 h-32 bg-gradient-to-b from-gray-400/40 to-transparent blur-md"
            />
            
            {/* Logo with Rotation */}
            <motion.img
              src="https://horizons-cdn.hostinger.com/e58ae648-723a-4420-8647-7c7ee1e194f2/f42229095b1d7daa1fdbcebdf348f39f.gif"
              alt="Plutus Logo"
              className="h-32 w-32 relative z-10"
              initial={{ rotate: -45 }}
              animate={{ 
                rotate: 360,
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut"
              }}
              style={{
                filter: 'drop-shadow(0 0 30px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 15px rgba(0, 0, 0, 0.6))'
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoPreloader;
