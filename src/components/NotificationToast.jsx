import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Trophy, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const NotificationToast = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (event) => {
      const notification = event.detail;
      
      // Add notification to queue
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    };

    // Listen for custom notification events
    window.addEventListener('plutusNotification', handleNotification);

    return () => {
      window.removeEventListener('plutusNotification', handleNotification);
    };
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'profit':
      case 'significant_gain':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'loss':
      case 'significant_loss':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'milestone':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'trade_executed':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'profit':
      case 'significant_gain':
        return 'border-green-500/30 bg-green-500/10';
      case 'loss':
      case 'significant_loss':
        return 'border-red-500/30 bg-red-500/10';
      case 'milestone':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'trade_executed':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-orange-500/30 bg-orange-500/10';
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "p-4 rounded-lg border-2 shadow-lg backdrop-blur-md relative",
              getNotificationColor(notification.type),
              theme === 'dark' ? 'bg-zinc-900/90' : theme === 'gradient' ? 'bg-black/50' : 'bg-white/90'
            )}
          >
            <button
              onClick={() => removeNotification(notification.id)}
              className={cn(
                "absolute top-2 right-2 p-1 rounded-full transition-colors",
                theme === 'dark' ? 'hover:bg-white/10' : theme === 'gradient' ? 'hover:bg-white/20' : 'hover:bg-gray-200'
              )}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <p className={cn(
                  "font-semibold text-sm mb-1",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>
                  {notification.title}
                </p>
                <p className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
                )}>
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
