import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingChart from '@/components/TradingChart';
import OrderBook from '@/components/OrderBook';
import { Search, Star, ChevronsUpDown, BarChart2, BookOpen, Clock, List, X, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchAllMarketData, connectToRealTimeData } from '@/services/marketDataService';
import { getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/services/watchlistService';
import { cn } from '@/lib/utils';
import { buyAsset, sellAsset, getWallet } from '@/services/walletService';

const Trade = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [marketAssets, setMarketAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [orderSide, setOrderSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState('chart');
  const [showMarketList, setShowMarketList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [watchlist, setWatchlist] = useState(new Set());
  const [wallet, setWallet] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load wallet data
  useEffect(() => {
    const loadWallet = () => {
      const walletData = getWallet();
      setWallet(walletData);
    };
    loadWallet();

    // Update wallet every 5 seconds
    const interval = setInterval(loadWallet, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load market data
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setLoading(true);
        const data = await fetchAllMarketData();

        if (!data || data.length === 0) {
          console.warn('No market data received, using fallback data');
          const fallbackAsset = {
            id: 'btc',
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            price: 43000,
            price_formatted: '$43,000.00',
            change_24h: 500,
            change_24h_percent: 1.2,
            market_cap_usd: 840000000000,
            market_cap_formatted: '$840B',
            volume_24h: 15000000000,
            high_24h: 43500,
            low_24h: 42500,
            sparkline: [],
            last_updated: new Date().toISOString(),
          };
          setMarketAssets([fallbackAsset]);
          setSelectedAsset(fallbackAsset);
        } else {
          setMarketAssets(data);
          const assetSymbolFromNav = location.state?.asset;
          const foundAsset = data.find(a => a.symbol === assetSymbolFromNav);
          setSelectedAsset(foundAsset || data[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading market data:', error);
        setLoading(false);
        const fallbackAsset = {
          id: 'btc',
          symbol: 'BTC',
          name: 'Bitcoin',
          type: 'crypto',
          price: 43000,
          price_formatted: '$43,000.00',
          change_24h: 500,
          change_24h_percent: 1.2,
          market_cap_usd: 840000000000,
          market_cap_formatted: '$840B',
          volume_24h: 15000000000,
          high_24h: 43500,
          low_24h: 42500,
          sparkline: [],
          last_updated: new Date().toISOString(),
        };
        setMarketAssets([fallbackAsset]);
        setSelectedAsset(fallbackAsset);

        toast({
          title: "Error",
          description: "Failed to load market data. Using cached data.",
          variant: "destructive"
        });
      }
    };

    loadMarketData();

    const cleanup = connectToRealTimeData((updatedData) => {
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        setMarketAssets(updatedData);
        setSelectedAsset(prev => {
          if (prev) {
            const updated = updatedData.find(a => a.id === prev.id);
            return updated || prev;
          }
          return prev;
        });
      }
    });

    const savedWatchlist = getWatchlist();
    // Create a Set of symbols for quick lookup
    const symbolSet = new Set(savedWatchlist.map(item => item.symbol));
    setWatchlist(symbolSet);

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [location.state?.asset, toast]);

  const handleToggleFavorite = (assetId) => {
    // Find the asset to get both symbol and name
    const asset = marketAssets.find(m => m.id === assetId);
    if (!asset) return;

    if (isInWatchlist(asset.symbol)) {
      const result = removeFromWatchlist(asset.symbol);
      if (result.success) {
        const updatedWatchlist = getWatchlist();
        setWatchlist(new Set(updatedWatchlist.map(item => item.symbol)));
        toast({
          title: "Removed from Watchlist",
          description: `${asset.symbol} removed from your watchlist.`,
          variant: "default"
        });
      }
    } else {
      const result = addToWatchlist(asset.symbol, asset.name);
      if (result.success) {
        const updatedWatchlist = getWatchlist();
        setWatchlist(new Set(updatedWatchlist.map(item => item.symbol)));
        toast({
          title: "Added to Watchlist",
          description: `${asset.symbol} added to your watchlist.`,
          variant: "default"
        });
      }
    }
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to trade",
        variant: "destructive"
      });
      return;
    }

    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price for limit/stop orders",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseFloat(amount);
    const tradePrice = orderType === 'market' ? (selectedAsset?.price || 0) : parseFloat(price);
    const assetSymbol = selectedAsset?.symbol || 'Unknown';
    const assetName = selectedAsset?.name || 'Unknown';

    // Show processing state
    setIsProcessing(true);

    toast({
      title: "⏳ Processing Order...",
      description: "Your order is being executed...",
      duration: 2000
    });

    // Simulate realistic order processing delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    let result;

    if (orderSide === 'buy') {
      result = buyAsset(assetSymbol, assetName, quantity, tradePrice);

      setIsProcessing(false);

      if (result.success) {
        toast({
          title: "✅ Buy Order Executed!",
          description: `Successfully bought ${quantity} ${assetSymbol} at ${tradePrice.toFixed(2)} for ${result.transaction.totalCost.toFixed(2)} (Fee: ${result.transaction.fee.toFixed(2)})`,
          variant: "default"
        });

        setWallet(result.wallet);
        setAmount('');
        setPrice('');
      } else {
        toast({
          title: "❌ Buy Order Failed",
          description: result.error || "Insufficient funds",
          variant: "destructive"
        });
      }
    } else {
      result = sellAsset(assetSymbol, assetName, quantity, tradePrice);

      setIsProcessing(false);

      if (result.success) {
        const isProfitable = result.transaction.pnl > 0;
        toast({
          title: isProfitable ? "🎉 Sell Order Executed - Profit!" : "📉 Sell Order Executed - Loss",
          description: `Sold ${quantity} ${assetSymbol} at ${tradePrice.toFixed(2)} for ${result.transaction.netRevenue.toFixed(2)} (Fee: ${result.transaction.fee.toFixed(2)}). P/L: ${isProfitable ? '+' : ''}${result.transaction.pnl.toFixed(2)} (${isProfitable ? '+' : ''}${result.transaction.pnlPercent.toFixed(2)}%)`,
          variant: "default"
        });

        setWallet(result.wallet);
        setAmount('');
        setPrice('');
      } else {
        toast({
          title: "❌ Sell Order Failed",
          description: result.error || "You don't own this asset or insufficient quantity",
          variant: "destructive"
        });
      }
    }
  };

  const filteredAssets = marketAssets.filter(asset =>
    asset?.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  const inputClass = "w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600";

  const MarketListPanel = ({ onSelect }) => (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Markets</h2>
        <button onClick={() => setShowMarketList(false)} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredAssets.map(asset => (
          <div
            key={asset.id}
            onClick={() => onSelect(asset)}
            className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center">
              <Star
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(asset.id);
                }}
                className={`w-4 h-4 mr-3 transition-colors cursor-pointer ${watchlist.has(asset.id) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
              />
              <div>
                <p className="font-semibold text-gray-900">{asset.symbol}/USD</p>
                <p className="text-xs text-gray-500">{asset.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm text-gray-900 tnum">
                ${(asset.price || 0).toFixed(asset.price < 1 ? 4 : 2)}
              </p>
              <p className={`text-xs font-semibold tnum ${(asset.change_24h_percent || 0) >= 0 ? 'price-up' : 'price-down'}`}>
                {(asset.change_24h_percent || 0) >= 0 ? '+' : ''}{(asset.change_24h_percent || 0).toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading trading terminal...</p>
          <p className="text-sm mt-2 text-gray-400">Connecting to real-time market data</p>
        </div>
      </div>
    );
  }

  if (!selectedAsset) {
    return (
      <div className="pt-16 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">No market data available</p>
          <p className="text-sm mt-2 text-gray-400">Please check your API configuration</p>
        </div>
      </div>
    );
  }

  const safeAsset = {
    ...selectedAsset,
    symbol: selectedAsset.symbol || 'N/A',
    name: selectedAsset.name || 'Unknown',
    price: selectedAsset.price || 0,
    change_24h: selectedAsset.change_24h || 0,
    change_24h_percent: selectedAsset.change_24h_percent || 0,
    high_24h: selectedAsset.high_24h || 0,
    low_24h: selectedAsset.low_24h || 0,
    volume_24h: selectedAsset.volume_24h || 0,
    market_cap_formatted: selectedAsset.market_cap_formatted || 'N/A',
  };

  const isUp = safeAsset.change_24h_percent >= 0;

  return (
    <>
      <Helmet>
        <title>Trade {safeAsset.symbol} - Plutus Trading Terminal</title>
        <meta name="description" content="Access our professional trading terminal with real-time data. Trade cryptocurrencies and stocks with advanced charts and swift execution." />
      </Helmet>

      <div className="pt-16 bg-background">
        {/* Desktop Layout */}
        <div className="hidden lg:flex gap-4 p-4 min-h-screen">
          {/* Left Sidebar - Markets */}
          <motion.aside variants={itemVariants} className="w-64 xl:w-72 plutus-card flex flex-col p-4 h-[calc(100vh-6rem)] sticky top-20">
            <h2 className="text-base font-semibold mb-4 flex items-center justify-between text-gray-900">
              Markets <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
              />
            </div>
            <div className="flex-grow overflow-y-auto -mr-2 pr-2">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                    selectedAsset?.id === asset.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center">
                    <Star
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(asset.id);
                      }}
                      className={`w-4 h-4 mr-3 transition-colors cursor-pointer ${watchlist.has(asset.id) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                    />
                    <div>
                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chart/${asset.symbol}`);
                        }}
                        title="Click to view advanced chart"
                        className={cn(
                          "font-semibold text-sm cursor-pointer transition-colors hover:text-blue-600",
                          selectedAsset?.id === asset.id ? 'text-blue-700' : 'text-gray-900'
                        )}
                      >
                        {asset.symbol}/USD
                      </p>
                      <p className="text-xs text-gray-500">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-gray-900 tnum">
                      ${(asset.price || 0).toFixed(asset.price < 1 ? 4 : 2)}
                    </p>
                    <p className={`text-xs font-semibold tnum ${(asset.change_24h_percent || 0) >= 0 ? 'price-up' : 'price-down'}`}>
                      {(asset.change_24h_percent || 0) >= 0 ? '+' : ''}{(asset.change_24h_percent || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>

          {/* Main Content Area - Chart and Place Order */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Chart Section */}
            <motion.div variants={itemVariants} className="plutus-card overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h2
                      onClick={() => navigate(`/chart/${safeAsset.symbol}`)}
                      title="Click to view advanced chart"
                      className="text-xl font-bold tracking-tight cursor-pointer transition-colors text-gray-900 hover:text-blue-600"
                    >
                      {safeAsset.symbol}/USD
                    </h2>
                    <p className="text-sm text-gray-500">{safeAsset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 tnum">
                      ${safeAsset.price.toFixed(safeAsset.price < 1 ? 4 : 2)}
                    </p>
                    <p className={`text-sm font-semibold tnum ${isUp ? 'price-up' : 'price-down'}`}>
                      {isUp ? '+' : ''}{safeAsset.change_24h.toFixed(2)} ({isUp ? '+' : ''}{safeAsset.change_24h_percent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">24h High</span>
                    <p className="font-semibold text-gray-900 tnum">${safeAsset.high_24h.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">24h Low</span>
                    <p className="font-semibold text-gray-900 tnum">${safeAsset.low_24h.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume</span>
                    <p className="font-semibold text-gray-900 tnum">${(safeAsset.volume_24h / 1e6).toFixed(2)}M</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Market Cap</span>
                    <p className="font-semibold text-gray-900 tnum">{safeAsset.market_cap_formatted}</p>
                  </div>
                </div>
              </div>
              <div className="w-full mt-4">
                <TradingChart asset={safeAsset} />
              </div>
            </motion.div>

            {/* Place Order Section - Under Chart */}
            <motion.div variants={itemVariants} className="plutus-card p-6">
              <h2 className="text-base font-semibold mb-4 text-gray-900">Place Order</h2>
              <Tabs value={orderSide} onValueChange={setOrderSide} className="mb-4">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold">Buy</TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm font-semibold">Sell</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs defaultValue="market" onValueChange={setOrderType}>
                <TabsList className="grid w-full grid-cols-3 text-xs h-8 bg-gray-100 rounded-lg">
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="limit">Limit</TabsTrigger>
                  <TabsTrigger value="stop">Stop</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-4 mt-4">
                {orderType !== 'market' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Price (USD)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={safeAsset.price.toFixed(2)}
                      className={inputClass}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500">Amount ({safeAsset.symbol})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                {/* Wallet Balance */}
                {wallet && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Available Cash</span>
                      <span className="font-semibold text-gray-900 tnum">
                        ${wallet.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {safeAsset.symbol && wallet.holdings[safeAsset.symbol] && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Your {safeAsset.symbol}</span>
                        <span className="font-semibold text-blue-600 tnum">
                          {wallet.holdings[safeAsset.symbol].quantity.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Est. Total</span>
                    <span className="font-semibold text-gray-900 tnum">
                      ${(parseFloat(amount || 0) * (orderType === 'market' ? safeAsset.price : parseFloat(price || safeAsset.price))).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleTrade}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-lg text-base font-semibold transition-colors ${orderSide === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    orderSide === 'buy' ? `Buy ${safeAsset.symbol}` : `Sell ${safeAsset.symbol}`
                  )}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar - Order Book */}
          <motion.div variants={itemVariants} className="w-80 plutus-card h-[calc(100vh-6rem)] sticky top-20 overflow-hidden">
            <OrderBook asset={safeAsset} />
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{safeAsset.symbol}/USD</h3>
              <p className="text-lg font-semibold text-gray-900 tnum">
                ${safeAsset.price.toFixed(safeAsset.price < 1 ? 4 : 2)}
              </p>
            </div>
            <p className={`text-sm font-semibold tnum ${isUp ? 'price-up' : 'price-down'}`}>
              {isUp ? '+' : ''}{safeAsset.change_24h.toFixed(2)} ({isUp ? '+' : ''}{safeAsset.change_24h_percent.toFixed(2)}%)
            </p>
          </div>

          <div className="flex-grow overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMobileTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeMobileTab === 'chart' && <div className="bg-white"><TradingChart asset={safeAsset} /></div>}
                {activeMobileTab === 'book' && <div className="bg-white"><OrderBook asset={safeAsset} /></div>}
                {activeMobileTab === 'trade' &&
                  <div className="p-4 bg-white">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Place Order</h2>
                    <Tabs value={orderSide} onValueChange={setOrderSide} className="mb-4">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg">
                        <TabsTrigger value="buy" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold">Buy</TabsTrigger>
                        <TabsTrigger value="sell" className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm font-semibold">Sell</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Tabs defaultValue="market" onValueChange={setOrderType}>
                      <TabsList className="grid w-full grid-cols-3 text-xs h-8 bg-gray-100 rounded-lg">
                        <TabsTrigger value="market">Market</TabsTrigger>
                        <TabsTrigger value="limit">Limit</TabsTrigger>
                        <TabsTrigger value="stop">Stop</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="space-y-4 mt-4">
                      {orderType !== 'market' && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Price (USD)</label>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder={safeAsset.price.toFixed(2)}
                            className={inputClass}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-500">Amount ({safeAsset.symbol})</label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className={inputClass}
                        />
                      </div>
                      <Button
                        onClick={handleTrade}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-lg text-base font-semibold transition-colors ${orderSide === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          orderSide === 'buy' ? `Buy ${safeAsset.symbol}` : `Sell ${safeAsset.symbol}`
                        )}
                      </Button>
                    </div>
                  </div>
                }
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-around p-2 bg-white border-t border-gray-200">
            <button onClick={() => setShowMarketList(true)} className="flex flex-col items-center p-2 rounded-lg text-gray-500">
              <List size={24} />
              <span className="text-xs mt-1">Markets</span>
            </button>
            <button onClick={() => setActiveMobileTab('chart')} className={`flex flex-col items-center p-2 rounded-lg ${activeMobileTab === 'chart' ? 'text-blue-600' : 'text-gray-500'}`}>
              <BarChart2 size={24} />
              <span className="text-xs mt-1">Chart</span>
            </button>
            <button onClick={() => setActiveMobileTab('book')} className={`flex flex-col items-center p-2 rounded-lg ${activeMobileTab === 'book' ? 'text-blue-600' : 'text-gray-500'}`}>
              <BookOpen size={24} />
              <span className="text-xs mt-1">Book</span>
            </button>
            <button onClick={() => setActiveMobileTab('trade')} className={`flex flex-col items-center p-2 rounded-lg ${activeMobileTab === 'trade' ? 'text-blue-600' : 'text-gray-500'}`}>
              <Clock size={24} />
              <span className="text-xs mt-1">Trade</span>
            </button>
          </div>

          <AnimatePresence>
            {showMarketList && <MarketListPanel onSelect={(asset) => {
              setSelectedAsset(asset);
              setShowMarketList(false);
            }} />}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Trade;
