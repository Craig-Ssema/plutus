import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Trophy, 
  AlertTriangle,
  Check,
  Trash2
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} from '@/services/notificationService';
import { Button } from '@/components/ui/button';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
    
    // Listen for new notifications
    const handleNewNotification = () => {
      loadNotifications();
    };
    
    window.addEventListener('plutusNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('plutusNotification', handleNewNotification);
    };
  }, []);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAsRead = (id) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (id) => {
    deleteNotification(id);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAllNotifications();
      loadNotifications();
    }
  };

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

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full sm:w-[400px] shadow-2xl overflow-hidden flex flex-col z-[10000]",
              theme === 'dark' ? 'bg-zinc-950 border-l border-red-900/30' :
              theme === 'gradient' ? 'bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-xl border-l border-white/20' :
              'bg-white border-l border-gray-200'
            )}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b flex items-center justify-between",
            theme === 'dark' ? 'border-red-900/30' : theme === 'gradient' ? 'border-white/20' : 'border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h2 className={cn(
                "text-xl font-bold",
                theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
              )}>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full transition-colors",
                theme === 'dark' ? 'hover:bg-white/10' : theme === 'gradient' ? 'hover:bg-white/20' : 'hover:bg-gray-100'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className={cn(
            "px-6 py-3 border-b flex gap-2",
            theme === 'dark' ? 'border-red-900/30' : theme === 'gradient' ? 'border-white/20' : 'border-gray-200'
          )}>
            {['all', 'unread', 'read'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-all",
                  filter === f
                    ? theme === 'dark'
                      ? 'bg-red-600 text-white'
                      : theme === 'gradient'
                      ? 'bg-white/30 text-white backdrop-blur-md'
                      : 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                    : theme === 'gradient'
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className={cn(
              "px-6 py-2 border-b flex gap-2",
              theme === 'dark' ? 'border-red-900/30' : theme === 'gradient' ? 'border-white/20' : 'border-gray-200'
            )}>
              <Button
                onClick={handleMarkAllAsRead}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
              <Button
                onClick={handleClearAll}
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Bell className={cn(
                  "w-16 h-16 mb-4",
                  theme === 'dark' ? 'text-gray-600' : theme === 'gradient' ? 'text-white/30' : 'text-gray-300'
                )} />
                <p className={cn(
                  "text-lg font-medium",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-500'
                )}>
                  No notifications
                </p>
                <p className={cn(
                  "text-sm mt-1",
                  theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-400'
                )}>
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-6 py-4 transition-colors relative group",
                      !notification.read && (theme === 'dark' ? 'bg-red-900/10' : theme === 'gradient' ? 'bg-white/5' : 'bg-blue-50'),
                      theme === 'dark' ? 'hover:bg-zinc-900' : theme === 'gradient' ? 'hover:bg-white/10' : 'hover:bg-gray-50'
                    )}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold text-sm mb-1",
                          theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                        )}>
                          {notification.title}
                        </p>
                        <p className={cn(
                          "text-sm mb-2",
                          theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
                        )}>
                          {notification.message}
                        </p>
                        <p className={cn(
                          "text-xs",
                          theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-gray-300' : 'text-gray-400'
                        )}>
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              theme === 'dark' ? 'hover:bg-white/10' : theme === 'gradient' ? 'hover:bg-white/20' : 'hover:bg-gray-200'
                            )}
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className={cn(
                            "p-1.5 rounded transition-colors text-red-500",
                            theme === 'dark' ? 'hover:bg-red-500/10' : theme === 'gradient' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'
                          )}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default NotificationCenter;
