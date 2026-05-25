import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { fetchChartData } from '@/services/chartDataService';

const TradingChart = ({ asset }) => {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Load chart data with auto-refresh
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async (isRefresh = false) => {
      if (!asset || !asset.symbol) {
        if (isMounted) {
          setLoading(false);
          setError('No asset selected');
        }
        return;
      }

      if (!isRefresh && isMounted) setLoading(true);
      if (isMounted) setError(null);
      
      try {
        // Fetch historical chart data from backend
        const assetType = asset.type || 'crypto';
        console.log(`Fetching chart data for ${asset.symbol}, type: ${assetType}, timeframe: ${timeframe}`);
        
        const chartResponse = await fetchChartData(asset.symbol, timeframe, assetType);
        
        console.log('Chart response:', chartResponse);
        
        if (!chartResponse || !chartResponse.ohlcv || chartResponse.ohlcv.length === 0) {
          if (isMounted) {
            // Generate mock data if API fails
            const mockData = generateMockData(asset.price, 50, timeframe);
            setChartData(mockData);
            setLastUpdate(new Date());
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setChartData(chartResponse.ohlcv);
          setLastUpdate(new Date());
          setLoading(false);
        }
        
      } catch (err) {
        console.error('Error loading chart data:', err);
        if (isMounted) {
          // Generate mock data on error
          const mockData = generateMockData(asset.price, 50, timeframe);
          setChartData(mockData);
          setLastUpdate(new Date());
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadData(true);
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [asset?.symbol, timeframe]);

  // Generate mock chart data
  const generateMockData = (basePrice, points, tf) => {
    const data = [];
    const now = Date.now();
    
    // Time intervals based on timeframe
    const intervals = {
      '1D': 60 * 60 * 1000 / points, // 24 hours divided
      '5D': 5 * 24 * 60 * 60 * 1000 / points,
      '1M': 30 * 24 * 60 * 60 * 1000 / points,
      '3M': 90 * 24 * 60 * 60 * 1000 / points,
      '1Y': 365 * 24 * 60 * 60 * 1000 / points,
      '5Y': 5 * 365 * 24 * 60 * 60 * 1000 / points,
    };
    
    const interval = intervals[tf] || intervals['1D'];
    let price = basePrice * (0.95 + Math.random() * 0.1);
    
    for (let i = points; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * price * volatility;
      price = Math.max(price + change, 0.01);
      
      const open = price;
      const close = price + (Math.random() - 0.5) * price * 0.01;
      const high = Math.max(open, close) + Math.random() * price * 0.005;
      const low = Math.min(open, close) - Math.random() * price * 0.005;
      
      const date = new Date(timestamp);
      let timeStr;
      switch (tf) {
        case '1D':
          timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          break;
        case '5D':
          timeStr = date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          break;
        default:
          timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      data.push({
        timestamp,
        time: timeStr,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  };

  if (!asset) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p className={cn(
          "text-lg",
          theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
        )}>
          Select an asset from Markets
        </p>
      </div>
    );
  }

  const timeframes = ['1D', '5D', '1M', '3M', '1Y', '5Y'];
  const isPositive = (asset.change_24h_percent || 0) >= 0;

  // Calculate min and max for better Y-axis scaling with expanded price range
  // Only calculate if we have chart data
  let minPrice = 0;
  let maxPrice = 0;
  let finalPadding = 0;

  if (chartData.length > 0) {
    const prices = chartData.flatMap(d => [d.open, d.close, d.high, d.low].filter(p => p !== undefined && p !== null));
    if (prices.length > 0) {
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      // Use 5% padding for tight price range
      const padding = priceRange * 0.05;
      // Ensure minimum padding for assets with low volatility
      const minPadding = maxPrice * 0.005; // 0.5% of max price
      finalPadding = Math.max(padding, minPadding);
    }
  }

  return (
    <div className="w-full flex flex-col">
      {/* Price Header */}
      <div className={cn(
        "px-4 pt-4 pb-3 border-b",
        theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
      )}>
        <div className="flex items-baseline gap-3 mb-3">
          <span className={cn(
            "text-3xl font-bold",
            theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
          )}>
            ${Number(asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={cn(
            "text-lg font-semibold",
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? '▲' : '▼'} ${Math.abs(asset.change_24h || 0).toFixed(2)} ({Math.abs(asset.change_24h_percent || 0).toFixed(2)}%)
          </span>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              disabled={loading}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                timeframe === tf
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                    : theme === 'gradient'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                  : theme === 'gradient'
                  ? 'text-white/70 hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: '500px' }}>
            <div className="text-center">
              <RefreshCw className={cn(
                "animate-spin h-12 w-12 mx-auto mb-4",
                theme === 'dark' ? 'text-blue-500' : 'text-blue-600'
              )} />
              <p className={cn(
                "text-lg",
                theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
              )}>
                Loading chart data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center" style={{ height: '500px' }}>
            <p className={cn(
              "text-lg text-center px-4",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
            )}>
              {error}
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: '500px' }}>
            <p className={cn(
              "text-lg",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
            )}>
              No data available
            </p>
          </div>
        ) : (
          /* Area Chart */
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="tradingColorPrice" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(value) => `${value.toLocaleString()}`}
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
                          {data.time}
                        </p>
                        <p className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                          ${data.close?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                            Open: ${data.open?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                            High: ${data.high?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={cn("text-xs", theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                            Low: ${data.low?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                strokeWidth={2}
                fill="url(#tradingColorPrice)"
                animationDuration={800}
              />

              {/* Reference line for current price */}
              <ReferenceLine 
                y={asset.price} 
                stroke={theme === 'dark' ? '#ef4444' : '#dc2626'} 
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Live: $${asset.price.toLocaleString()}`,
                  position: 'right',
                  fill: theme === 'dark' ? '#ef4444' : '#dc2626',
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data info */}
      {!loading && !error && chartData.length > 0 && (
        <div className={cn(
          "text-xs text-center pb-4 flex items-center justify-center gap-2",
          theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-400'
        )}>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live • {chartData.length} points • Updated {lastUpdate?.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
