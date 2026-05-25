// Wallet Service - Paper Trading System with Fake Money
// Users start with $100,000 in fake money and can trade with real market data

import { notifyTradeExecution } from './notificationService';

const INITIAL_BALANCE = 100000;
const STORAGE_KEY = 'plutus_wallet';
const TRANSACTION_FEE_PERCENT = 0.1; // 0.1% fee per trade

const initializeWallet = () => {
  return {
    cash: INITIAL_BALANCE,
    holdings: {}, // { symbol: { quantity, avgPrice, totalCost } }
    transactions: [],
    totalValue: INITIAL_BALANCE,
    totalPnL: 0,
    totalPnLPercent: 0,
    createdAt: new Date().toISOString()
  };
};

export const getWallet = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const newWallet = initializeWallet();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWallet));
      return newWallet;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading wallet:', error);
    return initializeWallet();
  }
};

// Save wallet data
export const saveWallet = (wallet) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    return true;
  } catch (error) {
    console.error('Error saving wallet:', error);
    return false;
  }
};

// Reset wallet to initial state
export const resetWallet = () => {
  const newWallet = initializeWallet();
  saveWallet(newWallet);
  return newWallet;
};

// Buy asset
export const buyAsset = (symbol, name, quantity, price) => {
  const wallet = getWallet();
  const cost = quantity * price;
  const fee = cost * (TRANSACTION_FEE_PERCENT / 100);
  const totalCost = cost + fee;
  
  // Check if user has enough cash (including fee)
  if (wallet.cash < totalCost) {
    return { 
      success: false, 
      error: 'Insufficient funds (including 0.1% fee)',
      availableCash: wallet.cash,
      requiredCash: totalCost,
      fee: fee
    };
  }
  
  // Update cash (cost + fee)
  wallet.cash -= totalCost;
  
  // Update holdings
  if (wallet.holdings[symbol]) {
    const holding = wallet.holdings[symbol];
    const newQuantity = holding.quantity + quantity;
    const newTotalCost = holding.totalCost + cost;
    
    wallet.holdings[symbol] = {
      symbol,
      name,
      quantity: newQuantity,
      avgPrice: newTotalCost / newQuantity,
      totalCost: newTotalCost,
      currentPrice: price
    };
  } else {
    wallet.holdings[symbol] = {
      symbol,
      name,
      quantity,
      avgPrice: price,
      totalCost: cost,
      currentPrice: price
    };
  }
  
  // Add transaction
  wallet.transactions.unshift({
    id: Date.now().toString(),
    type: 'BUY',
    symbol,
    name,
    quantity,
    price,
    total: cost,
    fee: fee,
    totalCost: totalCost,
    timestamp: new Date().toISOString()
  });
  
  saveWallet(wallet);
  
  // Send notification with fee info
  notifyTradeExecution('BUY', symbol, quantity, price, totalCost, null, fee);
  
  return { 
    success: true, 
    wallet,
    transaction: wallet.transactions[0]
  };
};

// Sell asset
export const sellAsset = (symbol, name, quantity, price) => {
  const wallet = getWallet();
  
  // Check if user has the asset
  if (!wallet.holdings[symbol]) {
    return { 
      success: false, 
      error: 'You do not own this asset'
    };
  }
  
  const holding = wallet.holdings[symbol];
  
  // Check if user has enough quantity
  if (holding.quantity < quantity) {
    return { 
      success: false, 
      error: 'Insufficient quantity',
      availableQuantity: holding.quantity,
      requestedQuantity: quantity
    };
  }
  
  const revenue = quantity * price;
  const fee = revenue * (TRANSACTION_FEE_PERCENT / 100);
  const netRevenue = revenue - fee;
  
  // Update cash (revenue - fee)
  wallet.cash += netRevenue;
  
  // Update holdings
  if (holding.quantity === quantity) {
    // Sell all - remove holding
    delete wallet.holdings[symbol];
  } else {
    // Partial sell
    const remainingQuantity = holding.quantity - quantity;
    const soldCost = (quantity / holding.quantity) * holding.totalCost;
    const remainingCost = holding.totalCost - soldCost;
    
    wallet.holdings[symbol] = {
      ...holding,
      quantity: remainingQuantity,
      totalCost: remainingCost,
      avgPrice: remainingCost / remainingQuantity,
      currentPrice: price
    };
  }
  
  // Calculate P&L (after fees)
  const costBasis = quantity * holding.avgPrice;
  const pnl = netRevenue - costBasis;
  const pnlPercent = (pnl / costBasis) * 100;
  
  // Add transaction
  wallet.transactions.unshift({
    id: Date.now().toString(),
    type: 'SELL',
    symbol,
    name,
    quantity,
    price,
    total: revenue,
    fee: fee,
    netRevenue: netRevenue,
    pnl,
    pnlPercent,
    timestamp: new Date().toISOString()
  });
  
  saveWallet(wallet);
  
  // Send notification with P&L and fee
  notifyTradeExecution('SELL', symbol, quantity, price, netRevenue, pnl, fee);
  
  return { 
    success: true, 
    wallet,
    transaction: wallet.transactions[0]
  };
};

// Calculate portfolio value with current market prices
export const calculatePortfolioValue = (marketData) => {
  const wallet = getWallet();
  let holdingsValue = 0;
  let totalPnL = 0;
  
  // Update current prices for each holding
  Object.keys(wallet.holdings).forEach(symbol => {
    const holding = wallet.holdings[symbol];
    const marketAsset = marketData.find(a => a.symbol === symbol);
    
    if (marketAsset) {
      const currentPrice = marketAsset.price;
      const previousPrice = holding.currentPrice || holding.avgPrice;
      
      // Track price change
      holding.previousPrice = previousPrice;
      holding.currentPrice = currentPrice;
      holding.priceChange = currentPrice - previousPrice;
      holding.priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
      
      const currentValue = holding.quantity * currentPrice;
      holdingsValue += currentValue;
      
      const pnl = currentValue - holding.totalCost;
      holding.pnl = pnl;
      holding.pnlPercent = (pnl / holding.totalCost) * 100;
      holding.currentValue = currentValue;
      
      totalPnL += pnl;
    }
  });
  
  wallet.totalValue = wallet.cash + holdingsValue;
  wallet.totalPnL = totalPnL;
  wallet.totalPnLPercent = totalPnL > 0 ? (totalPnL / (wallet.totalValue - totalPnL)) * 100 : 0;
  wallet.holdingsValue = holdingsValue;
  wallet.lastUpdated = new Date().toISOString();
  
  saveWallet(wallet);
  
  return wallet;
};

// Get unrealized P&L for a specific holding
export const getHoldingPnL = (symbol, currentPrice) => {
  const wallet = getWallet();
  const holding = wallet.holdings[symbol];
  
  if (!holding) return null;
  
  const currentValue = holding.quantity * currentPrice;
  const pnl = currentValue - holding.totalCost;
  const pnlPercent = (pnl / holding.totalCost) * 100;
  
  return {
    currentValue,
    pnl,
    pnlPercent,
    costBasis: holding.totalCost,
    quantity: holding.quantity,
    avgPrice: holding.avgPrice
  };
};

// Get transaction history
export const getTransactions = (limit = 50) => {
  const wallet = getWallet();
  return wallet.transactions.slice(0, limit);
};

// Get holdings as array
export const getHoldings = () => {
  const wallet = getWallet();
  return Object.values(wallet.holdings);
};

// Get portfolio summary
export const getPortfolioSummary = () => {
  const wallet = getWallet();
  return {
    cash: wallet.cash,
    holdingsValue: wallet.holdingsValue || 0,
    totalValue: wallet.totalValue,
    totalPnL: wallet.totalPnL || 0,
    totalPnLPercent: wallet.totalPnLPercent || 0,
    holdingsCount: Object.keys(wallet.holdings).length,
    transactionsCount: wallet.transactions.length
  };
};

export default {
  getWallet,
  saveWallet,
  resetWallet,
  buyAsset,
  sellAsset,
  calculatePortfolioValue,
  getTransactions,
  getHoldings,
  getPortfolioSummary
};
