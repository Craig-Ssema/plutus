import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDown, ArrowUp, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketTableRow from '@/components/MarketTableRow';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";
import { fetchAllMarketData, connectToRealTimeData } from '@/services/marketDataService';
import { getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/services/watchlistService';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const Markets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'market_cap_usd', direction: 'desc' });
  const [allMarkets, setAllMarkets] = useState([]);
  const [watchlist, setWatchlist] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch market data from our new service
  const fetchMarkets = useCallback(async () => {
    console.log('🔄 Fetching market data...');
    try {
      const data = await fetchAllMarketData();
      console.log('📦 Received data:', data);
      
      // Ensure we have valid data
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('❌ No market data received');
        throw new Error('No market data received');
      }
      
      console.log('✓ Data is array with length:', data.length);
      
      // Filter out any invalid market objects
      const validData = data.filter(m => m && m.id && m.symbol && m.name);
      console.log('✓ Valid data count:', validData.length);
      
      if (validData.length === 0) {
        console.error('❌ No valid market data after filtering');
        throw new Error('No valid market data');
      }
      
      console.log('✅ Setting market data:', validData.length, 'assets');
      setAllMarkets(validData);
      setLastUpdated(new Date());
      
      // Show success message on first load
      if (loading) {
        toast({ 
          title: "📊 Market Data Loaded", 
          description: `Fetched ${validData.length} assets with real-time prices`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("❌ Error fetching markets: ", error);
      
      // If this is the first load and we have no data, show error
      if (loading && allMarkets.length === 0) {
        toast({ 
          title: "⚠️ Backend Connection Failed", 
          description: "Please ensure the backend server is running on port 3001", 
          variant: "destructive" 
        });
      } else if (!loading) {
        toast({ 
          title: "Error", 
          description: "Could not fetch market data. Using cached data.", 
          variant: "destructive" 
        });
      }
    } finally {
      console.log('🏁 Fetch complete, loading:', loading);
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loading, toast, allMarkets.length]);

  // Load watchlist from watchlistService
  const loadWatchlist = useCallback(() => {
    const watchlistItems = getWatchlist();
    // Create a Set of symbols for quick lookup
    const symbolSet = new Set(watchlistItems.map(item => item.symbol));
    setWatchlist(symbolSet);
  }, []);

  useEffect(() => {
    console.log('Markets component mounted! Starting data fetch...');
    
    // Initial load
    fetchMarkets();
    loadWatchlist();

    // Set up real-time updates
    const cleanup = connectToRealTimeData((updatedData) => {
      console.log('Received real-time update');
      if (Array.isArray(updatedData)) {
        setAllMarkets(updatedData);
        setLastUpdated(new Date());
      }
    });

    // Refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing market data...');
      fetchMarkets();
    }, 30000);

    return () => {
      console.log('Markets component unmounting, cleaning up...');
      if (typeof cleanup === 'function') {
        cleanup();
      }
      clearInterval(refreshInterval);
    };
  }, [fetchMarkets, loadWatchlist]); // Add dependencies

  const handleToggleFavorite = async (assetId, isFavorited) => {
    // Find the asset to get both symbol and name
    const asset = allMarkets.find(m => m.id === assetId);
    if (!asset) return;
    
    if (isFavorited) {
      // Remove from watchlist using symbol
      const result = removeFromWatchlist(asset.symbol);
      if (result.success) {
        loadWatchlist(); // Refresh the watchlist state
        toast({ 
          title: "Removed from Watchlist", 
          description: `${asset.symbol} removed from your watchlist.`,
          variant: "default"
        });
      }
    } else {
      // Add to watchlist with symbol and name
      const result = addToWatchlist(asset.symbol, asset.name);
      if (result.success) {
        loadWatchlist(); // Refresh the watchlist state
        toast({ 
          title: "Added to Watchlist", 
          description: `${asset.symbol} added to your watchlist.`,
          variant: "default"
        });
      } else if (result.error === 'Already in watchlist') {
        toast({ 
          title: "Already in Watchlist", 
          description: `${asset.symbol} is already in your watchlist.`,
          variant: "default"
        });
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMarkets();
  };

  const filteredAndSortedMarkets = useMemo(() => {
    let markets = allMarkets
      .filter(market => {
        // Safety check - ensure market object has required properties
        if (!market || !market.symbol || !market.name || !market.id) {
          return false;
        }
        
        const matchesType = activeTab === 'all' || 
                           (activeTab === 'watchlist' && watchlist.has(market.symbol)) ||
                           (activeTab === 'crypto' && market.type === 'crypto') ||
                           (activeTab === 'stocks' && market.type === 'stock');
        const matchesSearch = market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              market.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
      });

    markets.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          if (aNum < bNum) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aNum > bNum) return sortConfig.direction === 'asc' ? 1 : -1;
        } else {
          if (String(aVal) < String(bVal)) return sortConfig.direction === 'asc' ? -1 : 1;
          if (String(aVal) > String(bVal)) return sortConfig.direction === 'asc' ? 1 : -1;
        }

        return 0;
    });

    return markets;
  }, [allMarkets, searchTerm, activeTab, sortConfig, watchlist]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Calculate market stats
  const marketStats = useMemo(() => {
    const totalMarketCap = allMarkets.reduce((sum, market) => sum + (market.market_cap_usd || 0), 0);
    const totalVolume = allMarkets.reduce((sum, market) => sum + (market.volume_24h || 0), 0);
    const gainers = allMarkets.filter(m => m.change_24h_percent > 0).length;
    const losers = allMarkets.filter(m => m.change_24h_percent < 0).length;
    
    return {
      totalMarketCap,
      totalVolume,
      gainers,
      losers
    };
  }, [allMarkets]);

  const SortableHeader = ({ children, sortKey }) => {
    return (
      <th 
        scope="col" 
        className={cn(
          "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer text-gray-500 hover:bg-gray-100 transition-colors"
        )}
        onClick={() => requestSort(sortKey)}
      >
        <div className="flex items-center">
          {children}
          {sortConfig.key === sortKey && (
            sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 w-3 h-3" /> : <ArrowDown className="ml-1 w-3 h-3" />
          )}
        </div>
      </th>
    );
  };

  // Professional light design system colors
  const getThemeColors = () => {
    return {
      bg: 'bg-background',
      cardBg: 'plutus-card',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-50',
      inputBg: 'bg-white border border-gray-200 text-gray-900 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-gray-400',
      tableBg: 'bg-white',
      tableHeader: 'bg-gray-50/80',
      tableDivide: 'divide-gray-100'
    };
  };

  const colors = getThemeColors();

  return (
    <>
      <Helmet>
        <title>Live Markets - Plutus</title>
        <meta name="description" content="Real-time cryptocurrency and stock market data. Track prices, market cap, and trading volumes." />
      </Helmet>
      <div className="min-h-screen pt-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={cn("text-2xl font-bold tracking-tight", colors.textPrimary)}>
                  Live Markets
                </h1>
                <p className={cn("mt-1 text-sm", colors.textSecondary)}>
                  Real-time cryptocurrency and stock market data
                </p>
                {lastUpdated && (
                  <p className={cn("text-sm mt-1", colors.textMuted)}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* Market Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={cn("p-4 rounded-xl", colors.cardBg)}>
                <span className={cn("text-sm", colors.textMuted)}>Market Cap</span>
                <p className={cn("text-2xl font-bold tnum", colors.textPrimary)}>
                  ${(marketStats.totalMarketCap / 1e12).toFixed(2)}T
                </p>
              </div>
              <div className={cn("p-4 rounded-xl", colors.cardBg)}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 price-up" />
                  <span className={cn("text-sm", colors.textMuted)}>Gainers</span>
                </div>
                <p className="text-2xl font-bold price-up tnum">
                  {marketStats.gainers}
                </p>
              </div>
              <div className={cn("p-4 rounded-xl", colors.cardBg)}>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 price-down" />
                  <span className={cn("text-sm", colors.textMuted)}>Losers</span>
                </div>
                <p className="text-2xl font-bold price-down tnum">
                  {marketStats.losers}
                </p>
              </div>
              <div className={cn("p-4 rounded-xl", colors.cardBg)}>
                <span className={cn("text-sm", colors.textMuted)}>24h Volume</span>
                <p className={cn("text-2xl font-bold tnum", colors.textPrimary)}>
                  ${(marketStats.totalVolume / 1e9).toFixed(2)}B
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid md:grid-cols-4 rounded-lg p-1 bg-gray-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative mb-8">
              <Search className={cn("absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5", colors.textMuted)} />
              <input
                type="text"
                placeholder="Search markets by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors",
                  colors.inputBg
                )}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className={cn(
            "rounded-xl overflow-hidden",
            colors.cardBg
          )}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={colors.tableHeader}>
                  <tr>
                    <th scope="col" className={cn("px-6 py-3 text-left text-xs font-medium uppercase tracking-wider", colors.textMuted)}></th>
                    <th scope="col" className={cn("px-6 py-3 text-left text-xs font-medium uppercase tracking-wider", colors.textMuted)}>Asset</th>
                    <SortableHeader sortKey="price">Price</SortableHeader>
                    <SortableHeader sortKey="change_24h_percent">24h Change</SortableHeader>
                    <SortableHeader sortKey="change_7d_percent">7d Change</SortableHeader>
                    <SortableHeader sortKey="market_cap_usd">Market Cap</SortableHeader>
                    <SortableHeader sortKey="volume_24h">Volume (24h)</SortableHeader>
                    <th scope="col" className={cn("px-6 py-3 text-left text-xs font-medium uppercase tracking-wider", colors.textMuted)}>Chart (7d)</th>
                    <th scope="col" className={cn("relative px-6 py-3", colors.textMuted)}><span className="sr-only">Trade</span></th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", colors.tableBg, colors.tableDivide)}>
                  <AnimatePresence>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className={cn("text-center py-16", colors.textMuted)}>
                          <div className="flex flex-col items-center">
                            <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mb-3" />
                            <p>Loading real-time market data...</p>
                            <p className="text-sm mt-1">Fetching from multiple sources</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAndSortedMarkets.length > 0 ? (
                      filteredAndSortedMarkets.map((market, index) => (
                        <MarketTableRow 
                            key={market.id} 
                            asset={market} 
                            index={index}
                            isFavorited={watchlist.has(market.symbol)}
                            onToggleFavorite={handleToggleFavorite}
                         />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-16">
                          <p className={cn("text-lg", colors.textMuted)}>No markets found for your search.</p>
                          <p className={cn("text-sm mt-2", colors.textMuted)}>Try adjusting your filters or search terms</p>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* API Info Footer */}
          <div className={cn("mt-8 text-center text-sm", colors.textMuted)}>
            <p>Data provided by CoinGecko, Alpha Vantage, Twelve Data & Finnhub APIs</p>
            <p className="mt-1">Prices update automatically every 30 seconds</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Markets;
