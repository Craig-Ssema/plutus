// Test script to verify API connections
// Run this in your browser console or as a Node.js script

import { fetchCryptoData, fetchStockData, API_CONFIG } from './src/services/marketDataService.js';

console.log('🧪 Testing Market Data APIs...\n');

// Test configuration status
const checkConfiguration = () => {
  console.log('📋 Configuration Status:');
  console.log('------------------------');
  
  const apis = {
    'CoinGecko (Crypto)': 'No API key needed - ✅ Ready',
    'Alpha Vantage (Stocks)': API_CONFIG.ALPHA_VANTAGE.API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY' ? '✅ Configured' : '❌ Not configured',
    'Twelve Data (Stocks)': API_CONFIG.TWELVE_DATA.API_KEY !== 'YOUR_TWELVE_DATA_API_KEY' ? '✅ Configured' : '❌ Not configured',
    'Finnhub (WebSocket)': API_CONFIG.FINNHUB.API_KEY !== 'YOUR_FINNHUB_API_KEY' ? '✅ Configured' : '❌ Not configured',
  };

  Object.entries(apis).forEach(([name, status]) => {
    console.log(`${name}: ${status}`);
  });
  
  console.log('\n');
};

// Test CoinGecko API (Cryptocurrency)
const testCryptoAPI = async () => {
  console.log('🪙 Testing CoinGecko API (Cryptocurrency)...');
  try {
    const data = await fetchCryptoData();
    if (data && data.length > 0) {
      console.log(`✅ Success! Fetched ${data.length} cryptocurrencies`);
      console.log(`Sample: ${data[0].symbol} - $${data[0].price}`);
      
      // Show top 5 cryptos
      console.log('\nTop 5 Cryptocurrencies:');
      data.slice(0, 5).forEach(coin => {
        const change = coin.change_24h_percent >= 0 ? '+' : '';
        console.log(`  ${coin.symbol}: $${coin.price.toFixed(2)} (${change}${coin.change_24h_percent.toFixed(2)}%)`);
      });
    } else {
      console.log('❌ No crypto data received');
    }
  } catch (error) {
    console.error('❌ Error fetching crypto data:', error.message);
  }
  console.log('\n');
};

// Test Stock APIs
const testStockAPI = async () => {
  console.log('📈 Testing Stock APIs...');
  try {
    const data = await fetchStockData();
    if (data && data.length > 0) {
      console.log(`✅ Success! Fetched ${data.length} stocks`);
      console.log(`Sample: ${data[0].symbol} - $${data[0].price}`);
      
      // Show fetched stocks
      console.log('\nFetched Stocks:');
      data.forEach(stock => {
        const change = stock.change_24h_percent >= 0 ? '+' : '';
        console.log(`  ${stock.symbol}: $${stock.price.toFixed(2)} (${change}${stock.change_24h_percent.toFixed(2)}%)`);
      });
    } else {
      console.log('⚠️ Using mock data (configure API keys for real data)');
    }
  } catch (error) {
    console.error('❌ Error fetching stock data:', error.message);
  }
  console.log('\n');
};

// Test specific API endpoints
const testSpecificAPIs = async () => {
  console.log('🔍 Testing Individual APIs...');
  
  // Test CoinGecko directly
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping');
    const data = await response.json();
    console.log('CoinGecko: ', data.gecko_says ? '✅ Connected' : '❌ Failed');
  } catch (error) {
    console.log('CoinGecko: ❌ Failed -', error.message);
  }

  // Test Alpha Vantage (if configured)
  if (API_CONFIG.ALPHA_VANTAGE.API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${API_CONFIG.ALPHA_VANTAGE.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data['Global Quote']) {
        console.log('Alpha Vantage: ✅ Connected - AAPL: $' + data['Global Quote']['05. price']);
      } else if (data.Note) {
        console.log('Alpha Vantage: ⚠️ Rate limit reached');
      } else {
        console.log('Alpha Vantage: ❌ Invalid response');
      }
    } catch (error) {
      console.log('Alpha Vantage: ❌ Failed -', error.message);
    }
  }

  // Test Twelve Data (if configured)
  if (API_CONFIG.TWELVE_DATA.API_KEY !== 'YOUR_TWELVE_DATA_API_KEY') {
    try {
      const url = `https://api.twelvedata.com/quote?symbol=AAPL&apikey=${API_CONFIG.TWELVE_DATA.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.price) {
        console.log('Twelve Data: ✅ Connected - AAPL: $' + data.price);
      } else {
        console.log('Twelve Data: ❌ Invalid response');
      }
    } catch (error) {
      console.log('Twelve Data: ❌ Failed -', error.message);
    }
  }

  // Test Finnhub (if configured)
  if (API_CONFIG.FINNHUB.API_KEY !== 'YOUR_FINNHUB_API_KEY') {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${API_CONFIG.FINNHUB.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.c) {
        console.log('Finnhub: ✅ Connected - AAPL: $' + data.c);
      } else {
        console.log('Finnhub: ❌ Invalid response');
      }
    } catch (error) {
      console.log('Finnhub: ❌ Failed -', error.message);
    }
  }
  
  console.log('\n');
};

// Run all tests
const runAllTests = async () => {
  console.clear();
  console.log('====================================');
  console.log('   PLUTUS MARKET DATA API TESTER   ');
  console.log('====================================\n');
  
  checkConfiguration();
  await testCryptoAPI();
  await testStockAPI();
  await testSpecificAPIs();
  
  console.log('====================================');
  console.log('           TEST COMPLETE            ');
  console.log('====================================\n');
  
  console.log('📌 Next Steps:');
  console.log('1. If any APIs show "Not configured", get free API keys');
  console.log('2. Add keys to src/services/marketDataService.js');
  console.log('3. Restart your development server');
  console.log('4. Navigate to Markets or Trade page to see real-time data!\n');
};

// Export for use in browser console
window.testMarketAPIs = runAllTests;

// Run tests
runAllTests();

console.log('💡 Tip: You can run this test again by typing: testMarketAPIs()');
