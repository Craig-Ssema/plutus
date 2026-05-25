import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, BarChart3, Activity, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { fetchAllMarketData } from '@/services/marketDataService';
import { fetchChartData, calculateMACD, calculateTrendLines } from '@/services/chartDataService';
import { 
  AreaChart,
  Area,
  Line,
  ComposedChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Customized,
  Rectangle
} from 'recharts';

// Professional Candlestick Renderer - Uses chart scales for proper positioning
const CandlestickSeries = ({ data, xAxisMap, yAxisMap }) => {
  if (!data || data.length === 0 || !xAxisMap || !yAxisMap) return null;
  
  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];
  
  if (!xAxis || !yAxis) return null;
  
  const { scale: xScale } = xAxis;
  const { scale: yScale } = yAxis;
  
  if (!xScale || !yScale) return null;
  
  // Calculate bar width based on number of data points and chart width
  const chartWidth = xAxis.width || 800;
  const barWidth = Math.max((chartWidth / data.length) * 0.6, 3);
  
  return (
    <g className="candlestick-series">
      {data.map((candle, index) => {
        if (!candle.open || !candle.close || !candle.high || !candle.low) return null;
        
        const { open, close, high, low, time } = candle;
        const isPositive = close >= open;
        
        // Colors
        const bullishColor = '#26a69a';
        const bearishColor = '#ef5350';
        const color = isPositive ? bullishColor : bearishColor;
        
        // Calculate x position - use bandwidth for category scale
        let x;
        if (typeof xScale.bandwidth === 'function') {
          x = xScale(time) + xScale.bandwidth() / 2;
        } else if (typeof xScale === 'function') {
          x = xScale(time);
        } else {
          return null;
        }
        
        // Skip if x is invalid
        if (isNaN(x) || x === undefined) return null;
        
        // Calculate y positions using the scale
        const highY = yScale(high);
        const lowY = yScale(low);
        const openY = yScale(open);
        const closeY = yScale(close);
        
        // Skip if any y value is invalid
        if (isNaN(highY) || isNaN(lowY) || isNaN(openY) || isNaN(closeY)) return null;
        
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
        const bodyWidth = Math.max(barWidth * 0.6, 4);
        
        return (
          <g key={`candle-${index}`}>
            {/* Wick (full high-low line) */}
            <line
              x1={x}
              y1={highY}
              x2={x}
              y2={lowY}
              stroke={color}
              strokeWidth={1}
            />
            {/* Body */}
            <rect
              x={x - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              fill={color}
              stroke={color}
              strokeWidth={1}
              rx={1}
            />
          </g>
        );
      })}
    </g>
  );
};

const AdvancedChart = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('area'); // 'area', 'candlestick', or 'live'
  const [asset, setAsset] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [macdData, setMacdData] = useState([]);
  const [trendLines, setTrendLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Real-time data simulation for live chart (area only)
  useEffect(() => {
    if (chartType !== 'live' || !asset) return;

    // Initialize live data with last 60 price points (1 per second)
    const initializeLiveData = () => {
      const now = Date.now();
      const basePrice = asset.price;
      const initialData = [];
      
      for (let i = 60; i >= 0; i--) {
        const timestamp = now - i * 1000;
        const volatility = 0.001; // 0.1% volatility
        const randomChange = (Math.random() - 0.5) * basePrice * volatility;
        const price = basePrice + randomChange;
        
        initialData.push({
          timestamp,
          time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: price,
          open: price - (Math.random() * basePrice * 0.0005),
          high: price + (Math.random() * basePrice * 0.001),
          low: price - (Math.random() * basePrice * 0.001),
          close: price,
          volume: Math.random() * 1000000
        });
      }
      
      setLiveData(initialData);
    };

    initializeLiveData();

    // Update data every second
    const interval = setInterval(() => {
      setLiveData(prevData => {
        const lastCandle = prevData[prevData.length - 1];
        const lastPrice = lastCandle?.price || asset.price;
        const volatility = 0.001;
        const trend = (asset.change_24h_percent / 100) * 0.01;
        const randomChange = (Math.random() - 0.5 + trend) * lastPrice * volatility;
        const newPrice = Math.max(0, lastPrice + randomChange);
        const now = Date.now();
        
        // Generate OHLC for the new candle
        const open = lastPrice;
        const close = newPrice;
        const high = Math.max(open, close) + (Math.random() * lastPrice * 0.0005);
        const low = Math.min(open, close) - (Math.random() * lastPrice * 0.0005);
        
        const newPoint = {
          timestamp: now,
          time: new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: newPrice,
          open: open,
          high: high,
          low: low,
          close: close,
          volume: Math.random() * 1000000
        };
        
        return [...prevData, newPoint].slice(-60); // Keep last 60 points (1 minute)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [chartType, asset, theme]);

  // Fetch asset info and chart data with auto-refresh
  useEffect(() => {
    const loadData = async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      try {
        // Fetch asset info from market data
        const marketData = await fetchAllMarketData();
        const foundAsset = marketData.find(a => a.symbol === symbol);
        
        if (!foundAsset) {
          setError(`Asset ${symbol} not found`);
          setLoading(false);
          return;
        }
        
        setAsset(foundAsset);
        
        // Fetch historical chart data from backend
        const assetType = foundAsset.type || 'crypto';
        const chartResponse = await fetchChartData(symbol, timeframe, assetType);
        
        if (!chartResponse || !chartResponse.ohlcv || chartResponse.ohlcv.length === 0) {
          setError('No chart data available');
          setLoading(false);
          return;
        }
        
        // Add theme and range to each data point for candlestick rendering
        const chartDataWithTheme = chartResponse.ohlcv.map(candle => ({
          ...candle,
          theme: theme,
          // Add range for candlestick bar height (high - low)
          range: candle.high - candle.low
        }));
        
        setChartData(chartDataWithTheme);
        setLastUpdate(new Date());
        
        // Calculate MACD indicator
        const macd = calculateMACD(chartResponse.ohlcv);
        setMacdData(macd);
        
        // Calculate trend lines
        const trends = calculateTrendLines(chartResponse.ohlcv);
        setTrendLines(trends);
        
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Auto-refresh every 30 seconds for live data
    const refreshInterval = setInterval(() => {
      loadData(true);
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [symbol, timeframe, theme]);

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen pt-16 flex items-center justify-center",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' : 'bg-gray-50'
      )}>
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className={cn(
            "text-lg",
            theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white' : 'text-gray-600'
          )}>
            Loading real-time chart data...
          </p>
          <p className={cn(
            "text-sm mt-2",
            theme === 'dark' ? 'text-gray-600' : theme === 'gradient' ? 'text-white/70' : 'text-gray-400'
          )}>
            Fetching {symbol} market data
          </p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className={cn(
        "min-h-screen pt-16 flex items-center justify-center",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' : 'bg-gray-50'
      )}>
        <div className="text-center">
          <p className={cn(
            "text-lg mb-2",
            theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
          )}>
            {error || 'Asset not found'}
          </p>
          <button
            onClick={() => navigate('/trade')}
            className={cn(
              "px-6 py-2 rounded-lg mt-4",
              theme === 'dark'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            Back to Trade
          </button>
        </div>
      </div>
    );
  }

  const isPositive = asset.change_24h_percent >= 0;
  const timeframes = ['1D', '5D', '1M', '3M', '1Y', '5Y'];

  // Calculate min and max for better Y-axis scaling with tight price range
  const prices = chartData.flatMap(d => [d.open, d.close, d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  // Use only 5% padding for a tight, professional look
  const padding = priceRange * 0.05;
  // Ensure minimum padding for assets with low volatility
  const minPadding = maxPrice * 0.005; // 0.5% of max price
  const finalPadding = Math.max(padding, minPadding);

  return (
    <>
      <Helmet>
        <title>{asset.symbol}/USD - Advanced Chart - Plutus</title>
        <meta name="description" content={`Advanced trading chart for ${asset.symbol} with real-time market data and technical indicators`} />
      </Helmet>

      <div className={cn(
        "min-h-screen pt-16",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' : 'bg-gray-50'
      )}>
        <div className="h-full">
          {/* Header */}
          <div className={cn(
            "border-b px-6 py-4",
            theme === 'dark' 
              ? 'bg-zinc-900 border-red-900/30' 
              : theme === 'gradient'
              ? 'bg-white/10 backdrop-blur-md border-white/20'
              : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center justify-between max-w-[2000px] mx-auto">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => navigate('/trade')}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    theme === 'dark'
                      ? 'hover:bg-zinc-800 text-gray-400 hover:text-white'
                      : 'hover:bg-white/60 text-gray-600'
                  )}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  <h1 className={cn(
                    "text-2xl font-bold",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                  )}>
                    {asset.symbol}/USD
                  </h1>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-sm font-medium",
                    theme === 'dark' ? 'bg-zinc-800 text-gray-400' : theme === 'gradient' ? 'bg-white/10 text-white/70' : 'bg-white/60 text-gray-600'
                  )}>
                    {asset.name}
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  )}>
                    LIVE DATA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className={cn(
                    "text-3xl font-bold",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                  )}>
                    ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={cn(
                      "font-semibold",
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                      {isPositive ? '+' : ''}{asset.change_24h.toFixed(2)} ({isPositive ? '+' : ''}{asset.change_24h_percent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className={cn(
            "p-4",
            theme === 'dark' ? 'bg-black' : theme === 'gradient' ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' : 'bg-gray-50'
          )}>
            <div className={cn(
              "rounded-2xl overflow-hidden shadow-xl",
              theme === 'dark' 
                ? 'bg-zinc-900 border border-red-900/30' 
                : theme === 'gradient'
                ? 'bg-white/10 backdrop-blur-md border border-white/20'
                : 'bg-white'
            )}>
              {/* Stats Bar */}
              <div className={cn(
                "px-6 py-4 border-b flex items-center gap-8",
                theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
              )}>
                <div>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500')}>
                    24h High
                  </p>
                  <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900')}>
                    ${asset.high_24h.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-gray-700' : 'text-gray-500')}>
                    24h Low
                  </p>
                  <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    ${asset.low_24h.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                    Volume
                  </p>
                  <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    ${(asset.volume_24h / 1e6).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                    Market Cap
                  </p>
                  <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    {asset.market_cap_formatted}
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                    Data Points
                  </p>
                  <p className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    {chartData.length}
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                    Last Update
                  </p>
                  <p className={cn("font-semibold flex items-center gap-1", theme === 'dark' ? 'text-green-400' : 'text-green-600')}>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                  </p>
                </div>
              </div>

              {/* Chart Type & Timeframe Selector */}
              <div className={cn(
                "px-6 py-3 border-b flex items-center justify-between",
                theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
              )}>
                {/* Chart Type Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChartType('area')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      chartType === 'area'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : theme === 'gradient'
                          ? 'bg-white/30 text-white shadow-lg'
                          : 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                        : 'text-gray-600 hover:bg-white/60'
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    Area
                  </button>
                  <button
                    onClick={() => setChartType('candlestick')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      chartType === 'candlestick'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : theme === 'gradient'
                          ? 'bg-white/30 text-white shadow-lg'
                          : 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                        : 'text-gray-600 hover:bg-white/60'
                    )}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Candlestick
                  </button>
                  <button
                    onClick={() => setChartType('live')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      chartType === 'live'
                        ? theme === 'dark'
                          ? 'bg-green-600 text-white'
                          : theme === 'gradient'
                          ? 'bg-white/30 text-white shadow-lg'
                          : 'bg-green-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                        : 'text-gray-600 hover:bg-white/60'
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    Live
                    {chartType === 'live' && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
                        LIVE
                      </span>
                    )}
                  </button>
                </div>

                {/* Timeframe Selector */}
                <div className="flex items-center gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        timeframe === tf
                          ? theme === 'dark'
                            ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                            : theme === 'gradient'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                          : 'text-gray-600 hover:bg-white/60'
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Display */}
              <div className="p-4">
                {chartType === 'live' ? (
                  /* Live Real-Time Chart - Area Only */
                  <div>
                    {/* Live Price Display */}
                    <div className={cn(
                      "mb-4 p-3 rounded-lg border",
                      theme === 'dark' ? 'bg-zinc-800 border-red-900/30' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={cn(
                            "text-sm mb-1",
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Current Price
                          </p>
                          <p className={cn(
                            "text-3xl font-bold",
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            ${(liveData[liveData.length - 1]?.price?.toFixed(2) || asset.price.toFixed(2))}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className={cn(
                              "text-sm font-medium",
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              Streaming Live
                            </span>
                          </div>
                          <p className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            Updates every second
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Live Area Chart */}
                    <ResponsiveContainer width="100%" height={700}>
                      <ComposedChart data={liveData}>
                        <defs>
                          <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={theme === 'dark' ? '#27272a' : '#e5e7eb'} 
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="time" 
                          stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          interval={9}
                        />
                        <YAxis 
                          stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                          tick={{ fontSize: 11 }}
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          tickCount={12}
                          domain={['auto', 'auto']}
                          tickFormatter={(value) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                            border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: theme === 'dark' ? '#ffffff' : '#111827',
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const priceChange = liveData[0] ? data.price - liveData[0].price : 0;
                              const priceChangePercent = liveData[0] ? (priceChange / liveData[0].price) * 100 : 0;
                              const isProfitable = priceChange >= 0;
                              
                              return (
                                <div className={cn(
                                  "p-3 rounded-lg shadow-lg",
                                  theme === 'dark' ? 'bg-zinc-800 border border-red-900/30' : 'bg-white border border-gray-200'
                                )}>
                                  <p className={cn("text-xs mb-2", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    {data.time}
                                  </p>
                                  <p className={cn("text-2xl font-bold mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                    ${data.price?.toFixed(2)}
                                  </p>
                                  <p className={cn(
                                    "text-sm font-semibold",
                                    isProfitable ? 'text-green-500' : 'text-red-500'
                                  )}>
                                    {isProfitable ? '▲' : '▼'} {isProfitable ? '+' : ''}{priceChange.toFixed(2)} ({isProfitable ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        
                        {/* Live Price Line */}
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#10b981"
                          strokeWidth={3}
                          fill="url(#liveGradient)"
                          isAnimationActive={false}
                          dot={false}
                        />

                        {/* Current price reference line */}
                        <ReferenceLine 
                          y={liveData[liveData.length - 1]?.price || asset.price} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3"
                          strokeWidth={2}
                          label={{
                            value: `Live: ${(liveData[liveData.length - 1]?.price || asset.price).toFixed(2)}`,
                            position: 'right',
                            fill: '#ef4444',
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>

                    {/* Live Stats */}
                    <div className={cn(
                      "mt-4 grid grid-cols-4 gap-3 p-3 rounded-lg border",
                      theme === 'dark' ? 'bg-zinc-800 border-red-900/30' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div>
                        <p className={cn("text-xs mb-1", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                          1min High
                        </p>
                        <p className={cn("text-lg font-bold", theme === 'dark' ? 'text-green-400' : 'text-green-600')}>
                          ${Math.max(...liveData.map(d => d.price || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={cn("text-xs mb-1", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                          1min Low
                        </p>
                        <p className={cn("text-lg font-bold", theme === 'dark' ? 'text-red-400' : 'text-red-600')}>
                          ${Math.min(...liveData.map(d => d.price || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={cn("text-xs mb-1", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                          Avg Price
                        </p>
                        <p className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          ${(liveData.reduce((sum, d) => sum + (d.price || 0), 0) / liveData.length).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={cn("text-xs mb-1", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                          Data Points
                        </p>
                        <p className={cn("text-lg font-bold", theme === 'dark' ? 'text-blue-400' : 'text-blue-600')}>
                          {liveData.length} ticks
                        </p>
                      </div>
                    </div>
                  </div>
                ) : chartType === 'area' ? (
                  /* Area Chart with Trend Lines */
                  <ResponsiveContainer width="100%" height={700}>
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop 
                            offset="5%" 
                            stopColor={isPositive ? '#10b981' : '#ef4444'} 
                            stopOpacity={0.3}
                          />
                          <stop 
                            offset="95%" 
                            stopColor={isPositive ? '#10b981' : '#ef4444'} 
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === 'dark' ? '#27272a' : '#e5e7eb'} 
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="time" 
                        stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                        tick={{ fontSize: 12 }}
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickCount={12}
                        domain={[minPrice - finalPadding, maxPrice + finalPadding]}
                        tickFormatter={(value) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                          border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#111827',
                        }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className={cn(
                                "p-3 rounded-lg shadow-lg",
                                theme === 'dark' ? 'bg-zinc-800 border border-red-900/30' : 'bg-white border border-gray-200'
                              )}>
                                <p className={cn("text-xs mb-2", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                  Point {data.time}
                                </p>
                                <p className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                  ${data.close?.toFixed(2)}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    High: ${data.high?.toFixed(2)}
                                  </p>
                                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    Low: ${data.low?.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      {/* Area Chart */}
                      <Area
                        type="monotone"
                        dataKey="close"
                        stroke={isPositive ? '#10b981' : '#ef4444'}
                        strokeWidth={3}
                        fill="url(#colorPrice)"
                        animationDuration={1000}
                      />

                      {/* Trend Lines */}
                      {trendLines.map((trendLine) => (
                        <Line
                          key={trendLine.id}
                          type="linear"
                          dataKey={(data) => {
                            const x1 = trendLine.points[0].x;
                            const y1 = trendLine.points[0].y;
                            const x2 = trendLine.points[1].x;
                            const y2 = trendLine.points[1].y;
                            
                            if (data.time < x1 || data.time > x2) return null;
                            
                            const slope = (y2 - y1) / (x2 - x1);
                            return y1 + slope * (data.time - x1);
                          }}
                          stroke={trendLine.color}
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="5 5"
                          name={trendLine.name}
                        />
                      ))}

                      {/* Reference line for current price */}
                      <ReferenceLine 
                        y={asset.price} 
                        stroke={theme === 'dark' ? '#3b82f6' : '#2563eb'} 
                        strokeDasharray="3 3"
                        label={{
                          value: `Current: $${asset.price.toFixed(2)}`,
                          position: 'right',
                          fill: theme === 'dark' ? '#3b82f6' : '#2563eb',
                          fontSize: 12
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  /* Candlestick Chart */
                  <ResponsiveContainer width="100%" height={700}>
                    <ComposedChart 
                      data={chartData}
                      margin={{ top: 20, right: 60, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === 'dark' ? '#27272a' : '#e5e7eb'} 
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="time" 
                        type="category"
                        stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                        tick={{ fontSize: 11 }}
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickCount={12}
                        domain={[minPrice - finalPadding, maxPrice + finalPadding]}
                        tickFormatter={(value) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                          border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#111827',
                        }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const isProfitable = data.close >= data.open;
                            return (
                              <div className={cn(
                                "p-3 rounded-lg shadow-lg",
                                theme === 'dark' ? 'bg-zinc-800 border border-red-900/30' : 'bg-white border border-gray-200'
                              )}>
                                <p className={cn("text-xs mb-2", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                  Candle {data.time}
                                </p>
                                <div className="space-y-1">
                                  <p className={cn("text-sm font-semibold", isProfitable ? 'text-[#26a69a]' : 'text-[#ef5350]')}>
                                    {isProfitable ? '▲ Bullish' : '▼ Bearish'}
                                  </p>
                                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    <span className="font-medium">Open:</span> ${data.open?.toFixed(2)}
                                  </p>
                                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    <span className="font-medium">High:</span> ${data.high?.toFixed(2)}
                                  </p>
                                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    <span className="font-medium">Low:</span> ${data.low?.toFixed(2)}
                                  </p>
                                  <p className={cn("text-xs font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                                    <span className="font-medium">Close:</span> ${data.close?.toFixed(2)}
                                  </p>
                                  <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                                    <span className="font-medium">Change:</span> 
                                    <span className={isProfitable ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                                      {' '}{isProfitable ? '+' : ''}{(data.close - data.open).toFixed(2)} ({((data.close - data.open) / data.open * 100).toFixed(2)}%)
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      {/* Candlesticks - Custom rendering for proper positioning */}
                      <Customized 
                        component={(props) => (
                          <CandlestickSeries 
                            data={chartData} 
                            xAxisMap={props.xAxisMap} 
                            yAxisMap={props.yAxisMap} 
                          />
                        )} 
                      />

                      {/* Reference line for current price */}
                      <ReferenceLine 
                        y={asset.price} 
                        stroke={theme === 'dark' ? '#3b82f6' : '#2563eb'} 
                        strokeDasharray="3 3"
                        label={{
                          value: `Current: $${asset.price.toFixed(2)}`,
                          position: 'right',
                          fill: theme === 'dark' ? '#3b82f6' : '#2563eb',
                          fontSize: 12
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* MACD Indicator */}
              <div className={cn(
                "px-6 pb-6 border-t",
                theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
              )}>
                <div className="flex items-center gap-2 mb-4 pt-4">
                  <h3 className={cn(
                    "text-sm font-semibold",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    MACD (12, 26, 9)
                  </h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  )}>
                    Technical Indicator
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <ComposedChart data={macdData}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === 'dark' ? '#27272a' : '#e5e7eb'} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="time" 
                      stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#52525b' : '#9ca3af'}
                      tick={{ fontSize: 10 }}
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <ReferenceLine y={0} stroke={theme === 'dark' ? '#52525b' : '#9ca3af'} />
                    <Bar dataKey="histogram">
                      {macdData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.histogram > 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="macd"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                      name="MACD"
                    />
                    <Line
                      type="monotone"
                      dataKey="signal"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      name="Signal"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className={cn(
                "px-6 py-4 border-t",
                theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {chartType === 'candlestick' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#26a69a' }} />
                          <span className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-800' : 'text-gray-600'
                          )}>
                            Bullish
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef5350' }} />
                          <span className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Bearish
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                          )} />
                          <span className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-800' : 'text-gray-600'
                          )}>
                            Price Trend
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-0.5 border-t-2 border-dashed border-blue-500" />
                          <span className={cn(
                            "text-sm",
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Support Line
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className={cn(
                        "text-sm",
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Current Price
                      </span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-xs",
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  )}>
                    Real-time {chartType === 'candlestick' ? 'OHLC ' : ''}data from {asset.type === 'crypto' ? 'CoinGecko' : 'Alpha Vantage'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedChart;
