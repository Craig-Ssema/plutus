import { getWallet, getTransactions } from './walletService';

// Calculate trading statistics
export const getTradingStatistics = () => {
  const wallet = getWallet();
  const transactions = getTransactions(1000); // Get all transactions
  
  const sells = transactions.filter(tx => tx.type === 'SELL');
  const buys = transactions.filter(tx => tx.type === 'BUY');
  
  // Win/Loss calculations
  const profitableTrades = sells.filter(tx => tx.pnl > 0);
  const losingTrades = sells.filter(tx => tx.pnl < 0);
  
  const winRate = sells.length > 0 ? (profitableTrades.length / sells.length) * 100 : 0;
  
  // Average profit/loss
  const avgProfit = profitableTrades.length > 0
    ? profitableTrades.reduce((sum, tx) => sum + tx.pnl, 0) / profitableTrades.length
    : 0;
    
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, tx) => sum + Math.abs(tx.pnl), 0) / losingTrades.length
    : 0;
  
  // Best/Worst trades
  const bestTrade = sells.length > 0
    ? sells.reduce((best, tx) => tx.pnl > (best?.pnl || -Infinity) ? tx : best, sells[0])
    : null;
    
  const worstTrade = sells.length > 0
    ? sells.reduce((worst, tx) => tx.pnl < (worst?.pnl || Infinity) ? tx : worst, sells[0])
    : null;
  
  // Total P/L from all closed positions
  const totalRealizedPnL = sells.reduce((sum, tx) => sum + (tx.pnl || 0), 0);
  
  // Total fees paid
  const totalFees = transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);
  
  // Asset breakdown
  const assetStats = {};
  sells.forEach(tx => {
    if (!assetStats[tx.symbol]) {
      assetStats[tx.symbol] = {
        symbol: tx.symbol,
        name: tx.name,
        trades: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0
      };
    }
    assetStats[tx.symbol].trades++;
    if (tx.pnl > 0) assetStats[tx.symbol].wins++;
    if (tx.pnl < 0) assetStats[tx.symbol].losses++;
    assetStats[tx.symbol].totalPnL += tx.pnl;
  });
  
  const topPerformers = Object.values(assetStats)
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 5);
    
  const worstPerformers = Object.values(assetStats)
    .sort((a, b) => a.totalPnL - b.totalPnL)
    .slice(0, 5);
  
  return {
    totalTrades: transactions.length,
    totalBuys: buys.length,
    totalSells: sells.length,
    winRate: winRate,
    profitableTrades: profitableTrades.length,
    losingTrades: losingTrades.length,
    avgProfit: avgProfit,
    avgLoss: avgLoss,
    bestTrade: bestTrade,
    worstTrade: worstTrade,
    totalRealizedPnL: totalRealizedPnL,
    totalFees: totalFees,
    netProfit: totalRealizedPnL - totalFees,
    currentPortfolioValue: wallet.totalValue,
    currentPnL: wallet.totalPnL || 0,
    topPerformers: topPerformers,
    worstPerformers: worstPerformers,
    profitFactor: avgLoss > 0 ? avgProfit / avgLoss : 0,
    returnOnInvestment: ((wallet.totalValue - 100000) / 100000) * 100
  };
};

// Calculate today's P/L
export const getTodayPnL = () => {
  const transactions = getTransactions(1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    txDate.setHours(0, 0, 0, 0);
    return txDate.getTime() === today.getTime();
  });
  
  const todayPnL = todayTransactions
    .filter(tx => tx.type === 'SELL')
    .reduce((sum, tx) => sum + (tx.pnl || 0), 0);
    
  return {
    pnl: todayPnL,
    trades: todayTransactions.length,
    buys: todayTransactions.filter(tx => tx.type === 'BUY').length,
    sells: todayTransactions.filter(tx => tx.type === 'SELL').length
  };
};

// Portfolio diversity score (0-10)
export const getPortfolioDiversity = () => {
  const wallet = getWallet();
  const holdings = Object.values(wallet.holdings);
  
  if (holdings.length === 0) return 0;
  if (holdings.length === 1) return 3;
  if (holdings.length === 2) return 5;
  if (holdings.length === 3) return 7;
  if (holdings.length >= 4 && holdings.length <= 6) return 9;
  if (holdings.length >= 7) return 10;
  
  return 0;
};

// Risk assessment
export const getRiskLevel = () => {
  const stats = getTradingStatistics();
  const diversity = getPortfolioDiversity();
  
  // Calculate risk score (0-100)
  let riskScore = 50; // Start neutral
  
  // Win rate factor
  if (stats.winRate < 40) riskScore += 20;
  else if (stats.winRate > 70) riskScore -= 15;
  
  // Diversity factor
  if (diversity < 5) riskScore += 15;
  else if (diversity >= 8) riskScore -= 10;
  
  // Current P/L factor
  if (stats.currentPnL < -5000) riskScore += 15;
  else if (stats.currentPnL > 10000) riskScore -= 10;
  
  // Determine risk level
  if (riskScore <= 30) return { level: 'Low', color: 'green', score: riskScore };
  if (riskScore <= 60) return { level: 'Moderate', color: 'yellow', score: riskScore };
  return { level: 'High', color: 'red', score: riskScore };
};

export default {
  getTradingStatistics,
  getTodayPnL,
  getPortfolioDiversity,
  getRiskLevel
};
