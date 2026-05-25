// Market Data Service - Real-time financial data from multiple APIs
// This service combines data from CoinGecko (crypto) and Alpha Vantage/Twelve Data (stocks)

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Use backend proxy for real data, or mock data if backend is unavailable
const USE_MOCK_DATA_ONLY = false; // Set to true to use mock data without backend

// API Configuration
const API_CONFIG = {
  // CoinGecko - Free tier, no API key needed for basic use
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3',
    RATE_LIMIT: 10, // calls per minute for free tier
  },
  
  // Alpha Vantage - Free tier: 5 API requests per minute, 500 per day
  // Get your free API key from: https://www.alphavantage.co/support/#api-key
  ALPHA_VANTAGE: {
    BASE_URL: 'https://www.alphavantage.co/query',
    API_KEY: 'IEPTY4SREL25P73N', // Replace with your API key
    RATE_LIMIT: 5, // calls per minute
  },
  
  // Twelve Data - Free tier: 800 API requests per day
  // Get your free API key from: https://twelvedata.com/account/api-keys
  TWELVE_DATA: {
    BASE_URL: 'https://api.twelvedata.com',
    API_KEY: '5319a41de0e2440887aea8975632de0a', // Replace with your API key
    RATE_LIMIT: 8, // approximate calls per minute to stay under daily limit
  },
  
  // Finnhub - Free tier: 60 API requests per minute
  // Get your free API key from: https://finnhub.io/register
  FINNHUB: {
    BASE_URL: 'https://finnhub.io/api/v1',
    API_KEY: 'd4b6duhr01qrv4asuvh0d4b6duhr01qrv4asuvhg', // Replace with your API key
    RATE_LIMIT: 60, // calls per minute
  }
};

// Popular cryptocurrencies to track
const CRYPTO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  UNI: 'uniswap',
  LTC: 'litecoin',
  ATOM: 'cosmos',
  FTM: 'fantom',
  NEAR: 'near',
};

// Popular stocks to track
const STOCK_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS', 'BAC', 'NFLX'
];

// Cache to reduce API calls
const cache = {
  crypto: { data: null, timestamp: 0 },
  stocks: { data: null, timestamp: 0 },
  CACHE_DURATION: 30000, // 30 seconds
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry.data && (Date.now() - cacheEntry.timestamp < cache.CACHE_DURATION);
};

// Fetch cryptocurrency data from backend
export const fetchCryptoData = async () => {
  // If mock data mode is enabled, skip API calls
  if (USE_MOCK_DATA_ONLY) {
    console.log('Using mock crypto data (USE_MOCK_DATA_ONLY = true)');
    const mockData = generateMockCryptoData();
    cache.crypto = { data: mockData, timestamp: Date.now() };
    return mockData;
  }

  // Check cache first
  if (isCacheValid(cache.crypto)) {
    console.log('Returning cached crypto data');
    return cache.crypto.data;
  }

  try {
    const url = `${BACKEND_URL}/api/crypto`;
    console.log('Fetching crypto data from backend...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update cache
    cache.crypto = { data, timestamp: Date.now() };
    
    console.log(`✓ Fetched ${data.length} cryptocurrencies from backend`);
    return data;
    
  } catch (error) {
    console.error('Error fetching crypto data from backend:', error);
    console.log('Falling back to mock data');
    
    // Return mock data as fallback
    return generateMockCryptoData();
  }
};

// Fetch stock data from backend
export const fetchStockData = async () => {
  // If mock data mode is enabled, skip API calls
  if (USE_MOCK_DATA_ONLY) {
    console.log('Using mock stock data (USE_MOCK_DATA_ONLY = true)');
    const mockData = generateMockStockData();
    cache.stocks = { data: mockData, timestamp: Date.now() };
    return mockData;
  }

  // Check cache first
  if (isCacheValid(cache.stocks)) {
    console.log('Returning cached stock data');
    return cache.stocks.data;
  }

  try {
    const url = `${BACKEND_URL}/api/stocks`;
    console.log('Fetching stock data from backend...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update cache
    cache.stocks = { data, timestamp: Date.now() };
    
    console.log(`✓ Fetched ${data.length} stocks from backend`);
    return data;
    
  } catch (error) {
    console.error('Error fetching stock data from backend:', error);
    console.log('Falling back to mock data');
    
    // Return mock data as fallback
    return generateMockStockData();
  }
};

// Fetch from Twelve Data
const fetchStockDataFromTwelveData = async () => {
  const symbols = STOCK_SYMBOLS.slice(0, 8).join(','); // Limit to conserve API calls
  const url = `${API_CONFIG.TWELVE_DATA.BASE_URL}/quote?symbol=${symbols}&apikey=${API_CONFIG.TWELVE_DATA.API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Twelve Data API error: ${response.status}`);
  
  const data = await response.json();
  
  const transformedData = Object.entries(data).map(([symbol, quote]) => ({
    id: symbol.toLowerCase(),
    symbol: symbol,
    name: quote.name || symbol,
    type: 'stock',
    price: parseFloat(quote.close || quote.price || 0),
    price_formatted: formatPrice(parseFloat(quote.close || quote.price || 0)),
    change_24h: parseFloat(quote.change || 0),
    change_24h_percent: parseFloat(quote.percent_change || 0),
    market_cap_usd: null, // Not provided by basic quote
    market_cap_formatted: 'N/A',
    volume_24h: parseFloat(quote.volume || 0),
    high_24h: parseFloat(quote.high || 0),
    low_24h: parseFloat(quote.low || 0),
    last_updated: new Date().toISOString(),
  }));
  
  cache.stocks = { data: transformedData, timestamp: Date.now() };
  console.log(`Fetched ${transformedData.length} stocks from Twelve Data`);
  return transformedData;
};

// Fetch from Alpha Vantage
const fetchStockDataFromAlphaVantage = async () => {
  const stockData = [];
  
  // Fetch only a few stocks due to rate limiting
  for (const symbol of STOCK_SYMBOLS.slice(0, 5)) {
    try {
      const url = `${API_CONFIG.ALPHA_VANTAGE.BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.ALPHA_VANTAGE.API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        stockData.push({
          id: symbol.toLowerCase(),
          symbol: symbol,
          name: symbol, // Alpha Vantage doesn't provide company names in this endpoint
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
      
      // Rate limiting: wait 12 seconds between requests (5 per minute limit)
      if (stockData.length < STOCK_SYMBOLS.slice(0, 5).length - 1) {
        await new Promise(resolve => setTimeout(resolve, 12000));
      }
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }
  
  cache.stocks = { data: stockData, timestamp: Date.now() };
  console.log(`Fetched ${stockData.length} stocks from Alpha Vantage`);
  return stockData;
};

// Fetch from Finnhub
const fetchStockDataFromFinnhub = async () => {
  const stockData = [];
  
  for (const symbol of STOCK_SYMBOLS.slice(0, 10)) {
    try {
      const quoteUrl = `${API_CONFIG.FINNHUB.BASE_URL}/quote?symbol=${symbol}&token=${API_CONFIG.FINNHUB.API_KEY}`;
      const profileUrl = `${API_CONFIG.FINNHUB.BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_CONFIG.FINNHUB.API_KEY}`;
      
      const [quoteResponse, profileResponse] = await Promise.all([
        fetch(quoteUrl),
        fetch(profileUrl)
      ]);
      
      const quote = await quoteResponse.json();
      const profile = await profileResponse.json();
      
      if (quote.c) { // c = current price
        stockData.push({
          id: symbol.toLowerCase(),
          symbol: symbol,
          name: profile.name || symbol,
          type: 'stock',
          price: quote.c,
          price_formatted: formatPrice(quote.c),
          change_24h: quote.d, // d = change
          change_24h_percent: quote.dp, // dp = percent change
          market_cap_usd: profile.marketCapitalization ? profile.marketCapitalization * 1000000 : null,
          market_cap_formatted: profile.marketCapitalization ? formatMarketCap(profile.marketCapitalization * 1000000) : 'N/A',
          volume_24h: null, // Not in basic quote
          high_24h: quote.h, // h = high
          low_24h: quote.l, // l = low
          last_updated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error fetching ${symbol} from Finnhub:`, error);
    }
  }
  
  cache.stocks = { data: stockData, timestamp: Date.now() };
  console.log(`Fetched ${stockData.length} stocks from Finnhub`);
  return stockData;
};

// Fetch all market data (crypto + stocks)
export const fetchAllMarketData = async () => {
  console.log('🌐 marketDataService: fetchAllMarketData called');
  try {
    const [cryptoData, stockData] = await Promise.all([
      fetchCryptoData(),
      fetchStockData()
    ]);
    
    console.log('📊 Crypto data:', cryptoData.length, 'items');
    console.log('📈 Stock data:', stockData.length, 'items');
    
    const allData = [...cryptoData, ...stockData];
    
    console.log(`✅ Total market data fetched: ${allData.length} assets`);
    return allData;
    
  } catch (error) {
    console.error('❌ Error fetching all market data:', error);
    console.log('⚠️ Returning fallback mock data');
    return [...generateMockCryptoData(), ...generateMockStockData()];
  }
};

// WebSocket connection for real-time updates (using Finnhub WebSocket)
export const connectToRealTimeData = (onUpdate) => {
  if (API_CONFIG.FINNHUB.API_KEY === 'YOUR_FINNHUB_API_KEY') {
    console.log('Finnhub API key not configured for WebSocket - using simulated updates');
    // Simulate real-time updates with random data
    return simulateRealTimeUpdates(onUpdate);
  }

  try {
    const socket = new WebSocket(`wss://ws.finnhub.io?token=${API_CONFIG.FINNHUB.API_KEY}`);
    
    socket.addEventListener('open', function (event) {
      console.log('Connected to Finnhub WebSocket');
      // Subscribe to symbols
      STOCK_SYMBOLS.slice(0, 10).forEach(symbol => {
        socket.send(JSON.stringify({'type':'subscribe', 'symbol': symbol}));
      });
    });

    socket.addEventListener('message', function (event) {
      const message = JSON.parse(event.data);
      if (message.type === 'trade' && message.data) {
        onUpdate(message.data);
      }
    });

    socket.addEventListener('error', function (event) {
      console.warn('WebSocket connection failed, falling back to periodic updates');
      // Fall back to simulated updates
      socket.close();
      return simulateRealTimeUpdates(onUpdate);
    });

    // Return cleanup function
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  } catch (error) {
    console.warn('Could not establish WebSocket connection:', error.message);
    return simulateRealTimeUpdates(onUpdate);
  }
};

// Simulate real-time updates when no WebSocket is available
const simulateRealTimeUpdates = (onUpdate) => {
  const interval = setInterval(async () => {
    // Fetch fresh data every 30 seconds
    const allData = await fetchAllMarketData();
    onUpdate(allData);
  }, 30000);

  // Return cleanup function
  return () => clearInterval(interval);
};

// Helper function to format price
const formatPrice = (price) => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
};

// Helper function to format market cap
const formatMarketCap = (marketCap) => {
  if (!marketCap) return 'N/A';
  
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${marketCap.toLocaleString()}`;
  }
};

// Generate mock crypto data for development/fallback
const generateMockCryptoData = () => {
  const mockPrices = {
    BTC: 43250.80,
    ETH: 2285.45,
    SOL: 98.75,
    ADA: 0.62,
    XRP: 0.58,
    DOT: 7.85,
    DOGE: 0.095,
    AVAX: 38.50,
    LINK: 15.30,
    MATIC: 0.92,
  };

  return Object.entries(mockPrices).map(([symbol, price]) => ({
    id: symbol.toLowerCase(),
    symbol: symbol,
    name: CRYPTO_IDS[symbol] ? symbol : symbol,
    type: 'crypto',
    price: price,
    price_formatted: formatPrice(price),
    change_24h: (Math.random() - 0.5) * price * 0.1,
    change_24h_percent: (Math.random() - 0.5) * 10,
    change_1h_percent: (Math.random() - 0.5) * 2,
    change_7d_percent: (Math.random() - 0.5) * 20,
    market_cap_usd: price * Math.random() * 1e9,
    market_cap_formatted: formatMarketCap(price * Math.random() * 1e9),
    volume_24h: Math.random() * 1e9,
    high_24h: price * 1.05,
    low_24h: price * 0.95,
    sparkline: Array.from({length: 24}, () => price * (0.95 + Math.random() * 0.1)),
    last_updated: new Date().toISOString(),
  }));
};

// Generate mock stock data for development/fallback
const generateMockStockData = () => {
  const mockPrices = {
    AAPL: 195.89,
    GOOGL: 140.12,
    MSFT: 378.85,
    AMZN: 155.33,
    NVDA: 495.22,
    TSLA: 242.84,
    META: 358.32,
    'BRK.B': 365.95,
  };

  return Object.entries(mockPrices).map(([symbol, price]) => ({
    id: symbol.toLowerCase(),
    symbol: symbol,
    name: symbol,
    type: 'stock',
    price: price,
    price_formatted: formatPrice(price),
    change_24h: (Math.random() - 0.5) * price * 0.03,
    change_24h_percent: (Math.random() - 0.5) * 3,
    market_cap_usd: price * Math.random() * 1e11,
    market_cap_formatted: formatMarketCap(price * Math.random() * 1e11),
    volume_24h: Math.random() * 1e8,
    high_24h: price * 1.02,
    low_24h: price * 0.98,
    last_updated: new Date().toISOString(),
  }));
};

// Export default for easy importing
export default {
  fetchCryptoData,
  fetchStockData,
  fetchAllMarketData,
  connectToRealTimeData,
  API_CONFIG,
};
