import React from 'react';
import { motion } from 'framer-motion';

const AnimatedGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 138, 101, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(138, 180, 248, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255, 138, 101, 0.3) 0%, transparent 50%), radial-gradient(circle at 60% 20%, rgba(138, 180, 248, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 60% 70%, rgba(255, 138, 101, 0.3) 0%, transparent 50%), radial-gradient(circle at 30% 90%, rgba(138, 180, 248, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 138, 101, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(138, 180, 248, 0.3) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 10,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(120, 119, 198, 0.8) 0%, transparent 70%)'
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(255, 138, 101, 0.8) 0%, transparent 70%)'
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 7,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(138, 180, 248, 0.8) 0%, transparent 70%)'
        }}
        animate={{
          x: [-50, 50, -50],
          y: [-50, 50, -50],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 9,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
    </div>
  );
};

export default AnimatedGradientBackground;
