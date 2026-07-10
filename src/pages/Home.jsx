import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Shield, Zap, BarChart3, Newspaper, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PortfolioChart from '@/components/PortfolioChart';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
      const allMarketData = await fetchAllMarketData();
      setMarketData(allMarketData);

      const updatedWallet = calculatePortfolioValue(allMarketData);
      setWallet(updatedWallet);

      checkPortfolioChanges(updatedWallet, allMarketData);

      const summary = getPortfolioSummary();
      setPortfolioSummary(summary);

      const userHoldings = getHoldings();
      setHoldings(userHoldings);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (user) {
        await loadWalletData();
        await fetchWatchlist();
      }
      await fetchTopMovers();
    };

    initializeDashboard();

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

        checkAchievements(stats, currentWallet);
        checkAutoOrders(allMarketData, currentWallet);
        checkPriceAlerts(allMarketData);
      } catch (error) {
        console.error('Error monitoring systems:', error);
      }
    };

    monitorSystems();
    const interval = setInterval(monitorSystems, 30000);
    return () => clearInterval(interval);
  }, []);

  const pnlPositive = portfolioSummary ? portfolioSummary.totalPnL >= 0 : true;

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Plutus - Real-Time Trading Platform</title>
          <meta name="description" content="Access real-time cryptocurrency and stock market data. Professional trading tools with live charts and market analysis." />
        </Helmet>
        <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <section className="relative pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
                  Trade smarter with <span className="text-blue-600">Plutus</span>
                </h1>
                <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-600">
                  Real-time cryptocurrency and stock market data with professional-grade trading tools.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/signin')}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => navigate('/markets')}
                    variant="outline"
                    className="px-8 py-3 rounded-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className="text-3xl font-bold text-center mb-12 tracking-tight text-gray-900"
              >
                Everything you need to trade
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    className="p-6 plutus-card"
                  >
                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1.5 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // Dashboard for logged-in users
  return (
    <>
      <Helmet>
        <title>Dashboard - Plutus</title>
        <meta name="description" content="Your personal trading dashboard with portfolio overview and market insights." />
      </Helmet>
      <div className="min-h-screen pt-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
              Welcome back, {user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 p-6 plutus-card"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Portfolio value</p>
                  <h2 className="text-4xl font-bold tracking-tight text-gray-900 tnum">
                    ${portfolioSummary ? portfolioSummary.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '100,000.00'}
                  </h2>
                  <p className={`flex items-center gap-1 text-sm font-medium mt-1 tnum ${pnlPositive ? 'price-up' : 'price-down'}`}>
                    {pnlPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {portfolioSummary ? `$${Math.abs(portfolioSummary.totalPnL).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${portfolioSummary.totalPnLPercent.toFixed(2)}%)` : '$0.00 (0.00%)'}
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/trade')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Trade
                </Button>
              </div>
              <PortfolioChart />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex flex-col gap-5"
            >
              {[
                {
                  label: "Total P&L",
                  value: portfolioSummary ? `${portfolioSummary.totalPnL >= 0 ? '+' : '-'}$${Math.abs(portfolioSummary.totalPnL).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$0.00',
                  change: portfolioSummary ? `${portfolioSummary.totalPnLPercent >= 0 ? '+' : ''}${portfolioSummary.totalPnLPercent.toFixed(2)}%` : '0.00%',
                  positive: portfolioSummary ? portfolioSummary.totalPnL >= 0 : true
                },
                {
                  label: "Holdings Value",
                  value: portfolioSummary ? `$${portfolioSummary.holdingsValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$0.00',
                  change: portfolioSummary ? `${portfolioSummary.holdingsCount} assets` : '0 assets',
                  positive: null
                },
                {
                  label: "Available Cash",
                  value: portfolioSummary ? `$${portfolioSummary.cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$100,000.00',
                  change: "",
                  positive: null
                },
              ].map((stat, index) => (
                <div key={index} className="p-5 plutus-card flex-1 flex flex-col justify-center">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 tnum">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm font-medium tnum ${
                      stat.positive === null ? 'text-gray-500' : stat.positive ? 'price-up' : 'price-down'
                    }`}>
                      {stat.change}
                    </p>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Watchlist and Movers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Watchlist */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 plutus-card"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-gray-400" />
                  Your Watchlist
                </h2>
                <Button
                  onClick={() => navigate('/markets')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-1">
                {watchlist.length > 0 ? (
                  watchlist.map((asset) => (
                    <div key={asset.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{asset.symbol}</p>
                        <p className="text-sm text-gray-500">{asset.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 tnum">${asset.price}</p>
                        <p className={`text-sm font-medium tnum ${asset.change_24h_percent > 0 ? 'price-up' : 'price-down'}`}>
                          {asset.change_24h_percent > 0 ? "+" : ""}{asset.change_24h_percent}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Eye className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500 mb-3">No assets in your watchlist yet</p>
                    <Button
                      onClick={() => navigate('/markets')}
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Browse Markets
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Movers */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-6 plutus-card"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                  Top Movers
                </h2>
                <Button
                  onClick={() => navigate('/markets')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-1">
                {topMovers.length > 0 ? (
                  topMovers.map((asset, index) => (
                    <div key={asset.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.symbol}</p>
                          <p className="text-sm text-gray-500">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 tnum">${typeof asset.price === 'number' ? asset.price.toFixed(2) : asset.price}</p>
                        <p className="text-sm font-medium price-up tnum">
                          +{typeof asset.change_24h_percent === 'number' ? asset.change_24h_percent.toFixed(2) : asset.change_24h_percent}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">Loading market data...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* News strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={() => navigate('/hub/news')}
            className="mt-5 px-5 py-4 plutus-card plutus-card-hover cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900">Market News & Insights</span>
                  <span className="text-sm text-gray-500 hidden sm:inline"> — the latest market trends and analysis</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: BarChart3, title: 'Explore Markets', sub: 'Browse 1000+ assets', to: '/markets' },
                { icon: Zap, title: 'Start Trading', sub: 'Access terminal', to: '/trade' },
                { icon: Newspaper, title: 'Community Hub', sub: 'Connect with traders', to: '/hub/community' },
                { icon: Shield, title: 'My Profile', sub: 'Manage account', to: '/profile' },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.to)}
                  className="p-5 plutus-card plutus-card-hover text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <action.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-0.5 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-500">{action.sub}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Home;
