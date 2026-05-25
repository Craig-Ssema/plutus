const WATCHLIST_KEY = 'plutus_watchlist';

export const getWatchlist = () => {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
};

export const addToWatchlist = (symbol, name) => {
  try {
    const watchlist = getWatchlist();
    
    if (watchlist.some(item => item.symbol === symbol)) {
      return { success: false, error: 'Already in watchlist' };
    }
    
    watchlist.push({
      symbol,
      name,
      addedAt: new Date().toISOString()
    });
    
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    return { success: true, watchlist };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return { success: false, error: error.message };
  }
};

// Remove from watchlist
export const removeFromWatchlist = (symbol) => {
  try {
    let watchlist = getWatchlist();
    watchlist = watchlist.filter(item => item.symbol !== symbol);
    
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    return { success: true, watchlist };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { success: false, error: error.message };
  }
};

// Check if in watchlist
export const isInWatchlist = (symbol) => {
  const watchlist = getWatchlist();
  return watchlist.some(item => item.symbol === symbol);
};

// Clear watchlist
export const clearWatchlist = () => {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([]));
    return { success: true };
  } catch (error) {
    console.error('Error clearing watchlist:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  clearWatchlist
};
