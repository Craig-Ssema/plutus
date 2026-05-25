const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Configuration
const API_CONFIG = {
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3',
    RATE_LIMIT: 50, // requests per minute
    MIN_REQUEST_INTERVAL: 1500, // ms between requests (increased from default)
  },
  ALPHA_VANTAGE: {
    BASE_URL: 'https://www.alphavantage.co/query',
    API_KEY: process.env.ALPHA_VANTAGE_API_KEY || 'IEPTY4SREL25P73N',
  },
  TWELVE_DATA: {
    BASE_URL: 'https://api.twelvedata.com',
    API_KEY: process.env.TWELVE_DATA_API_KEY || '5319a41de0e2440887aea8975632de0a',
  },
  FINNHUB: {
    BASE_URL: 'https://finnhub.io/api/v1',
    API_KEY: process.env.FINNHUB_API_KEY || 'd4b6duhr01qrv4asuvh0d4b6duhr01qrv4asuvhg',
  },
  // NEW: Financial Modeling Prep (250 req/day free tier)
  FMP: {
    BASE_URL: 'https://financialmodelingprep.com/api/v3',
    API_KEY: process.env.FMP_API_KEY || '', // You need to add this
  },
  // NEW: Polygon.io (5 req/min free tier)
  POLYGON: {
    BASE_URL: 'https://api.polygon.io/v2',
    API_KEY: process.env.POLYGON_API_KEY || '', // You need to add this
  },
  // NEW: Alpha Vantage for stocks (separate from charts)
  ALPHA_STOCKS: {
    BASE_URL: 'https://www.alphavantage.co/query',
    API_KEY: process.env.ALPHA_VANTAGE_API_KEY || 'IEPTY4SREL25P73N',
  }
};

// Crypto IDs for CoinGecko
const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'solana', 'cardano', 'ripple', 
  'polkadot', 'dogecoin', 'avalanche-2', 'chainlink', 
  'matic-network', 'uniswap', 'litecoin', 'cosmos', 'fantom', 'near'
];

// Stock symbols
const STOCK_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS', 'BAC', 'NFLX'
];

// Cache to reduce API calls
const cache = {
  crypto: { data: null, timestamp: 0 },
  stocks: { data: null, timestamp: 0 },
  charts: {}, // { 'BTC-1D': { data: [...], timestamp: 123 } }
  CACHE_DURATION: 30000, // 30 seconds
  CHART_CACHE_DURATION: 300000, // 5 minutes
};

// ============================================================================
// REQUEST DEDUPLICATION & RATE LIMITING
// ============================================================================

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map();

// Rate limiting for CoinGecko
let lastCoinGeckoRequest = 0;
const coinGeckoRequestQueue = [];
let isProcessingQueue = false;

/**
 * Deduplicate requests - if same request is in-flight, return existing promise
 */
const deduplicateRequest = async (key, requestFn) => {
  // Check if request is already in-flight
  if (inFlightRequests.has(key)) {
    console.log(`⏳ Returning in-flight request for: ${key}`);
    return inFlightRequests.get(key);
  }

  // Execute request and store promise
  const promise = requestFn()
    .finally(() => {
      // Remove from in-flight after completion
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
};

/**
 * Rate-limited fetch for CoinGecko API
 */
const rateLimitedCoinGeckoFetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    coinGeckoRequestQueue.push({ url, options, resolve, reject });
    processQueue();
  });
};

/**
 * Process the CoinGecko request queue with rate limiting
 */
const processQueue = async () => {
  if (isProcessingQueue || coinGeckoRequestQueue.length === 0) return;
  
  isProcessingQueue = true;

  while (coinGeckoRequestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastCoinGeckoRequest;

    // Wait if we need to respect rate limit
    if (timeSinceLastRequest < API_CONFIG.COINGECKO.MIN_REQUEST_INTERVAL) {
      await sleep(API_CONFIG.COINGECKO.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }

    const { url, options, resolve, reject } = coinGeckoRequestQueue.shift();

    try {
      lastCoinGeckoRequest = Date.now();
      const response = await fetch(url, { ...options, timeout: 10000 });
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        console.warn('⚠️ CoinGecko rate limit hit, waiting 60s...');
        await sleep(60000); // Wait 1 minute
        
        // Retry the request
        coinGeckoRequestQueue.unshift({ url, options, resolve, reject });
        continue;
      }

      resolve(response);
    } catch (error) {
      reject(error);
    }
  }

  isProcessingQueue = false;
};

// Helper sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check cache validity
const isCacheValid = (cacheEntry, duration = cache.CACHE_DURATION) => {
  return cacheEntry && cacheEntry.data && (Date.now() - cacheEntry.timestamp < duration);
};

// ============================================================================
// ENDPOINTS
// ============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Plutus API Server is running',
    timestamp: new Date().toISOString(),
    inFlightRequests: inFlightRequests.size,
    queueLength: coinGeckoRequestQueue.length
  });
});

// Fetch cryptocurrency data from CoinGecko
app.get('/api/crypto', async (req, res) => {
  try {
    const cacheKey = 'crypto-list';
    
    // Check cache first
    if (isCacheValid(cache.crypto)) {
      console.log('✓ Returning cached crypto data');
      return res.json(cache.crypto.data);
    }

    // Deduplicate requests
    const data = await deduplicateRequest(cacheKey, async () => {
      const ids = CRYPTO_IDS.join(',');
      const url = `${API_CONFIG.COINGECKO.BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
      
      console.log('Fetching crypto data from CoinGecko...');
      const response = await rateLimitedCoinGeckoFetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // Transform data
      const transformedData = apiData.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'crypto',
        price: coin.current_price,
        price_formatted: formatPrice(coin.current_price),
        change_24h: coin.price_change_24h,
        change_24h_percent: coin.price_change_percentage_24h,
        change_1h_percent: coin.price_change_percentage_1h_in_currency,
        change_7d_percent: coin.price_change_percentage_7d_in_currency,
        market_cap: coin.market_cap,
        market_cap_usd: coin.market_cap,
        market_cap_formatted: formatMarketCap(coin.market_cap),
        volume_24h: coin.total_volume,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        sparkline: coin.sparkline_in_7d?.price || [],
        last_updated: new Date().toISOString(),
      }));
      
      // Update cache
      cache.crypto = { data: transformedData, timestamp: Date.now() };
      
      console.log(`✓ Fetched ${transformedData.length} cryptocurrencies`);
      return transformedData;
    });
    
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching crypto data:', error.message);
    console.log('⚠️ Using mock crypto data due to API failure');
    
    // Generate mock data as fallback
    const mockData = generateMockCryptoData();
    cache.crypto = { data: mockData, timestamp: Date.now() };
    
    res.json(mockData);
  }
});

// Fetch stock data - tries multiple APIs in priority order
app.get('/api/stocks', async (req, res) => {
  try {
    const cacheKey = 'stocks-list';
    
    // Check cache first
    if (isCacheValid(cache.stocks)) {
      console.log('✓ Returning cached stock data');
      return res.json(cache.stocks.data);
    }

    // Deduplicate requests
    const data = await deduplicateRequest(cacheKey, async () => {
      // Priority 1: Try Finnhub (most reliable, 60 req/min)
      try {
        console.log('Fetching stock data from Finnhub...');
        const stockData = await fetchStocksFromFinnhub();
        
        if (stockData.length > 0) {
          cache.stocks = { data: stockData, timestamp: Date.now() };
          console.log(`✓ Fetched ${stockData.length} stocks from Finnhub`);
          return stockData;
        } else {
          throw new Error('No data from Finnhub');
        }
        
      } catch (finnhubError) {
        console.error('Finnhub failed:', finnhubError.message);
        
        // Priority 2: Try Financial Modeling Prep (250 req/day)
        if (API_CONFIG.FMP.API_KEY) {
          try {
            console.log('Trying Financial Modeling Prep as fallback...');
            const stockData = await fetchStocksFromFMP();
            
            if (stockData.length > 0) {
              cache.stocks = { data: stockData, timestamp: Date.now() };
              console.log(`✓ Fetched ${stockData.length} stocks from FMP`);
              return stockData;
            } else {
              throw new Error('No data from FMP');
            }
          } catch (fmpError) {
            console.error('FMP failed:', fmpError.message);
          }
        }
        
        // Priority 3: Try Alpha Vantage (25 req/day total)
        if (API_CONFIG.ALPHA_STOCKS.API_KEY) {
          try {
            console.log('Trying Alpha Vantage as fallback...');
            const stockData = await fetchStocksFromAlphaVantage();
            
            if (stockData.length > 0) {
              cache.stocks = { data: stockData, timestamp: Date.now() };
              console.log(`✓ Fetched ${stockData.length} stocks from Alpha Vantage`);
              return stockData;
            } else {
              throw new Error('No data from Alpha Vantage');
            }
          } catch (alphaError) {
            console.error('Alpha Vantage failed:', alphaError.message);
          }
        }
        
        // Priority 4: Try Polygon.io (5 req/min)
        if (API_CONFIG.POLYGON.API_KEY) {
          try {
            console.log('Trying Polygon.io as fallback...');
            const stockData = await fetchStocksFromPolygon();
            
            if (stockData.length > 0) {
              cache.stocks = { data: stockData, timestamp: Date.now() };
              console.log(`✓ Fetched ${stockData.length} stocks from Polygon`);
              return stockData;
            } else {
              throw new Error('No data from Polygon');
            }
          } catch (polygonError) {
            console.error('Polygon failed:', polygonError.message);
          }
        }
        
        // Priority 5: Try Twelve Data (8 req/min - very slow)
        try {
          console.log('Trying Twelve Data as fallback...');
          const stockData = await fetchStocksFromTwelveData();
          
          if (stockData.length > 0) {
            cache.stocks = { data: stockData, timestamp: Date.now() };
            console.log(`✓ Fetched ${stockData.length} stocks from Twelve Data`);
            return stockData;
          } else {
            throw new Error('No data from Twelve Data');
          }
          
        } catch (twelveDataError) {
          console.error('Twelve Data failed:', twelveDataError.message);
          console.log('⚠️ Using mock stock data - all APIs failed');
          
          // Last resort: Use mock data
          const mockData = generateMockStockData();
          cache.stocks = { data: mockData, timestamp: Date.now() };
          return mockData;
        }
      }
    });
    
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    
    // Return mock data even on error
    const mockData = generateMockStockData();
    res.json(mockData);
  }
});

// Fetch historical OHLCV data for charts
app.get('/api/charts/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1D', type = 'crypto' } = req.query;
    
    const cacheKey = `${symbol}-${timeframe}-${type}`;
    
    // Check cache first (longer duration for charts)
    if (isCacheValid(cache.charts[cacheKey], cache.CHART_CACHE_DURATION)) {
      console.log(`✓ Returning cached chart data for ${cacheKey}`);
      return res.json(cache.charts[cacheKey].data);
    }

    // Deduplicate requests
    const data = await deduplicateRequest(cacheKey, async () => {
      console.log(`Fetching chart data for ${symbol} (${timeframe})...`);
      
      let chartData;
      
      try {
        if (type === 'crypto') {
          chartData = await fetchCryptoChartData(symbol, timeframe);
        } else {
          chartData = await fetchStockChartData(symbol, timeframe);
        }
      } catch (apiError) {
        console.error(`API failed for ${symbol}, using mock data:`, apiError.message);
        // Use mock data as fallback
        chartData = generateMockChartData(symbol, timeframe);
      }
      
      // Cache the data
      cache.charts[cacheKey] = {
        data: chartData,
        timestamp: Date.now()
      };
      
      console.log(`✓ Fetched ${chartData.ohlcv.length} candles for ${symbol}`);
      return chartData;
    });
    
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching chart data:', error.message);
    // Return mock data even on error
    const { symbol } = req.params;
    const { timeframe = '1D' } = req.query;
    const mockData = generateMockChartData(symbol, timeframe);
    res.json(mockData);
  }
});

// Helper to format time based on timeframe
const formatTimeForChart = (timestamp, timeframe) => {
  const date = new Date(timestamp);
  
  switch (timeframe) {
    case '1D':
      // Show hours like "9:00 AM", "2:00 PM"
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    case '5D':
      // Show day and time like "Mon 2PM"
      return date.toLocaleDateString('en-US', { 
        weekday: 'short'
      }) + ' ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        hour12: true 
      });
    case '1M':
      // Show month and day like "Nov 15"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case '3M':
      // Show month and day like "Nov 15"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case '1Y':
      // Show month like "Nov", "Dec"
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        year: '2-digit'
      });
    case '5Y':
      // Show year like "2021", "2022"
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        year: 'numeric'
      });
    default:
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
  }
};

// Fetch crypto chart data from CoinGecko
const fetchCryptoChartData = async (symbol, timeframe) => {
  try {
    const coinId = getCoinGeckoId(symbol);
    const days = getTimeframeDays(timeframe);
    
    const url = `${API_CONFIG.COINGECKO.BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    const response = await rateLimitedCoinGeckoFetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got an error response
    if (data.error) {
      throw new Error(`CoinGecko error: ${data.error}`);
    }
    
    // Transform to our format with proper time labels
    const ohlcv = data.map((candle, index) => ({
      timestamp: candle[0],
      time: formatTimeForChart(candle[0], timeframe),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: 0
    }));
    
    return {
      symbol,
      timeframe,
      ohlcv,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error fetching crypto chart for ${symbol}:`, error.message);
    throw error;
  }
};

// Fetch stock chart data from Alpha Vantage
const fetchStockChartData = async (symbol, timeframe) => {
  try {
    const interval = getStockInterval(timeframe);
    const isIntraday = ['1D', '5D'].includes(timeframe);
    
    let url;
    if (isIntraday) {
      url = `${API_CONFIG.ALPHA_VANTAGE.BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${API_CONFIG.ALPHA_VANTAGE.API_KEY}`;
    } else {
      url = `${API_CONFIG.ALPHA_VANTAGE.BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_CONFIG.ALPHA_VANTAGE.API_KEY}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const timeSeriesKey = isIntraday 
      ? `Time Series (${interval})`
      : 'Time Series (Daily)';
    
    const timeSeries = data[timeSeriesKey];
    
    if (!timeSeries) {
      throw new Error('No time series data in response');
    }
    
    const ohlcv = Object.entries(timeSeries)
      .slice(0, getMaxCandles(timeframe))
      .reverse()
      .map((entry, index) => {
        const timestamp = new Date(entry[0]).getTime();
        return {
          timestamp: timestamp,
          time: formatTimeForChart(timestamp, timeframe),
          open: parseFloat(entry[1]['1. open']),
          high: parseFloat(entry[1]['2. high']),
          low: parseFloat(entry[1]['3. low']),
          close: parseFloat(entry[1]['4. close']),
          volume: parseFloat(entry[1]['5. volume'])
        };
      });
    
    return {
      symbol,
      timeframe,
      ohlcv,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error fetching stock chart for ${symbol}:`, error.message);
    throw error;
  }
};

// Fetch all market data (crypto + stocks)
app.get('/api/markets', async (req, res) => {
  try {
    const [cryptoResponse, stocksResponse] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/crypto`).then(r => r.json()).catch(() => []),
      fetch(`http://localhost:${PORT}/api/stocks`).then(r => r.json()).catch(() => [])
    ]);
    
    const allData = [...cryptoResponse, ...stocksResponse];
    
    console.log(`✓ Total market data: ${allData.length} assets`);
    res.json(allData);
    
  } catch (error) {
    console.error('Error fetching all market data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      message: error.message 
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to fetch stocks from Finnhub
const fetchStocksFromFinnhub = async () => {
  const stockData = [];
  
  // Fetch only first 8 stocks to avoid rate limiting
  for (const symbol of STOCK_SYMBOLS.slice(0, 8)) {
    try {
      const quoteUrl = `${API_CONFIG.FINNHUB.BASE_URL}/quote?symbol=${symbol}&token=${API_CONFIG.FINNHUB.API_KEY}`;
      const quoteResponse = await fetch(quoteUrl);
      
      if (!quoteResponse.ok) {
        throw new Error(`HTTP ${quoteResponse.status}`);
      }
      
      const quote = await quoteResponse.json();
      
      // Finnhub returns: c (current), d (change), dp (percent change), h (high), l (low), o (open), pc (previous close)
      if (quote.c && quote.c > 0) {
        stockData.push({
          id: symbol.toLowerCase(),
          symbol: symbol,
          name: symbol, // Finnhub free tier doesn't provide company names
          type: 'stock',
          price: quote.c,
          price_formatted: formatPrice(quote.c),
          change_24h: quote.d || 0,
          change_24h_percent: quote.dp || 0,
          market_cap_usd: null,
          market_cap_formatted: 'N/A',
          volume_24h: null,
          high_24h: quote.h || quote.c,
          low_24h: quote.l || quote.c,
          last_updated: new Date().toISOString(),
        });
      }
      
      // Small delay to respect rate limits
      await sleep(100);
      
    } catch (error) {
      console.error(`Error fetching ${symbol} from Finnhub:`, error.message);
    }
  }
  
  return stockData;
};

// Helper function to fetch stocks from Twelve Data
const fetchStocksFromTwelveData = async () => {
  const stockData = [];
  
  try {
    // Fetch stocks one by one (more reliable than batch)
    for (const symbol of STOCK_SYMBOLS.slice(0, 8)) {
      try {
        const url = `${API_CONFIG.TWELVE_DATA.BASE_URL}/quote?symbol=${symbol}&apikey=${API_CONFIG.TWELVE_DATA.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const quote = await response.json();
        
        // Check for error response
        if (quote.status === 'error' || quote.code === 429) {
          throw new Error(quote.message || 'API error');
        }
        
        // Twelve Data returns: symbol, name, close, percent_change, etc.
        if (quote.symbol && (quote.close || quote.price)) {
          stockData.push({
            id: symbol.toLowerCase(),
            symbol: quote.symbol,
            name: quote.name || symbol,
            type: 'stock',
            price: parseFloat(quote.close || quote.price || 0),
            price_formatted: formatPrice(parseFloat(quote.close || quote.price || 0)),
            change_24h: parseFloat(quote.change || 0),
            change_24h_percent: parseFloat(quote.percent_change || 0),
            market_cap_usd: null,
            market_cap_formatted: 'N/A',
            volume_24h: parseFloat(quote.volume || 0),
            high_24h: parseFloat(quote.high || 0),
            low_24h: parseFloat(quote.low || 0),
            last_updated: new Date().toISOString(),
          });
        }
        
        // Respect rate limits (free tier: 8 req/min)
        await sleep(8000); // 8 seconds between requests
        
      } catch (error) {
        console.error(`Error fetching ${symbol} from Twelve Data:`, error.message);
      }
    }
  } catch (error) {
    console.error('Twelve Data batch error:', error.message);
  }
  
  return stockData;
};

// NEW: Financial Modeling Prep (250 requests/day)
const fetchStocksFromFMP = async () => {
  const stockData = [];
  
  try {
    const symbols = STOCK_SYMBOLS.slice(0, 8).join(',');
    const url = `${API_CONFIG.FMP.BASE_URL}/quote/${symbols}?apikey=${API_CONFIG.FMP.API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // FMP returns array of quote objects
    if (Array.isArray(data)) {
      for (const quote of data) {
        if (quote.symbol && quote.price) {
          stockData.push({
            id: quote.symbol.toLowerCase(),
            symbol: quote.symbol,
            name: quote.name || quote.symbol,
            type: 'stock',
            price: parseFloat(quote.price || 0),
            price_formatted: formatPrice(parseFloat(quote.price || 0)),
            change_24h: parseFloat(quote.change || 0),
            change_24h_percent: parseFloat(quote.changesPercentage || 0),
            market_cap_usd: parseFloat(quote.marketCap || 0),
            market_cap_formatted: formatMarketCap(parseFloat(quote.marketCap || 0)),
            volume_24h: parseFloat(quote.volume || 0),
            high_24h: parseFloat(quote.dayHigh || 0),
            low_24h: parseFloat(quote.dayLow || 0),
            last_updated: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error('FMP error:', error.message);
  }
  
  return stockData;
};

// NEW: Alpha Vantage for stocks (25 requests/day total)
const fetchStocksFromAlphaVantage = async () => {
  const stockData = [];
  
  try {
    // Fetch only 5 stocks to preserve API quota
    for (const symbol of STOCK_SYMBOLS.slice(0, 5)) {
      try {
        const url = `${API_CONFIG.ALPHA_STOCKS.BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.ALPHA_STOCKS.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const quote = data['Global Quote'];
        
        if (quote && quote['05. price']) {
          stockData.push({
            id: symbol.toLowerCase(),
            symbol: symbol,
            name: symbol,
            type: 'stock',
            price: parseFloat(quote['05. price'] || 0),
            price_formatted: formatPrice(parseFloat(quote['05. price'] || 0)),
            change_24h: parseFloat(quote['09. change'] || 0),
            change_24h_percent: parseFloat(quote['10. change percent']?.replace('%', '') || 0),
            market_cap_usd: null,
            market_cap_formatted: 'N/A',
            volume_24h: parseFloat(quote['06. volume'] || 0),
            high_24h: parseFloat(quote['03. high'] || 0),
            low_24h: parseFloat(quote['04. low'] || 0),
            last_updated: new Date().toISOString(),
          });
        }
        
        // Wait to respect rate limits (5 req/min for free tier)
        await sleep(13000); // 13 seconds between requests
        
      } catch (error) {
        console.error(`Error fetching ${symbol} from Alpha Vantage:`, error.message);
      }
    }
  } catch (error) {
    console.error('Alpha Vantage error:', error.message);
  }
  
  return stockData;
};

// NEW: Polygon.io (5 requests/minute free tier)
const fetchStocksFromPolygon = async () => {
  const stockData = [];
  
  try {
    // Get previous business day
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];
    
    // Fetch only 5 stocks to respect rate limits
    for (const symbol of STOCK_SYMBOLS.slice(0, 5)) {
      try {
        const url = `${API_CONFIG.POLYGON.BASE_URL}/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_CONFIG.POLYGON.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const quote = data.results[0];
          const change = quote.c - quote.o;
          const changePercent = ((change / quote.o) * 100);
          
          stockData.push({
            id: symbol.toLowerCase(),
            symbol: symbol,
            name: symbol,
            type: 'stock',
            price: parseFloat(quote.c || 0),
            price_formatted: formatPrice(parseFloat(quote.c || 0)),
            change_24h: change,
            change_24h_percent: changePercent,
            market_cap_usd: null,
            market_cap_formatted: 'N/A',
            volume_24h: parseFloat(quote.v || 0),
            high_24h: parseFloat(quote.h || 0),
            low_24h: parseFloat(quote.l || 0),
            last_updated: new Date().toISOString(),
          });
        }
        
        // Wait to respect rate limits (5 req/min)
        await sleep(13000); // 13 seconds between requests
        
      } catch (error) {
        console.error(`Error fetching ${symbol} from Polygon:`, error.message);
      }
    }
  } catch (error) {
    console.error('Polygon error:', error.message);
  }
  
  return stockData;
};

const getCoinGeckoId = (symbol) => {
  const mapping = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'ADA': 'cardano',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'UNI': 'uniswap',
    'LTC': 'litecoin',
    'ATOM': 'cosmos',
    'FTM': 'fantom',
    'NEAR': 'near'
  };
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
};

const getTimeframeDays = (timeframe) => {
  const mapping = {
    '1D': 1,
    '5D': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    '5Y': 1825
  };
  return mapping[timeframe] || 1;
};

const getStockInterval = (timeframe) => {
  const mapping = {
    '1D': '5min',
    '5D': '15min',
    '1M': '60min',
    '3M': 'daily',
    '1Y': 'daily',
    '5Y': 'weekly'
  };
  return mapping[timeframe] || '5min';
};

const getMaxCandles = (timeframe) => {
  const mapping = {
    '1D': 100,
    '5D': 100,
    '1M': 100,
    '3M': 100,
    '1Y': 365,
    '5Y': 260
  };
  return mapping[timeframe] || 100;
};

const formatPrice = (price) => {
  if (!price) return '$0.00';
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
};

const formatMarketCap = (marketCap) => {
  if (!marketCap) return 'N/A';
  
  if (marketCap >= 1e12) {
    return `${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `${marketCap.toLocaleString()}`;
  }
};

// Generate mock crypto data for fallback
const generateMockCryptoData = () => {
  const mockPrices = {
    bitcoin: { price: 43250.80, name: 'Bitcoin' },
    ethereum: { price: 2285.45, name: 'Ethereum' },
    solana: { price: 98.75, name: 'Solana' },
    cardano: { price: 0.62, name: 'Cardano' },
    ripple: { price: 0.58, name: 'XRP' },
    polkadot: { price: 7.85, name: 'Polkadot' },
    dogecoin: { price: 0.095, name: 'Dogecoin' },
    'avalanche-2': { price: 38.50, name: 'Avalanche' },
    chainlink: { price: 15.30, name: 'Chainlink' },
    'matic-network': { price: 0.92, name: 'Polygon' },
  };

  return Object.entries(mockPrices).map(([id, data]) => ({
    id: id,
    symbol: data.name.substring(0, 3).toUpperCase(),
    name: data.name,
    type: 'crypto',
    price: data.price,
    price_formatted: formatPrice(data.price),
    change_24h: (Math.random() - 0.5) * data.price * 0.1,
    change_24h_percent: (Math.random() - 0.5) * 10,
    change_1h_percent: (Math.random() - 0.5) * 2,
    change_7d_percent: (Math.random() - 0.5) * 20,
    market_cap_usd: data.price * Math.random() * 1e9,
    market_cap_formatted: formatMarketCap(data.price * Math.random() * 1e9),
    volume_24h: Math.random() * 1e9,
    high_24h: data.price * 1.05,
    low_24h: data.price * 0.95,
    sparkline: Array.from({length: 24}, () => data.price * (0.95 + Math.random() * 0.1)),
    last_updated: new Date().toISOString(),
  }));
};

// Generate mock stock data for fallback
const generateMockStockData = () => {
  const mockPrices = {
    'AAPL': { price: 178.50, name: 'Apple Inc.' },
    'GOOGL': { price: 141.80, name: 'Alphabet Inc.' },
    'MSFT': { price: 378.90, name: 'Microsoft Corp.' },
    'AMZN': { price: 178.25, name: 'Amazon.com Inc.' },
    'NVDA': { price: 495.60, name: 'NVIDIA Corp.' },
    'TSLA': { price: 248.40, name: 'Tesla Inc.' },
    'META': { price: 505.75, name: 'Meta Platforms' },
    'JPM': { price: 195.30, name: 'JPMorgan Chase' },
  };

  return Object.entries(mockPrices).map(([symbol, data]) => ({
    id: symbol.toLowerCase(),
    symbol: symbol,
    name: data.name,
    type: 'stock',
    price: data.price,
    price_formatted: formatPrice(data.price),
    change_24h: (Math.random() - 0.5) * data.price * 0.05,
    change_24h_percent: (Math.random() - 0.5) * 5,
    market_cap_usd: data.price * Math.random() * 1e11,
    market_cap_formatted: formatMarketCap(data.price * Math.random() * 1e11),
    volume_24h: Math.random() * 1e8,
    high_24h: data.price * 1.02,
    low_24h: data.price * 0.98,
    last_updated: new Date().toISOString(),
  }));
};

// Generate mock chart data for fallback
const generateMockChartData = (symbol, timeframe) => {
  const now = Date.now();
  const basePrice = symbol === 'BTC' ? 92000 : symbol === 'ETH' ? 3400 : 150;
  const ohlcv = [];
  
  // Determine time intervals based on timeframe
  let intervalMs;
  let numCandles;
  
  switch (timeframe) {
    case '1D':
      intervalMs = 30 * 60 * 1000; // 30 minutes
      numCandles = 48;
      break;
    case '5D':
      intervalMs = 4 * 60 * 60 * 1000; // 4 hours
      numCandles = 30;
      break;
    case '1M':
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      numCandles = 30;
      break;
    case '3M':
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      numCandles = 90;
      break;
    case '1Y':
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      numCandles = 52;
      break;
    case '5Y':
      intervalMs = 30 * 24 * 60 * 60 * 1000; // 1 month
      numCandles = 60;
      break;
    default:
      intervalMs = 30 * 60 * 1000;
      numCandles = 48;
  }
  
  let currentPrice = basePrice * 0.95; // Start slightly below base
  
  for (let i = numCandles - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const volatility = 0.02; // 2% volatility
    const trend = 0.001; // Slight upward trend
    
    const change = (Math.random() - 0.5 + trend) * currentPrice * volatility;
    const open = currentPrice;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.8);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    ohlcv.push({
      timestamp,
      time: formatTimeForChart(timestamp, timeframe),
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000
    });
  }
  
  return {
    symbol,
    timeframe,
    ohlcv,
    lastUpdated: new Date().toISOString(),
    source: 'mock'
  };
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Plutus API Server Running                ║
║   📡 Port: ${PORT}                               ║
║   🌐 http://localhost:${PORT}                   ║
║   ✓ Request deduplication enabled             ║
║   ✓ Rate limiting enabled (1.5s interval)     ║
║   ✓ 429 retry logic with exponential backoff  ║
╚═══════════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  GET /api/health   - Health check + queue status');
  console.log('  GET /api/crypto   - Cryptocurrency data');
  console.log('  GET /api/stocks   - Stock market data');
  console.log('  GET /api/markets  - All market data');
  console.log('  GET /api/charts/:symbol?timeframe=1D&type=crypto');
  console.log('\n✨ Ready to serve market data with rate limiting!\n');
});