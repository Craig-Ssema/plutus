// Debug and Fix Script for Plutus Market Data
// Run this in your browser console to test the API connections

console.log('🔧 Plutus Debug Script Running...\n');

// Check if we're on the right page
if (!window.location.pathname.includes('trade') && !window.location.pathname.includes('market')) {
  console.log('⚠️ Please navigate to the Markets or Trade page first!');
} else {
  console.log('✅ Page detected, checking data...');
  
  // Check localStorage for watchlist
  const watchlist = localStorage.getItem('plutus_watchlist');
  if (watchlist) {
    console.log('✅ Watchlist found:', JSON.parse(watchlist));
  } else {
    console.log('📝 No watchlist saved yet');
  }
  
  // Test API directly
  console.log('\n📊 Testing direct API calls...');
  
  // Test CoinGecko
  fetch('https://api.coingecko.com/api/v3/ping')
    .then(r => r.json())
    .then(data => console.log('✅ CoinGecko:', data.gecko_says ? 'Connected' : 'Failed'))
    .catch(e => console.log('❌ CoinGecko:', e.message));
  
  // Clear any bad cache
  console.log('\n🧹 Clearing potential bad cache...');
  sessionStorage.clear();
  
  console.log('\n💡 Tips:');
  console.log('1. If the page is white, refresh with Ctrl+F5');
  console.log('2. The WebSocket warning is normal without Finnhub key');
  console.log('3. Source map warnings are harmless development warnings');
  console.log('4. Data updates every 30 seconds automatically');
}

// Force reload market data
if (window.location.pathname.includes('trade') || window.location.pathname.includes('market')) {
  console.log('\n🔄 Forcing data refresh...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
