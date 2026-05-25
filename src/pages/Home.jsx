import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Shield, Zap, BarChart3, Newspaper, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PortfolioChart from '@/components/PortfolioChart';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { fetchAllMarketData } from '@/services/marketDataService';
import { getWallet, calculatePortfolioValue, getHoldings, getPortfolioSummary } from '@/services/walletService';
import { checkPortfolioChanges } from '@/services/notificationService';
import { checkAchievements, getAchievementProgress } from '@/services/achievementsService';
import { checkAutoOrders } from '@/services/stopLossTakeProfitService';
import { checkPriceAlerts } from '@/services/priceAlertsService';
import { getTradingStatistics, getTodayPnL } from '@/services/tradingStatsService';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [wallet, setWallet] = useState(null);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [topMovers, setTopMovers] = useState([]);
  const [marketData, setMarketData] = useState([]);

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('watchlist')
      .select('assets(*)')
      .eq('user_id', user.id)
      .limit(4);

    if (error) {
      console.error("Error fetching watchlist:", error);
    } else {
      setWatchlist(data.map(item => item.assets).filter(Boolean));
    }
  }, [user]);

  const fetchTopMovers = useCallback(async () => {
    try {
      const allMarketData = await fetchAllMarketData();
      // Sort by 24h change percentage and get top 3
      const sorted = allMarketData
        .filter(asset => asset.change_24h_percent != null)
        .sort((a, b) => b.change_24h_percent - a.change_24h_percent)
        .slice(0, 3);
      setTopMovers(sorted);
      setMarketData(allMarketData);
      return allMarketData;
    } catch (error) {
      console.error("Error fetching top movers:", error);
      return [];
    }
  }, []);

  const loadWalletData = useCallback(async () => {
    try {
      // Get current market data
      const allMarketData = await fetchAllMarketData();
      setMarketData(allMarketData);
      
      // Calculate portfolio value with current prices
      const updatedWallet = calculatePortfolioValue(allMarketData);
      setWallet(updatedWallet);
      
      // Check for significant portfolio changes and send notifications
      checkPortfolioChanges(updatedWallet, allMarketData);
      
      // Get portfolio summary
      const summary = getPortfolioSummary();
      setPortfolioSummary(summary);
      
      // Get holdings
      const userHoldings = getHoldings();
      setHoldings(userHoldings);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (user) {
        // Load wallet data first
        await loadWalletData();
        // Then load watchlist
        await fetchWatchlist();
      }
      // Always fetch top movers
      await fetchTopMovers();
    };
    
    initializeDashboard();
    
    // Update portfolio value every 30 seconds with live market data
    if (user) {
      const interval = setInterval(() => {
        loadWalletData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Monitor all automated systems
  useEffect(() => {
    const monitorSystems = async () => {
      try {
        const allMarketData = await fetchAllMarketData();
        const currentWallet = getWallet();
        const stats = getTradingStatistics();
        
        // Check achievements
        checkAchievements(stats, currentWallet);
        
        // Check stop-loss/take-profit orders
        checkAutoOrders(allMarketData, currentWallet);
        
        // Check price alerts
        checkPriceAlerts(allMarketData);
        
      } catch (error) {
        console.error('Error monitoring systems:', error);
      }
    };
    
    // Run immediately
    monitorSystems();
    
    // Then every 30 seconds
    const interval = setInterval(monitorSystems, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Plutus - Real-Time Trading Platform</title>
          <meta name="description" content="Access real-time cryptocurrency and stock market data. Professional trading tools with live charts and market analysis." />
        </Helmet>
        <div className={cn(
          "min-h-screen",
          theme === 'dark' 
            ? 'bg-black'
            : theme === 'gradient'
            ? 'bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a3a52]'
            : 'bg-gray-50'
        )}>
          {/* Hero Section */}
          <section className="relative pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h1 className={cn(
                  "text-5xl md:text-6xl font-bold mb-6",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>
                  Trade Smarter with{" "}
                  <span className={cn(
                    theme === 'dark' 
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400"
                      : theme === 'gradient'
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200"
                      : "text-blue-600"
                  )}>
                    Plutus
                  </span>
                </h1>
                <p className={cn(
                  "text-xl mb-8 max-w-3xl mx-auto",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>
                  Access real-time cryptocurrency and stock market data with professional-grade trading tools.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/signin')} 
                    className={cn(
                      "px-8 py-3",
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white'
                        : theme === 'gradient'
                        ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                  >
                    Get Started
                  </Button>
                  <Button 
                    onClick={() => navigate('/markets')} 
                    variant="outline"
                    className={cn(
                      "px-8 py-3",
                      theme === 'gradient' 
                        ? 'border-white/30 text-white hover:bg-white/10'
                        : ''
                    )}
                  >
                    View Markets
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className={cn(
                  "text-3xl font-bold text-center mb-12",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}
              >
                Everything You Need to Trade
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: Zap, title: "Real-Time Data", description: "Live price updates from multiple exchanges" },
                  { icon: Shield, title: "Secure Trading", description: "Bank-level security for your investments" },
                  { icon: BarChart3, title: "Advanced Charts", description: "Professional TradingView-powered analytics" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-6 rounded-xl border",
                      theme === 'dark'
                        ? 'bg-zinc-900 border-red-900/30'
                        : theme === 'gradient'
                        ? 'bg-white/10 backdrop-blur-md border-white/20'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    <feature.icon className={cn(
                      "w-12 h-12 mb-4",
                      theme === 'dark' 
                        ? "text-orange-500"
                        : theme === 'gradient'
                        ? "text-white"
                        : "text-blue-600"
                    )} />
                    <h3 className={cn(
                      "text-xl font-semibold mb-2",
                      theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                    )}>{feature.title}</h3>
                    <p className={cn(
                      theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                    )}>{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // Dashboard for logged-in users - KEEPING YOUR ORIGINAL STRUCTURE
  return (
    <>
      <Helmet>
        <title>Dashboard - Plutus</title>
        <meta name="description" content="Your personal trading dashboard with portfolio overview and market insights." />
      </Helmet>
      <div className={cn(
        "min-h-screen pt-20",
        theme === 'dark' 
          ? 'bg-black'
          : theme === 'gradient'
          ? 'bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a3a52]'
          : 'bg-gray-50'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className={cn(
              "text-2xl font-medium mb-1",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
            )}>
              Welcome to your
            </h1>
            <h2 className={cn(
              "text-5xl font-bold mb-2",
              theme === 'dark' 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400'
                : theme === 'gradient'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500'
            )}>
              Dashboard
            </h2>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
            )}>Hello, {user?.email?.split('@')[0]} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </motion.div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "lg:col-span-2 p-6 rounded-xl border",
                theme === 'dark'
                  ? 'bg-zinc-900 border-red-900/30'
                  : theme === 'gradient'
                  ? 'bg-white/10 backdrop-blur-md border-white/20'
                  : 'bg-white border-gray-200'
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className={cn(
                    "text-2xl font-bold",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                  )}>
                    ${portfolioSummary ? portfolioSummary.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '100,000.00'}
                  </h2>
                  <p className={cn(
                    "flex items-center gap-1 text-sm",
                    portfolioSummary && portfolioSummary.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {portfolioSummary && portfolioSummary.totalPnL >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {portfolioSummary ? `${Math.abs(portfolioSummary.totalPnL).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${portfolioSummary.totalPnLPercent.toFixed(2)}%)` : '$0.00 (0.00%)'}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/trade')}
                  className={cn(
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white'
                      : theme === 'gradient'
                      ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  Trade Now
                </Button>
              </div>
              <PortfolioChart />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {[
                { 
                  label: "Total P&L", 
                  value: portfolioSummary ? `${portfolioSummary.totalPnL >= 0 ? '+' : ''}${Math.abs(portfolioSummary.totalPnL).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$0.00',
                  change: portfolioSummary ? `${portfolioSummary.totalPnLPercent >= 0 ? '+' : ''}${portfolioSummary.totalPnLPercent.toFixed(2)}%` : '0.00%',
                  positive: portfolioSummary ? portfolioSummary.totalPnL >= 0 : null
                },
                { 
                  label: "Holdings Value", 
                  value: portfolioSummary ? `${portfolioSummary.holdingsValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$0.00',
                  change: portfolioSummary ? `${portfolioSummary.holdingsCount} assets` : '0 assets',
                  positive: null
                },
                { 
                  label: "Available Cash", 
                  value: portfolioSummary ? `${portfolioSummary.cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$100,000.00',
                  change: "",
                  positive: null
                },
              ].map((stat, index) => (
                <div key={index} className={cn(
                  "p-4 rounded-lg border",
                  theme === 'dark'
                    ? 'bg-zinc-900 border-red-900/30'
                    : theme === 'gradient'
                    ? 'bg-white/10 backdrop-blur-md border-white/20'
                    : 'bg-white border-gray-200'
                )}>
                  <p className={cn(
                    theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
                  )}>{stat.label}</p>
                  <p className={cn(
                    "text-xl font-bold",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                  )}>{stat.value}</p>
                  {stat.change && (
                    <p className={stat.positive ? "text-green-500" : "text-red-500"}>
                      {stat.change}
                    </p>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* News Outlet Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/hub/news')}
            className={cn(
              "p-6 rounded-xl border cursor-pointer mb-6 hover:shadow-lg transition-all",
              theme === 'dark'
                ? 'bg-zinc-900 border-red-900/30 hover:border-red-700/50'
                : theme === 'gradient'
                ? 'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15'
                : 'bg-white border-gray-200 hover:border-blue-300'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  theme === 'dark'
                    ? 'bg-red-900/30'
                    : theme === 'gradient'
                    ? 'bg-white/20'
                    : 'bg-blue-100'
                )}>
                  <Newspaper className={cn(
                    "w-6 h-6",
                    theme === 'dark'
                      ? 'text-orange-400'
                      : theme === 'gradient'
                      ? 'text-white'
                      : 'text-blue-600'
                  )} />
                </div>
                <div>
                  <h3 className={cn(
                    "text-xl font-semibold mb-1",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                  )}>Market News & Insights</h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                  )}>Stay updated with the latest market trends and analysis</p>
                </div>
              </div>
              <ArrowUpRight className={cn(
                "w-5 h-5",
                theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-white' : 'text-blue-600'
              )} />
            </div>
          </motion.div>

          {/* Watchlist and Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Watchlist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-6 rounded-xl border",
                theme === 'dark'
                  ? 'bg-zinc-900 border-red-900/30'
                  : theme === 'gradient'
                  ? 'bg-white/10 backdrop-blur-md border-white/20'
                  : 'bg-white border-gray-200'
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={cn(
                  "text-xl font-semibold",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>
                  <Eye className="inline w-5 h-5 mr-2" />
                  Your Watchlist
                </h2>
                <Button 
                  onClick={() => navigate('/markets')}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    theme === 'dark' ? 'hover:bg-zinc-800' : theme === 'gradient' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  )}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {watchlist.length > 0 ? (
                  watchlist.map((asset) => (
                    <div key={asset.id} className={cn(
                      "flex justify-between items-center p-3 rounded-lg",
                      theme === 'dark' ? 'hover:bg-zinc-800' : theme === 'gradient' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    )}>
                      <div>
                        <p className={cn(
                          "font-medium",
                          theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                        )}>{asset.symbol}</p>
                        <p className={cn(
                          "text-sm",
                          theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
                        )}>{asset.name}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-medium",
                          theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                        )}>${asset.price}</p>
                        <p className={cn(
                          "text-sm",
                          asset.change_24h_percent > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {asset.change_24h_percent > 0 ? "+" : ""}{asset.change_24h_percent}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={cn(
                    theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
                  )}>No assets in watchlist</p>
                )}
              </div>
            </motion.div>

            {/* Top Movers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "p-6 rounded-xl border",
                theme === 'dark'
                  ? 'bg-zinc-900 border-red-900/30'
                  : theme === 'gradient'
                  ? 'bg-white/10 backdrop-blur-md border-white/20'
                  : 'bg-white border-gray-200'
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={cn(
                  "text-xl font-semibold",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>
                  <TrendingUp className="inline w-5 h-5 mr-2" />
                  Top Movers
                </h2>
                <Button 
                  onClick={() => navigate('/markets')}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    theme === 'dark' ? 'hover:bg-zinc-800' : theme === 'gradient' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  )}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {topMovers.length > 0 ? (
                  topMovers.map((asset, index) => (
                    <div key={asset.id} className={cn(
                      "flex justify-between items-center p-3 rounded-lg",
                      theme === 'dark' ? 'hover:bg-zinc-800' : theme === 'gradient' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold px-2 py-1 rounded",
                          theme === 'dark'
                            ? "bg-orange-500/20 text-orange-500"
                            : theme === 'gradient'
                            ? "bg-white/20 text-white"
                            : "bg-blue-100 text-blue-600"
                        )}>
                          #{index + 1}
                        </span>
                        <div>
                          <p className={cn(
                            "font-medium",
                            theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                          )}>{asset.symbol}</p>
                          <p className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
                          )}>{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-medium",
                          theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                        )}>${typeof asset.price === 'number' ? asset.price.toFixed(2) : asset.price}</p>
                        <p className="text-sm text-green-500">
                          +{typeof asset.change_24h_percent === 'number' ? asset.change_24h_percent.toFixed(2) : asset.change_24h_percent}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className={cn(
                      "w-12 h-12 mx-auto mb-3 opacity-30",
                      theme === 'dark' ? 'text-gray-600' : theme === 'gradient' ? 'text-white/30' : 'text-gray-400'
                    )} />
                    <p className={cn(
                      "text-sm",
                      theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
                    )}>Loading market data...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "mt-6 p-8 rounded-xl border",
              theme === 'dark'
                ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-red-900/20 border-red-900/30'
                : theme === 'gradient'
                ? 'bg-white/10 backdrop-blur-md border-white/20'
                : 'bg-gradient-to-br from-white via-white to-blue-50 border-gray-200'
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={cn(
                  "text-2xl font-bold mb-2",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>Quick Actions</h2>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>Shortcuts to your most used features</p>
              </div>
              <Star className={cn(
                "w-6 h-6",
                theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-white' : 'text-blue-600'
              )} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/markets')}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all hover:scale-105",
                  theme === 'dark'
                    ? 'bg-zinc-800 border-red-900/30 hover:bg-zinc-700'
                    : theme === 'gradient'
                    ? 'bg-white/10 border-white/20 hover:bg-white/20'
                    : 'bg-white border-gray-200 hover:shadow-md'
                )}
              >
                <BarChart3 className={cn(
                  "w-8 h-8 mb-3",
                  theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-white' : 'text-blue-600'
                )} />
                <h3 className={cn(
                  "font-semibold mb-1",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>Explore Markets</h3>
                <p className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>Browse 1000+ assets</p>
              </button>

              <button
                onClick={() => navigate('/trade')}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all hover:scale-105",
                  theme === 'dark'
                    ? 'bg-zinc-800 border-red-900/30 hover:bg-zinc-700'
                    : theme === 'gradient'
                    ? 'bg-white/10 border-white/20 hover:bg-white/20'
                    : 'bg-white border-gray-200 hover:shadow-md'
                )}
              >
                <Zap className={cn(
                  "w-8 h-8 mb-3",
                  theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-white' : 'text-blue-600'
                )} />
                <h3 className={cn(
                  "font-semibold mb-1",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>Start Trading</h3>
                <p className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>Access terminal</p>
              </button>

              <button
                onClick={() => navigate('/hub/community')}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all hover:scale-105",
                  theme === 'dark'
                    ? 'bg-zinc-800 border-red-900/30 hover:bg-zinc-700'
                    : theme === 'gradient'
                    ? 'bg-white/10 border-white/20 hover:bg-white/20'
                    : 'bg-white border-gray-200 hover:shadow-md'
                )}
              >
                <Newspaper className={cn(
                  "w-8 h-8 mb-3",
                  theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-white' : 'text-blue-600'
                )} />
                <h3 className={cn(
                  "font-semibold mb-1",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>Community Hub</h3>
                <p className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>Connect with traders</p>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all hover:scale-105",
                  theme === 'dark'
                    ? 'bg-zinc-800 border-red-900/30 hover:bg-zinc-700'
                    : theme === 'gradient'
                    ? 'bg-white/10 border-white/20 hover:bg-white/20'
                    : 'bg-white border-gray-200 hover:shadow-md'
                )}
              >
                <Shield className={cn(
                  "w-8 h-8 mb-3",
                  theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-white' : 'text-blue-600'
                )} />
                <h3 className={cn(
                  "font-semibold mb-1",
                  theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                )}>My Profile</h3>
                <p className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
                )}>Manage account</p>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Home;
