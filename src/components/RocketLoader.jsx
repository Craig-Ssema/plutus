import React from 'react';
import { motion } from 'framer-motion';

const RocketLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a3a52]">
      <div className="relative">
        {/* Rocket Logo Animation */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ 
            y: -200,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            times: [0, 0.2, 0.8, 1],
            ease: "easeOut"
          }}
          className="relative z-10"
        >
          <motion.img
            src="https://horizons-cdn.hostinger.com/e58ae648-723a-4420-8647-7c7ee1e194f2/f42229095b1d7daa1fdbcebdf348f39f.gif"
            alt="Plutus"
            className="h-24 w-24"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Speed Trail Effect 1 */}
        <motion.div
          initial={{ y: 120, opacity: 0, scaleY: 0 }}
          animate={{ 
            y: [120, 0, -100],
            opacity: [0, 0.8, 0],
            scaleY: [0, 1.5, 0.5]
          }}
          transition={{
            duration: 2,
            times: [0, 0.3, 1],
            ease: "easeOut"
          }}
          className="absolute left-1/2 -translate-x-1/2 top-20 w-16 h-32 bg-gradient-to-b from-orange-500/60 via-red-500/40 to-transparent blur-sm"
          style={{ transformOrigin: 'top center' }}
        />

        {/* Speed Trail Effect 2 */}
        <motion.div
          initial={{ y: 130, opacity: 0, scaleY: 0 }}
          animate={{ 
            y: [130, 10, -90],
            opacity: [0, 0.6, 0],
            scaleY: [0, 1.2, 0.3]
          }}
          transition={{
            duration: 2,
            times: [0, 0.4, 1],
            ease: "easeOut",
            delay: 0.1
          }}
          className="absolute left-1/2 -translate-x-1/2 top-20 w-20 h-40 bg-gradient-to-b from-yellow-500/50 via-orange-500/30 to-transparent blur-md"
          style={{ transformOrigin: 'top center' }}
        />

        {/* Speed Trail Effect 3 */}
        <motion.div
          initial={{ y: 140, opacity: 0, scaleY: 0 }}
          animate={{ 
            y: [140, 20, -80],
            opacity: [0, 0.4, 0],
            scaleY: [0, 1, 0.2]
          }}
          transition={{
            duration: 2,
            times: [0, 0.5, 1],
            ease: "easeOut",
            delay: 0.2
          }}
          className="absolute left-1/2 -translate-x-1/2 top-20 w-24 h-48 bg-gradient-to-b from-red-500/40 via-orange-400/20 to-transparent blur-lg"
          style={{ transformOrigin: 'top center' }}
        />

        {/* Particle Effects */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: 0, 
              y: 120,
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              x: [0, (Math.random() - 0.5) * 100],
              y: [120, 30, -60],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.3, 1],
              delay: i * 0.1,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-20 w-2 h-2 bg-orange-400 rounded-full"
          />
        ))}

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 2,
            times: [0, 0.3, 0.7, 1]
          }}
          className="absolute top-40 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <motion.p
            className="text-white text-lg font-semibold"
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Launching Plutus...
          </motion.p>
        </motion.div>

        {/* Glow Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0.5, 2, 3]
          }}
          transition={{
            duration: 2,
            times: [0, 0.5, 1],
            ease: "easeOut"
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
};

export default RocketLoader;
