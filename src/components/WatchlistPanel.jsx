import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, StarOff, TrendingUp, TrendingDown, X, AlertCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getWatchlist, removeFromWatchlist } from '@/services/watchlistService';
import { getMarketData } from '@/services/marketDataService';

const WatchlistPanel = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistData, setWatchlistData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadWatchlist();
      // Refresh every 5 seconds
      const interval = setInterval(loadWatchlist, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadWatchlist = async () => {
    try {
      const list = getWatchlist();
      setWatchlist(list);

      if (list.length > 0) {
        const marketData = await getMarketData();
        const enrichedData = list.map(item => {
          const marketInfo = marketData.find(m => m.symbol === item.symbol);
          return {
            ...item,
            ...marketInfo
          };
        }).filter(item => item.price); // Only show items with price data

        setWatchlistData(enrichedData);
      } else {
        setWatchlistData([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setLoading(false);
    }
  };

  const handleRemove = (symbol) => {
    const result = removeFromWatchlist(symbol);
    if (result.success) {
      loadWatchlist();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={cn(
            "relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl",
            theme === 'dark'
              ? 'bg-zinc-900 border border-red-900/30'
              : theme === 'gradient'
              ? 'bg-white/90 backdrop-blur-lg border border-white/20'
              : 'bg-white'
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100'
              )}>
                <Star className={cn(
                  "w-5 h-5",
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                )} />
              </div>
              <div>
                <h2 className={cn(
                  "text-xl font-bold",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Watchlist
                </h2>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {watchlistData.length} assets tracked
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              </div>
            ) : watchlistData.length === 0 ? (
              <div className="text-center py-12">
                <Star className={cn(
                  "w-16 h-16 mx-auto mb-4 opacity-20",
                  theme === 'dark' ? 'text-white' : 'text-gray-400'
                )} />
                <h3 className={cn(
                  "text-xl font-semibold mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Your watchlist is empty
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Add assets from the Markets page to track them here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlistData.map((asset) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:shadow-md",
                      theme === 'dark'
                        ? 'bg-zinc-800 border-red-900/30 hover:bg-zinc-750'
                        : theme === 'gradient'
                        ? 'bg-white/50 backdrop-blur-md border-white/30'
                        : 'bg-gray-50 border-gray-200 hover:bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={asset.image}
                          alt={asset.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              "font-bold",
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                              {asset.symbol}
                            </h3>
                            <span className={cn(
                              "text-sm",
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {asset.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className={cn(
                              "text-lg font-bold",
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                              ${asset.price.toFixed(2)}
                            </p>
                            <span className={cn(
                              "flex items-center gap-1 text-sm font-semibold",
                              asset.change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                            )}>
                              {asset.change_24h >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {asset.change_24h >= 0 ? '+' : ''}
                              {asset.change_24h_percent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(asset.symbol)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          theme === 'dark'
                            ? 'hover:bg-red-900/30 text-red-400'
                            : 'hover:bg-red-50 text-red-600'
                        )}
                        title="Remove from watchlist"
                      >
                        <StarOff className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WatchlistPanel;
