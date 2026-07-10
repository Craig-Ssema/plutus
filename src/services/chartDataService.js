const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// FRONTEND REQUEST DEDUPLICATION & DEBOUNCING
// ============================================================================

const inFlightRequests = new Map();

// key -> { timer, resolvers: [{ resolve, reject }] }
const pendingDebounces = new Map();

/**
 * Deduplicate and debounce chart data requests.
 * IMPORTANT: every caller's promise is tracked and resolved — when several
 * components request the same chart at once (e.g. the desktop AND mobile
 * chart instances on the Trade page), resetting the debounce timer must not
 * orphan the earlier callers, or their charts hang on "loading" forever.
 * @param {string} key - Unique request key
 * @param {Function} requestFn - Function that makes the actual request
 * @param {number} debounceMs - Debounce delay in milliseconds
 * @returns {Promise} Chart data
 */
const debouncedFetch = (key, requestFn, debounceMs = 300) => {
  return new Promise((resolve, reject) => {
    let entry = pendingDebounces.get(key);
    if (!entry) {
      entry = { timer: null, resolvers: [] };
      pendingDebounces.set(key, entry);
    }

    // Register this caller so it always gets an answer
    entry.resolvers.push({ resolve, reject });

    // Reset the debounce window (without dropping earlier callers)
    if (entry.timer) clearTimeout(entry.timer);

    entry.timer = setTimeout(async () => {
      const { resolvers } = entry;
      pendingDebounces.delete(key);

      // Reuse an in-flight request if one exists for this key
      let promise = inFlightRequests.get(key);
      if (!promise) {
        promise = requestFn().finally(() => {
          inFlightRequests.delete(key);
        });
        inFlightRequests.set(key, promise);
      } else {
        console.log(`⏳ Frontend: Reusing in-flight request: ${key}`);
      }

      try {
        const result = await promise;
        resolvers.forEach((r) => r.resolve(result));
      } catch (error) {
        resolvers.forEach((r) => r.reject(error));
      }
    }, debounceMs);
  });
};


/**
 * Fetch historical OHLCV (candlestick) data for a symbol
 * @param {string} symbol - Asset symbol (e.g., 'BTC', 'ETH', 'AAPL')
 * @param {string} timeframe - Timeframe ('1D', '5D', '1M', '3M', '1Y', '5Y')
 * @param {string} type - Asset type ('crypto' or 'stock')
 * @returns {Promise} Chart data with OHLCV candles
 */
export const fetchChartData = async (symbol, timeframe = '1D', type = 'crypto') => {
  const requestKey = `chart-${symbol}-${timeframe}-${type}`;

  return debouncedFetch(
    requestKey,
    async () => {
      try {
        console.log(`Fetching chart: ${symbol} ${timeframe} ${type}`);
        
        const response = await fetch(
          `${API_BASE_URL}/api/charts/${symbol}?timeframe=${timeframe}&type=${type}`,
          {
            signal: AbortSignal.timeout(30000), // 30 second timeout
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          }
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.ohlcv || data.ohlcv.length === 0) {
          throw new Error('No chart data available');
        }

        console.log(`✓ Loaded ${data.ohlcv.length} candles for ${symbol}`);
        return data;
        
      } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
      }
    },
    300 // 300ms debounce delay
  );
};


export const cancelPendingRequests = () => {
  // Reject and clear all pending debounced callers
  pendingDebounces.forEach((entry) => {
    if (entry.timer) clearTimeout(entry.timer);
    entry.resolvers.forEach((r) => r.reject(new Error('Request cancelled')));
  });
  pendingDebounces.clear();

  // Note: Can't cancel in-flight fetch requests without AbortController
  console.log('Cleared all pending debounced requests');
};


/**
 * Calculate MACD indicator from OHLCV data
 * @param {Array} ohlcv - Array of OHLCV candles
 * @returns {Array} MACD data with macd, signal, and histogram
 */
export const calculateMACD = (ohlcv) => {
  if (!ohlcv || ohlcv.length === 0) return [];
  
  const closePrices = ohlcv.map(candle => candle.close);
  const macdData = [];

  // Simple MACD calculation (12, 26, 9)
  for (let i = 0; i < closePrices.length; i++) {
    const ema12 = calculateEMA(closePrices.slice(0, i + 1), 12);
    const ema26 = calculateEMA(closePrices.slice(0, i + 1), 26);
    const macd = ema12 - ema26;
    
    // Use the original time value from the OHLCV data
    macdData.push({ 
      time: ohlcv[i].time, 
      timestamp: ohlcv[i].timestamp,
      macd, 
      signal: 0, 
      histogram: 0 
    });
  }

  // Calculate signal line (9-period EMA of MACD)
  const macdValues = macdData.map(d => d.macd);
  for (let i = 0; i < macdData.length; i++) {
    const signal = calculateEMA(macdValues.slice(0, i + 1), 9);
    macdData[i].signal = signal;
    macdData[i].histogram = macdData[i].macd - signal;
  }

  return macdData;
};

/**
 * Calculate Exponential Moving Average
 * @param {Array} data - Price data
 * @param {number} period - EMA period
 * @returns {number} EMA value
 */
const calculateEMA = (data, period) => {
  if (!data || data.length === 0) return 0;
  if (data.length < period) return data[data.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

/**
 * Calculate trend lines from OHLCV data
 * Note: This returns empty array since trend lines need manual drawing
 * or more sophisticated algorithms
 * @param {Array} ohlcv - Array of OHLCV candles
 * @returns {Array} Empty array (trend lines disabled)
 */
export const calculateTrendLines = (ohlcv) => {
  // Trend line calculation is disabled as it doesn't work well with
  // string-based time values and the simple algorithm wasn't accurate
  return [];
};

export default {
  fetchChartData,
  calculateMACD,
  calculateTrendLines,
  cancelPendingRequests
};
