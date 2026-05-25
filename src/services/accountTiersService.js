const TIER_KEY = 'plutus_account_tier';

export const ACCOUNT_TIERS = {
  BEGINNER: {
    id: 'beginner',
    name: 'Beginner',
    icon: '🌱',
    startingBalance: 10000,
    description: 'Learn the basics of trading',
    unlockRequirement: null, // Always unlocked
    features: [
      'Basic trading',
      'Market data',
      'Simple charts',
      'Transaction history'
    ],
    maxDailyTrades: 10,
    color: 'green'
  },
  INTERMEDIATE: {
    id: 'intermediate',
    name: 'Intermediate',
    icon: '📊',
    startingBalance: 100000,
    description: 'Advanced features and higher capital',
    unlockRequirement: {
      minProfit: 2000, // $2,000 profit on beginner
      minTrades: 20
    },
    features: [
      'All Beginner features',
      'Advanced charts',
      'Trading statistics',
      'Portfolio analytics'
    ],
    maxDailyTrades: 50,
    color: 'blue'
  },
  ADVANCED: {
    id: 'advanced',
    name: 'Advanced',
    icon: '🚀',
    startingBalance: 1000000,
    description: 'Professional trading with maximum capital',
    unlockRequirement: {
      portfolioValue: 150000, // Reach $150K on intermediate
      winRate: 60
    },
    features: [
      'All Intermediate features',
      'Stop-loss/Take-profit orders',
      'Price alerts',
      'Risk management tools'
    ],
    maxDailyTrades: 100,
    color: 'purple'
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    icon: '👑',
    startingBalance: 10000000,
    description: 'Elite trader status with unlimited potential',
    unlockRequirement: {
      portfolioValue: 1500000, // Reach $1.5M on advanced
      totalTrades: 500,
      winRate: 65
    },
    features: [
      'All Advanced features',
      'Algorithmic trading',
      'Custom indicators',
      'Priority support',
      'Leaderboards'
    ],
    maxDailyTrades: 999,
    color: 'gold'
  }
};

// Get current tier
export const getCurrentTier = () => {
  try {
    const stored = localStorage.getItem(TIER_KEY);
    return stored || 'intermediate'; // Default to intermediate (current tier)
  } catch (error) {
    return 'intermediate';
  }
};

// Set tier
export const setCurrentTier = (tierId) => {
  localStorage.setItem(TIER_KEY, tierId);
  
  // Trigger tier change event
  const event = new CustomEvent('tierChanged', {
    detail: ACCOUNT_TIERS[tierId.toUpperCase()]
  });
  window.dispatchEvent(event);
};

// Check if user can unlock next tier
export const checkTierUnlock = (stats, wallet) => {
  const currentTierId = getCurrentTier();
  const currentTier = ACCOUNT_TIERS[currentTierId.toUpperCase()];
  
  const tierOrder = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'];
  const currentIndex = tierOrder.indexOf(currentTierId.toUpperCase());
  
  if (currentIndex === tierOrder.length - 1) {
    return { canUnlock: false, nextTier: null };
  }
  
  const nextTierId = tierOrder[currentIndex + 1];
  const nextTier = ACCOUNT_TIERS[nextTierId];
  
  if (!nextTier.unlockRequirement) {
    return { canUnlock: true, nextTier };
  }
  
  const req = nextTier.unlockRequirement;
  let canUnlock = true;
  let missingRequirements = [];
  
  if (req.minProfit && (stats.totalRealizedPnL < req.minProfit)) {
    canUnlock = false;
    missingRequirements.push(`Profit: $${stats.totalRealizedPnL.toFixed(0)}/$${req.minProfit}`);
  }
  
  if (req.minTrades && (stats.totalTrades < req.minTrades)) {
    canUnlock = false;
    missingRequirements.push(`Trades: ${stats.totalTrades}/${req.minTrades}`);
  }
  
  if (req.portfolioValue && (wallet.totalValue < req.portfolioValue)) {
    canUnlock = false;
    missingRequirements.push(`Portfolio: $${wallet.totalValue.toFixed(0)}/$${req.portfolioValue}`);
  }
  
  if (req.winRate && (stats.winRate < req.winRate)) {
    canUnlock = false;
    missingRequirements.push(`Win Rate: ${stats.winRate.toFixed(0)}%/${req.winRate}%`);
  }
  
  if (req.totalTrades && (stats.totalTrades < req.totalTrades)) {
    canUnlock = false;
    missingRequirements.push(`Total Trades: ${stats.totalTrades}/${req.totalTrades}`);
  }
  
  return {
    canUnlock,
    nextTier,
    missingRequirements
  };
};

// Upgrade to next tier
export const upgradeTier = () => {
  const tierOrder = ['beginner', 'intermediate', 'advanced', 'pro'];
  const currentTierId = getCurrentTier();
  const currentIndex = tierOrder.indexOf(currentTierId);
  
  if (currentIndex < tierOrder.length - 1) {
    const nextTierId = tierOrder[currentIndex + 1];
    setCurrentTier(nextTierId);
    return ACCOUNT_TIERS[nextTierId.toUpperCase()];
  }
  
  return null;
};

export default {
  ACCOUNT_TIERS,
  getCurrentTier,
  setCurrentTier,
  checkTierUnlock,
  upgradeTier
};
