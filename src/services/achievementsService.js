const ACHIEVEMENTS_KEY = 'plutus_achievements';
const CHALLENGES_KEY = 'plutus_challenges';

// Define all achievements
export const ACHIEVEMENTS = {
  FIRST_TRADE: {
    id: 'first_trade',
    title: '🥉 First Trade',
    description: 'Complete your first trade',
    icon: '💵',
    requirement: (stats) => stats.totalTrades >= 1,
    points: 10
  },
  FIVE_TRADES: {
    id: 'five_trades',
    title: '📊 Getting Started',
    description: 'Complete 5 trades',
    icon: '📈',
    requirement: (stats) => stats.totalTrades >= 5,
    points: 25
  },
  PROFITABLE_WEEK: {
    id: 'profitable_week',
    title: '🥈 Profitable Week',
    description: 'End the week with a profit',
    icon: '📅',
    requirement: (stats) => stats.currentPnL > 0,
    points: 50
  },
  SIX_FIGURE: {
    id: 'six_figure',
    title: '🥇 6-Figure Portfolio',
    description: 'Reach $100,000 portfolio value',
    icon: '💰',
    requirement: (stats) => stats.currentPortfolioValue >= 100000,
    points: 100
  },
  DIAMOND_HANDS: {
    id: 'diamond_hands',
    title: '💎 Diamond Hands',
    description: 'Hold a position for 7+ days',
    icon: '💎',
    requirement: (stats, wallet) => {
      const oldestHolding = Object.values(wallet.holdings || {})
        .reduce((oldest, h) => h.timestamp < (oldest?.timestamp || Infinity) ? h : oldest, null);
      if (!oldestHolding) return false;
      const holdDays = (Date.now() - new Date(oldestHolding.timestamp).getTime()) / 86400000;
      return holdDays >= 7;
    },
    points: 75
  },
  MOON_SHOT: {
    id: 'moon_shot',
    title: '🚀 Moon Shot',
    description: '100% profit on a single trade',
    icon: '🌙',
    requirement: (stats) => stats.bestTrade && stats.bestTrade.pnlPercent >= 100,
    points: 200
  },
  SHARP_SHOOTER: {
    id: 'sharp_shooter',
    title: '🎯 Sharp Shooter',
    description: '80% win rate over 20 trades',
    icon: '🎯',
    requirement: (stats) => stats.totalSells >= 20 && stats.winRate >= 80,
    points: 150
  },
  DIVERSIFIED: {
    id: 'diversified',
    title: '🌐 Diversified',
    description: 'Hold 5 different assets',
    icon: '🌐',
    requirement: (stats, wallet) => Object.keys(wallet.holdings || {}).length >= 5,
    points: 75
  },
  TWENTY_FIVE_PERCENT: {
    id: 'twenty_five_percent',
    title: '📈 25% Gains',
    description: 'Grow portfolio by 25%',
    icon: '📈',
    requirement: (stats) => stats.returnOnInvestment >= 25,
    points: 125
  },
  FIFTY_PERCENT: {
    id: 'fifty_percent',
    title: '🔥 50% Gains',
    description: 'Grow portfolio by 50%',
    icon: '🔥',
    requirement: (stats) => stats.returnOnInvestment >= 50,
    points: 250
  },
  DOUBLED: {
    id: 'doubled',
    title: '🏆 Doubled Up',
    description: 'Double your initial investment',
    icon: '🏆',
    requirement: (stats) => stats.currentPortfolioValue >= 200000,
    points: 500
  },
  HUNDRED_TRADES: {
    id: 'hundred_trades',
    title: '💯 Centurion',
    description: 'Complete 100 trades',
    icon: '💯',
    requirement: (stats) => stats.totalTrades >= 100,
    points: 300
  },
  CONSISTENT: {
    id: 'consistent',
    title: '⭐ Consistent Trader',
    description: '5 profitable trades in a row',
    icon: '⭐',
    requirement: (stats, wallet) => {
      // This would need transaction history analysis
      return false; // Placeholder
    },
    points: 100
  }
};

// Get unlocked achievements
export const getUnlockedAchievements = () => {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
};

// Save unlocked achievement
const saveAchievement = (achievementId) => {
  const unlocked = getUnlockedAchievements();
  if (!unlocked.includes(achievementId)) {
    unlocked.push(achievementId);
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    
    // Trigger achievement notification
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    if (achievement) {
      const event = new CustomEvent('achievementUnlocked', {
        detail: achievement
      });
      window.dispatchEvent(event);
    }
  }
};

// Check and unlock achievements
export const checkAchievements = (stats, wallet) => {
  const unlocked = getUnlockedAchievements();
  let newUnlocks = [];
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (!unlocked.includes(achievement.id)) {
      if (achievement.requirement(stats, wallet)) {
        saveAchievement(achievement.id);
        newUnlocks.push(achievement);
      }
    }
  });
  
  return newUnlocks;
};

// Get achievement progress
export const getAchievementProgress = () => {
  const unlocked = getUnlockedAchievements();
  const total = Object.keys(ACHIEVEMENTS).length;
  const unlockedCount = unlocked.length;
  const percentage = (unlockedCount / total) * 100;
  
  const totalPoints = unlocked.reduce((sum, id) => {
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === id);
    return sum + (achievement?.points || 0);
  }, 0);
  
  const maxPoints = Object.values(ACHIEVEMENTS).reduce((sum, a) => sum + a.points, 0);
  
  return {
    unlockedCount,
    total,
    percentage,
    points: totalPoints,
    maxPoints
  };
};

// Daily challenges
export const DAILY_CHALLENGES = [
  {
    id: 'three_trades',
    title: 'Active Trader',
    description: 'Complete 3 trades today',
    reward: 50,
    requirement: (todayStats) => todayStats.trades >= 3
  },
  {
    id: 'profitable_day',
    title: 'Green Day',
    description: 'End the day profitable',
    reward: 75,
    requirement: (todayStats) => todayStats.pnl > 0
  },
  {
    id: 'no_losses',
    title: 'Perfect Day',
    description: 'No losing trades today',
    reward: 100,
    requirement: (todayStats, transactions) => {
      const today = new Date().toDateString();
      const todayTxs = transactions.filter(tx => 
        new Date(tx.timestamp).toDateString() === today && tx.type === 'SELL'
      );
      return todayTxs.length > 0 && todayTxs.every(tx => tx.pnl >= 0);
    }
  }
];

// Check daily challenges
export const checkDailyChallenges = (todayStats, transactions) => {
  const completedToday = getCompletedChallenges();
  const today = new Date().toDateString();
  
  // Reset if it's a new day
  if (completedToday.date !== today) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify({ date: today, completed: [] }));
    return { newCompletions: [], allCompleted: [] };
  }
  
  let newCompletions = [];
  
  DAILY_CHALLENGES.forEach(challenge => {
    if (!completedToday.completed.includes(challenge.id)) {
      if (challenge.requirement(todayStats, transactions)) {
        completedToday.completed.push(challenge.id);
        newCompletions.push(challenge);
      }
    }
  });
  
  if (newCompletions.length > 0) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(completedToday));
  }
  
  return {
    newCompletions,
    allCompleted: completedToday.completed
  };
};

// Get today's completed challenges
export const getCompletedChallenges = () => {
  try {
    const stored = localStorage.getItem(CHALLENGES_KEY);
    const data = stored ? JSON.parse(stored) : { date: new Date().toDateString(), completed: [] };
    return data;
  } catch (error) {
    return { date: new Date().toDateString(), completed: [] };
  }
};

export default {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  checkAchievements,
  getAchievementProgress,
  DAILY_CHALLENGES,
  checkDailyChallenges,
  getCompletedChallenges
};
