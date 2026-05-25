const NOTIFICATION_STORAGE_KEY = 'plutus_notifications';
const MAX_NOTIFICATIONS = 50;

// Notification types
export const NOTIFICATION_TYPES = {
  TRADE_EXECUTED: 'trade_executed',
  PROFIT: 'profit',
  LOSS: 'loss',
  SIGNIFICANT_GAIN: 'significant_gain',
  SIGNIFICANT_LOSS: 'significant_loss',
  MILESTONE: 'milestone'
};

// Get all notifications
export const getNotifications = () => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
};

// Save notifications
const saveNotifications = (notifications) => {
  try {
    // Keep only the latest MAX_NOTIFICATIONS
    const limited = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(limited));
    return true;
  } catch (error) {
    console.error('Error saving notifications:', error);
    return false;
  }
};

// Add a new notification
const addNotification = (notification) => {
  const notifications = getNotifications();
  const newNotification = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };
  
  notifications.unshift(newNotification);
  saveNotifications(notifications);
  
  // Show toast notification
  showToastNotification(newNotification);
  
  return newNotification;
};

// Show toast notification (browser notification)
const showToastNotification = (notification) => {
  // Create custom event for React components to listen to
  const event = new CustomEvent('plutusNotification', {
    detail: notification
  });
  window.dispatchEvent(event);
};

// Mark notification as read
export const markAsRead = (notificationId) => {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(updated);
};

// Mark all as read
export const markAllAsRead = () => {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
};

// Clear all notifications
export const clearAllNotifications = () => {
  localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
};

// Delete specific notification
export const deleteNotification = (notificationId) => {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  saveNotifications(filtered);
};

// Get unread count
export const getUnreadCount = () => {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
};

// TRADE NOTIFICATIONS

// Notify when a trade is executed
export const notifyTradeExecution = (type, symbol, quantity, price, total, pnl = null, fee = null) => {
  let message, notificationType, title;
  
  if (type === 'BUY') {
    title = `Bought ${symbol}`;
    message = `Successfully purchased ${quantity} ${symbol} at ${price.toFixed(2)} for ${total.toFixed(2)}${fee ? ` (Fee: ${fee.toFixed(2)})` : ''}`;
    notificationType = NOTIFICATION_TYPES.TRADE_EXECUTED;
  } else if (type === 'SELL') {
    const isProfitable = pnl > 0;
    title = isProfitable ? `Sold ${symbol} for Profit! 🎉` : `Sold ${symbol} for Loss`;
    message = `Sold ${quantity} ${symbol} at ${price.toFixed(2)} for ${total.toFixed(2)}${fee ? ` (Fee: ${fee.toFixed(2)})` : ''}. P/L: ${isProfitable ? '+' : ''}${pnl.toFixed(2)}`;
    notificationType = isProfitable ? NOTIFICATION_TYPES.PROFIT : NOTIFICATION_TYPES.LOSS;
  }
  
  return addNotification({
    type: notificationType,
    title,
    message,
    data: {
      tradeType: type,
      symbol,
      quantity,
      price,
      total,
      pnl
    }
  });
};

// PORTFOLIO VALUE NOTIFICATIONS

// Track previous portfolio value for comparison
let previousPortfolioValue = null;
let previousHoldings = {};

// Notify on portfolio value changes
export const checkPortfolioChanges = (currentWallet, marketData) => {
  if (!currentWallet || !marketData) return;
  
  const currentValue = currentWallet.totalValue;
  const currentPnL = currentWallet.totalPnL;
  
  // Store initial value
  if (previousPortfolioValue === null) {
    previousPortfolioValue = currentValue;
    previousHoldings = { ...currentWallet.holdings };
    return;
  }
  
  const valueChange = currentValue - previousPortfolioValue;
  const percentChange = (valueChange / previousPortfolioValue) * 100;
  
  // Significant gain (> 5% or > $5000)
  if (percentChange >= 5 || valueChange >= 5000) {
    addNotification({
      type: NOTIFICATION_TYPES.SIGNIFICANT_GAIN,
      title: '📈 Significant Gain!',
      message: `Your portfolio increased by $${valueChange.toFixed(2)} (${percentChange.toFixed(2)}%)! Current value: $${currentValue.toFixed(2)}`,
      data: {
        previousValue: previousPortfolioValue,
        currentValue,
        change: valueChange,
        percentChange
      }
    });
  }
  
  // Significant loss (< -5% or < -$5000)
  if (percentChange <= -5 || valueChange <= -5000) {
    addNotification({
      type: NOTIFICATION_TYPES.SIGNIFICANT_LOSS,
      title: '📉 Significant Loss Alert',
      message: `Your portfolio decreased by $${Math.abs(valueChange).toFixed(2)} (${Math.abs(percentChange).toFixed(2)}%). Current value: $${currentValue.toFixed(2)}`,
      data: {
        previousValue: previousPortfolioValue,
        currentValue,
        change: valueChange,
        percentChange
      }
    });
  }
  
  // Check individual holdings for significant changes
  Object.keys(currentWallet.holdings).forEach(symbol => {
    const currentHolding = currentWallet.holdings[symbol];
    const previousHolding = previousHoldings[symbol];
    
    if (previousHolding && currentHolding.pnl !== undefined) {
      const pnlChange = currentHolding.pnl - (previousHolding.pnl || 0);
      const pnlPercentChange = currentHolding.pnlPercent - (previousHolding.pnlPercent || 0);
      
      // Individual asset significant gain
      if (pnlPercentChange >= 10) {
        addNotification({
          type: NOTIFICATION_TYPES.SIGNIFICANT_GAIN,
          title: `🚀 ${symbol} Surging!`,
          message: `${symbol} is up ${pnlPercentChange.toFixed(2)}%! Current gain: $${currentHolding.pnl.toFixed(2)}`,
          data: {
            symbol,
            pnl: currentHolding.pnl,
            pnlPercent: currentHolding.pnlPercent,
            currentPrice: currentHolding.currentPrice
          }
        });
      }
      
      // Individual asset significant loss
      if (pnlPercentChange <= -10) {
        addNotification({
          type: NOTIFICATION_TYPES.SIGNIFICANT_LOSS,
          title: `⚠️ ${symbol} Declining`,
          message: `${symbol} is down ${Math.abs(pnlPercentChange).toFixed(2)}%. Current loss: $${Math.abs(currentHolding.pnl).toFixed(2)}`,
          data: {
            symbol,
            pnl: currentHolding.pnl,
            pnlPercent: currentHolding.pnlPercent,
            currentPrice: currentHolding.currentPrice
          }
        });
      }
    }
  });
  
  // Update tracking values
  previousPortfolioValue = currentValue;
  previousHoldings = { ...currentWallet.holdings };
  
  // Check milestones
  checkMilestones(currentValue, currentPnL);
};

// MILESTONE NOTIFICATIONS

const MILESTONES = [
  { value: 110000, message: 'You\'ve reached $110,000! 10% profit!' },
  { value: 125000, message: 'Amazing! $125,000 portfolio value! 25% gain!' },
  { value: 150000, message: '🎊 Incredible! You\'ve reached $150,000! 50% profit!' },
  { value: 200000, message: '🏆 Legendary! You\'ve DOUBLED your initial investment! $200,000!' },
  { value: 250000, message: '💎 Diamond hands! $250,000 portfolio! 150% gain!' },
];

const achievedMilestones = new Set(
  JSON.parse(localStorage.getItem('plutus_milestones') || '[]')
);

const checkMilestones = (currentValue, currentPnL) => {
  MILESTONES.forEach(milestone => {
    if (currentValue >= milestone.value && !achievedMilestones.has(milestone.value)) {
      achievedMilestones.add(milestone.value);
      localStorage.setItem('plutus_milestones', JSON.stringify([...achievedMilestones]));
      
      addNotification({
        type: NOTIFICATION_TYPES.MILESTONE,
        title: '🎯 Milestone Achieved!',
        message: milestone.message,
        data: {
          milestone: milestone.value,
          currentValue,
          currentPnL
        }
      });
    }
  });
};

// POSITION PROFIT/LOSS ALERTS

// Alert when a specific holding reaches profit/loss threshold
export const checkHoldingThreshold = (symbol, currentPnLPercent, threshold = 5) => {
  const key = `alert_${symbol}_${Math.floor(Math.abs(currentPnLPercent) / threshold) * threshold}`;
  
  // Check if we've already alerted for this threshold
  const alerted = sessionStorage.getItem(key);
  if (alerted) return;
  
  if (currentPnLPercent >= threshold) {
    sessionStorage.setItem(key, 'true');
    addNotification({
      type: NOTIFICATION_TYPES.PROFIT,
      title: `${symbol} Profit Target!`,
      message: `${symbol} has gained ${currentPnLPercent.toFixed(2)}%! Consider taking profits.`,
      data: {
        symbol,
        pnlPercent: currentPnLPercent
      }
    });
  } else if (currentPnLPercent <= -threshold) {
    sessionStorage.setItem(key, 'true');
    addNotification({
      type: NOTIFICATION_TYPES.LOSS,
      title: `${symbol} Loss Alert`,
      message: `${symbol} is down ${Math.abs(currentPnLPercent).toFixed(2)}%. Consider your stop-loss strategy.`,
      data: {
        symbol,
        pnlPercent: currentPnLPercent
      }
    });
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  getUnreadCount,
  notifyTradeExecution,
  checkPortfolioChanges,
  checkHoldingThreshold,
  NOTIFICATION_TYPES
};
