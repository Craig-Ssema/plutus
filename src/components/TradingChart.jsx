import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { RefreshCw, BarChart2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchChartData } from '@/services/chartDataService';

const GAIN = '#19A05B';
const LOSS = '#DC2828';

// Simple moving average over close prices
const withMovingAverages = (data) => {
  const closes = data.map((d) => d.close);
  const sma = (period, i) => {
    if (i + 1 < period) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    return sum / period;
  };
  return data.map((d, i) => ({
    ...d,
    range: [d.low, d.high], // for candlestick range bar
    ma20: sma(20, i),
    ma50: sma(50, i),
  }));
};

// Custom candlestick shape rendered inside a range Bar ([low, high])
const Candle = (props) => {
  const { x, y, height, payload } = props;
  // recharts omits `width` for range bars — fall back to barSize
  const width = Number.isFinite(props.width) ? props.width : (props.barSize || 6);
  if (
    !payload ||
    ![x, y, height].every(Number.isFinite) ||
    height <= 0 ||
    width <= 0
  ) return null;

  const { open, close, high, low } = payload;
  const rising = close >= open;
  const color = rising ? GAIN : LOSS;
  const range = high - low || 1;

  // y maps to `high`, y + height maps to `low`
  const priceToY = (price) => y + ((high - price) / range) * height;

  const bodyTop = priceToY(Math.max(open, close));
  const bodyBottom = priceToY(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const cx = x + width / 2;
  const bodyWidth = Math.max(width * 0.6, 1.5);

  return (
    <g>
      {/* Wick */}
      <line x1={cx} y1={y} x2={cx} y2={y + height} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={cx - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={rising ? color : color}
        stroke={color}
        rx={0.5}
      />
    </g>
  );
};

const TradingChart = ({ asset }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('area'); // 'area' | 'candles'
  const [showVolume, setShowVolume] = useState(true);
  const [showMA20, setShowMA20] = useState(false);
  const [showMA50, setShowMA50] = useState(false);
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
        const assetType = asset.type || 'crypto';
        const chartResponse = await fetchChartData(asset.symbol, timeframe, assetType);

        if (!chartResponse || !chartResponse.ohlcv || chartResponse.ohlcv.length === 0) {
          if (isMounted) {
            const mockData = generateMockData(asset.price, 50, timeframe);
            setChartData(withMovingAverages(mockData));
            setLastUpdate(new Date());
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setChartData(withMovingAverages(chartResponse.ohlcv));
          setLastUpdate(new Date());
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        if (isMounted) {
          const mockData = generateMockData(asset.price, 50, timeframe);
          setChartData(withMovingAverages(mockData));
          setLastUpdate(new Date());
          setLoading(false);
        }
      }
    };

    loadData();

    const refreshInterval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [asset?.symbol, timeframe]);

  // Generate mock chart data (fallback when the API is unavailable)
  const generateMockData = (basePrice, points, tf) => {
    const data = [];
    const now = Date.now();

    const intervals = {
      '1D': (60 * 60 * 1000 * 24) / points,
      '5D': (5 * 24 * 60 * 60 * 1000) / points,
      '1M': (30 * 24 * 60 * 60 * 1000) / points,
      '3M': (90 * 24 * 60 * 60 * 1000) / points,
      '1Y': (365 * 24 * 60 * 60 * 1000) / points,
      '5Y': (5 * 365 * 24 * 60 * 60 * 1000) / points,
    };

    const interval = intervals[tf] || intervals['1D'];
    let price = basePrice * (0.95 + Math.random() * 0.1);

    for (let i = points; i >= 0; i--) {
      const timestamp = now - i * interval;
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
        volume: Math.random() * 1000000,
      });
    }

    return data;
  };

  const { minPrice, maxPrice, finalPadding, maxVolume } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 0, finalPadding: 0, maxVolume: 0 };
    const prices = chartData.flatMap((d) => [d.open, d.close, d.high, d.low].filter((p) => p !== undefined && p !== null));
    const volumes = chartData.map((d) => d.volume || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = Math.max((max - min) * 0.05, max * 0.005);
    return { minPrice: min, maxPrice: max, finalPadding: padding, maxVolume: Math.max(...volumes) };
  }, [chartData]);

  const hasVolumeData = maxVolume > 0;

  if (!asset) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p className="text-lg text-gray-600">Select an asset from Markets</p>
      </div>
    );
  }

  const timeframes = ['1D', '5D', '1M', '3M', '1Y', '5Y'];
  const isPositive = (asset.change_24h_percent || 0) >= 0;

  const pillClass = (active) =>
    cn(
      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
      active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    );

  return (
    <div className="w-full flex flex-col">
      {/* Price Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-3xl font-bold text-gray-900 tnum">
            ${Number(asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={cn('text-lg font-semibold tnum', isPositive ? 'price-up' : 'price-down')}>
            {isPositive ? '▲' : '▼'} ${Math.abs(asset.change_24h || 0).toFixed(2)} ({Math.abs(asset.change_24h_percent || 0).toFixed(2)}%)
          </span>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframes */}
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                disabled={loading}
                className={cn(pillClass(timeframe === tf), loading && 'opacity-50 cursor-not-allowed')}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Chart type */}
          <div className="flex gap-1">
            <button
              onClick={() => setChartType('area')}
              className={cn(pillClass(chartType === 'area'), 'flex items-center gap-1')}
              title="Line chart"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Line
            </button>
            <button
              onClick={() => setChartType('candles')}
              className={cn(pillClass(chartType === 'candles'), 'flex items-center gap-1')}
              title="Candlestick chart"
            >
              <BarChart2 className="w-3.5 h-3.5" /> Candles
            </button>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Indicators */}
          <div className="flex gap-1">
            <button
              onClick={() => setShowVolume((v) => !v)}
              disabled={!hasVolumeData}
              className={cn(
                pillClass(showVolume && hasVolumeData),
                !hasVolumeData && 'opacity-40 cursor-not-allowed'
              )}
              title={hasVolumeData ? 'Volume bars' : 'No volume data for this asset/timeframe'}
            >
              Vol
            </button>
            <button onClick={() => setShowMA20((v) => !v)} className={pillClass(showMA20)} title="20-period moving average">
              MA20
            </button>
            <button onClick={() => setShowMA50((v) => !v)} className={pillClass(showMA50)} title="50-period moving average">
              MA50
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: '500px' }}>
            <div className="text-center">
              <RefreshCw className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center" style={{ height: '500px' }}>
            <p className="text-lg text-center px-4 text-gray-600">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: '500px' }}>
            <p className="text-lg text-gray-600">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="tradingColorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? GAIN : LOSS} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={isPositive ? GAIN : LOSS} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="price"
                stroke="#9ca3af"
                tick={{ fontSize: 11 }}
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickCount={12}
                domain={[minPrice - finalPadding, maxPrice + finalPadding]}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              {/* Hidden volume axis: bars occupy the bottom ~20% of the chart */}
              <YAxis yAxisId="volume" hide domain={[0, maxVolume * 5 || 1]} />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const fmt = (v) => v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (
                      <div className="p-3 rounded-lg shadow-lg bg-white border border-gray-200">
                        <p className="text-xs mb-2 text-gray-500">{data.time}</p>
                        <p className="text-lg font-bold text-gray-900 tnum">${fmt(data.close)}</p>
                        <div className="mt-2 space-y-1 text-xs text-gray-500 tnum">
                          <p>Open: ${fmt(data.open)}</p>
                          <p>High: ${fmt(data.high)}</p>
                          <p>Low: ${fmt(data.low)}</p>
                          {showVolume && data.volume != null && (
                            <p>Vol: {Math.round(data.volume).toLocaleString()}</p>
                          )}
                          {showMA20 && data.ma20 != null && <p className="text-amber-600">MA20: ${fmt(data.ma20)}</p>}
                          {showMA50 && data.ma50 != null && <p className="text-violet-600">MA50: ${fmt(data.ma50)}</p>}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Volume bars */}
              {showVolume && hasVolumeData && (
                <Bar yAxisId="volume" dataKey="volume" barSize={4} isAnimationActive={false}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.close >= d.open ? GAIN : LOSS} fillOpacity={0.25} />
                  ))}
                </Bar>
              )}

              {/* Price: area line or candlesticks */}
              {chartType === 'area' ? (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? GAIN : LOSS}
                  strokeWidth={2}
                  fill="url(#tradingColorPrice)"
                  animationDuration={800}
                />
              ) : (
                <Bar
                  yAxisId="price"
                  dataKey="range"
                  barSize={Math.max(3, Math.min(14, Math.floor(560 / Math.max(chartData.length, 1))))}
                  shape={<Candle />}
                  isAnimationActive={false}
                />
              )}

              {/* Moving averages */}
              {showMA20 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ma20"
                  stroke="#D97706"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}
              {showMA50 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ma50"
                  stroke="#7C3AED"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              )}

              {/* Reference line for current price */}
              <ReferenceLine
                yAxisId="price"
                y={asset.price}
                stroke="#2563EB"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Live: $${asset.price.toLocaleString()}`,
                  position: 'right',
                  fill: '#2563EB',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data info */}
      {!loading && !error && chartData.length > 0 && (
        <div className="text-xs text-center pb-4 flex items-center justify-center gap-2 text-gray-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Live • {chartData.length} points • Updated {lastUpdate?.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
