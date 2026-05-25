import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  useEffect(() => {
    console.log('🎯 TradingChart useEffect triggered:', { 
      assetSymbol: asset?.symbol, 
      timeframe,
      hasAsset: !!asset 
    });

    const loadData = async () => {
      if (!asset || !asset.symbol) {
        console.log('⚠️ No asset or symbol, skipping load');
        setLoading(false);
        return;
      }

      console.log(`📊 Loading chart data for ${asset.symbol} (${timeframe})...`);
      setLoading(true);
      setError(null);
      
      try {
        const assetType = asset.type || 'crypto';
        console.log(`🔄 Calling fetchChartData(${asset.symbol}, ${timeframe}, ${assetType})`);
        
        const chartResponse = await fetchChartData(asset.symbol, timeframe, assetType);
        
        console.log('📥 Chart response received:', chartResponse);
        
        if (!chartResponse) {
          console.error('❌ No chart response received');
          setError('No chart response from server');
          setLoading(false);
          return;
        }
        
        if (!chartResponse.ohlcv) {
          console.error('❌ No ohlcv data in response');
          setError('Invalid chart data format');
          setLoading(false);
          return;
        }
        
        if (chartResponse.ohlcv.length === 0) {
          console.error('❌ Empty ohlcv array');
          setError('No chart data available');
          setLoading(false);
          return;
        }
        
        console.log(`✅ Chart data loaded: ${chartResponse.ohlcv.length} candles`);
        setChartData(chartResponse.ohlcv);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Error loading chart data:', err);
        console.error('Error stack:', err.stack);
        setError(err.message || 'Failed to load chart');
        setLoading(false);
      }
    };
    
    loadData();
  }, [asset?.symbol, timeframe]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('📈 Chart state:', { 
      loading, 
      error, 
      chartDataLength: chartData.length,
      hasAsset: !!asset 
    });
  }, [loading, error, chartData.length, asset]);

  if (!asset) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>Select an asset from Markets</p>
        </div>
      </div>
    );
  }

  const timeframes = ['1D', '5D', '1M', '3M', '1Y', '5Y'];
  const isPositive = (asset.change_24h_percent || 0) >= 0;
  const gradientColor = isPositive ? 'url(#positiveGradient)' : 'url(#negativeGradient)';
  const strokeColor = isPositive ? '#16a34a' : '#dc2626';

  const prices = chartData.map(d => d.close);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full flex flex-col p-4">
      {/* Price Header */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={cn(
            "text-2xl font-medium",
            theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
          )}>
            ${Number(asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={cn(
            "text-sm font-medium",
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
              onClick={() => {
                console.log(`⏱️ Timeframe changed to: ${tf}`);
                setTimeframe(tf);
              }}
              disabled={loading}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                timeframe === tf
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                    : theme === 'gradient'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:bg-zinc-800'
                  : theme === 'gradient'
                  ? 'text-white/70 hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tf}
            </button>
          ))}
          {loading && (
            <RefreshCw className={cn(
              "w-4 h-4 animate-spin ml-2 self-center",
              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-600'
            )} />
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            <div className="text-center">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p>Loading chart data...</p>
              <p className="text-xs mt-2">Fetching {timeframe} data for {asset.symbol}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[400px] text-red-400">
            <div className="text-center">
              <p className="font-semibold mb-2">❌ Chart Error</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            <div className="text-center">
              <p>No chart data available</p>
              <p className="text-xs mt-2">Try a different timeframe or asset</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === 'dark' ? '#27272a' : theme === 'gradient' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} 
                vertical={false} 
              />
              <XAxis 
                dataKey="time" 
                stroke={theme === 'dark' ? '#52525b' : theme === 'gradient' ? 'rgba(255,255,255,0.5)' : '#9ca3af'} 
                tick={{fontSize: 12}} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke={theme === 'dark' ? '#52525b' : theme === 'gradient' ? 'rgba(255,255,255,0.5)' : '#9ca3af'} 
                tick={{fontSize: 12}} 
                orientation="right" 
                tickLine={false} 
                axisLine={false} 
                domain={[minPrice - padding, maxPrice + padding]}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? 'rgba(24, 24, 27, 0.9)' : theme === 'gradient' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: theme === 'dark' ? '1px solid rgba(244, 63, 94, 0.3)' : theme === 'gradient' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: theme === 'dark' ? '#fff' : theme === 'gradient' ? '#fff' : '#374151'
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3">
                        <p className="text-xs mb-1 opacity-70">Point {data.time}</p>
                        <p className="text-lg font-bold">${data.close?.toFixed(2)}</p>
                        <div className="mt-2 space-y-1 text-xs opacity-70">
                          <p>High: ${data.high?.toFixed(2)}</p>
                          <p>Low: ${data.low?.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2.5}
                fill={gradientColor}
                dot={false}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data info */}
      {!loading && !error && chartData.length > 0 && (
        <div className={cn(
          "text-xs text-center mt-2",
          theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-400'
        )}>
          {chartData.length} data points • Live data from backend
        </div>
      )}
    </div>
  );
};

export default TradingChart;
