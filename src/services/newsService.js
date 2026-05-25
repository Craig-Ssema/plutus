// Financial News Service
// This service can be configured to use real news APIs

const NEWS_SOURCES = {
  ALPHA_VANTAGE: 'https://www.alphavantage.co/query',
  FINNHUB: 'https://finnhub.io/api/v1',
  NEWSAPI: 'https://newsapi.org/v2',
};

/**
 * Fetch financial news from various sources
 * @param {string} category - stocks, crypto, forex, or all
 * @param {string} searchQuery - Optional search term
 * @returns {Promise<Array>} Array of news articles
 */
export const fetchFinancialNews = async (category = 'all', searchQuery = null) => {
  try {
    // For production, you would use real API keys
    // Example with NewsAPI:
    // const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    // const query = searchQuery || getCategoryQuery(category);
    // const response = await fetch(
    //   `${NEWS_SOURCES.NEWSAPI}/everything?q=${query}&apiKey=${apiKey}&language=en&sortBy=publishedAt`
    // );
    
    // For demo purposes, return curated mock data
    return getMockFinancialNews(category, searchQuery);
  } catch (error) {
    console.error('Error fetching news:', error);
    return getMockFinancialNews(category, searchQuery);
  }
};

/**
 * Get category-specific search query
 */
const getCategoryQuery = (category) => {
  const queries = {
    stocks: 'stock market OR NYSE OR NASDAQ OR S&P 500',
    crypto: 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
    forex: 'forex OR currency trading OR FX market',
    all: 'stock market OR cryptocurrency OR forex OR financial markets'
  };
  return queries[category] || queries.all;
};

/**
 * Generate high-quality mock financial news
 */
const getMockFinancialNews = (category, searchQuery) => {
  const allNews = [
    // Stock Market News
    {
      id: 1,
      title: "S&P 500 Rallies to Record High as Tech Stocks Lead Gains",
      description: "The S&P 500 closed at an all-time high on Friday, driven by strong earnings from technology giants and optimistic economic data. The broad market index gained 1.2%, with tech stocks leading the advance.",
      content: "Major U.S. stock indexes reached new heights as investors digested better-than-expected corporate earnings and positive economic indicators...",
      source: "Financial Times",
      author: "Market Desk",
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: "https://ft.com/markets/sp500-record",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
      category: "stocks",
      sentiment: "positive",
      symbols: ["SPY", "AAPL", "MSFT", "GOOGL"]
    },
    {
      id: 2,
      title: "Federal Reserve Maintains Interest Rates, Signals Data-Dependent Approach",
      description: "The Federal Reserve held interest rates steady at its latest meeting, with Chair Powell emphasizing a flexible, data-driven monetary policy stance amid evolving economic conditions.",
      content: "In a widely anticipated decision, the Federal Open Market Committee voted unanimously to maintain the federal funds rate...",
      source: "Bloomberg",
      author: "Economics Team",
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      url: "https://bloomberg.com/fed-decision",
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800",
      category: "stocks",
      sentiment: "neutral",
      symbols: ["TLT", "IEF"]
    },
    {
      id: 3,
      title: "NVIDIA Announces Next-Generation AI Chips, Stock Surges 8%",
      description: "NVIDIA unveiled its latest AI processing chips, promising 10x performance improvements. The announcement sent shares soaring in after-hours trading as investors bet on continued AI demand.",
      content: "Graphics chip maker NVIDIA Corporation revealed its next-generation AI accelerators at a tech conference...",
      source: "Reuters",
      author: "Tech Reporter",
      published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      url: "https://reuters.com/nvidia-ai-chips",
      image: "https://images.unsplash.com/photo-1591453089344-03f8c6b31051?w=800",
      category: "stocks",
      sentiment: "positive",
      symbols: ["NVDA"]
    },

    // Cryptocurrency News
    {
      id: 4,
      title: "Bitcoin Breaks $65,000 as Institutional Adoption Accelerates",
      description: "Bitcoin surged past $65,000 for the first time this quarter as major financial institutions announced expanded cryptocurrency services and investment products.",
      content: "The world's largest cryptocurrency rallied strongly on Monday, driven by growing institutional interest...",
      source: "CoinDesk",
      author: "Crypto Desk",
      published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      url: "https://coindesk.com/bitcoin-65k",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800",
      category: "crypto",
      sentiment: "positive",
      symbols: ["BTC", "ETH"]
    },
    {
      id: 5,
      title: "Ethereum Network Upgrade Reduces Transaction Fees by 40%",
      description: "The Ethereum blockchain's latest protocol upgrade has successfully reduced average transaction costs while improving network throughput, developers confirm.",
      content: "Ethereum's highly anticipated network improvement went live without issues, bringing significant benefits to users...",
      source: "The Block",
      author: "Blockchain Team",
      published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      url: "https://theblock.co/ethereum-upgrade",
      image: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800",
      category: "crypto",
      sentiment: "positive",
      symbols: ["ETH"]
    },
    {
      id: 6,
      title: "SEC Approves Multiple Spot Bitcoin ETFs, Opening Crypto to Mainstream",
      description: "The Securities and Exchange Commission greenlit several spot Bitcoin exchange-traded funds, marking a watershed moment for cryptocurrency accessibility in traditional markets.",
      content: "In a landmark decision, U.S. regulators approved the first spot Bitcoin ETFs after years of deliberation...",
      source: "Cointelegraph",
      author: "Regulatory Reporter",
      published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      url: "https://cointelegraph.com/sec-bitcoin-etf",
      image: "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800",
      category: "crypto",
      sentiment: "positive",
      symbols: ["BTC"]
    },

    // Forex News
    {
      id: 7,
      title: "Dollar Strengthens as Strong Jobs Data Boost Rate Expectations",
      description: "The U.S. dollar rallied broadly after employment figures exceeded forecasts, leading traders to reassess Federal Reserve policy timing.",
      content: "The greenback gained against major currencies following robust labor market data...",
      source: "ForexLive",
      author: "FX Desk",
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: "https://forexlive.com/dollar-jobs",
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800",
      category: "forex",
      sentiment: "neutral",
      symbols: ["DXY", "EUR/USD"]
    },
    {
      id: 8,
      title: "European Central Bank Hints at Rate Cuts Amid Slowing Growth",
      description: "ECB officials signaled openness to interest rate reductions as eurozone economic indicators point to moderating expansion and controlled inflation.",
      content: "European Central Bank policymakers are increasingly discussing the possibility of monetary easing...",
      source: "FXStreet",
      author: "Europe Correspondent",
      published_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      url: "https://fxstreet.com/ecb-rates",
      image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800",
      category: "forex",
      sentiment: "neutral",
      symbols: ["EUR/USD"]
    },

    // General Financial News
    {
      id: 9,
      title: "Global Markets Rise on Easing Trade Tensions and Growth Optimism",
      description: "Stock markets worldwide posted gains as diplomatic progress on trade disputes and positive economic forecasts lifted investor sentiment across asset classes.",
      content: "International equity markets rallied in coordinated fashion as multiple positive developments converged...",
      source: "Wall Street Journal",
      author: "Global Markets",
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      url: "https://wsj.com/global-markets",
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800",
      category: "stocks",
      sentiment: "positive",
      symbols: ["SPY", "QQQ"]
    },
    {
      id: 10,
      title: "Oil Prices Surge 5% on Unexpected Supply Disruptions",
      description: "Crude oil futures jumped sharply after production outages in key regions tightened global supply, raising concerns about energy inflation.",
      content: "Brent crude and West Texas Intermediate both posted significant gains as market participants assessed supply constraints...",
      source: "CNBC",
      author: "Energy Team",
      published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      url: "https://cnbc.com/oil-surge",
      image: "https://images.unsplash.com/photo-1541890943-7a65f95a41fa?w=800",
      category: "stocks",
      sentiment: "negative",
      symbols: ["USO", "XLE"]
    }
  ];

  // Filter by category
  let filtered = category === 'all' 
    ? allNews 
    : allNews.filter(news => news.category === category);

  // Filter by search query if provided
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(news => 
      news.title.toLowerCase().includes(query) ||
      news.description.toLowerCase().includes(query) ||
      news.symbols?.some(symbol => symbol.toLowerCase().includes(query))
    );
  }

  return filtered;
};

/**
 * Fetch trending stocks/crypto
 */
export const fetchTrendingAssets = async () => {
  // Mock trending assets
  return {
    stocks: [
      { symbol: 'AAPL', change: 2.4, price: 185.32 },
      { symbol: 'NVDA', change: 8.1, price: 492.50 },
      { symbol: 'TSLA', change: -1.2, price: 245.18 },
    ],
    crypto: [
      { symbol: 'BTC', change: 3.2, price: 65420 },
      { symbol: 'ETH', change: 5.1, price: 3280 },
      { symbol: 'SOL', change: -2.1, price: 98.50 },
    ]
  };
};

export default {
  fetchFinancialNews,
  fetchTrendingAssets
};
