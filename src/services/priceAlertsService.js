const ALERTS_KEY = 'plutus_price_alerts';

export const getPriceAlerts = () => {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading price alerts:', error);
    return [];
  }
};

const savePriceAlerts = (alerts) => {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
};

export const addPriceAlert = (symbol, targetPrice, direction, name) => {
  const alerts = getPriceAlerts();
  
  const newAlert = {
    id: Date.now().toString(),
    symbol,
    name,
    targetPrice,
    direction, // 'above' or 'below'
    triggered: false,
    createdAt: new Date().toISOString()
  };
  
  alerts.push(newAlert);
  savePriceAlerts(alerts);
  
  return newAlert;
};

export const removePriceAlert = (alertId) => {
  const alerts = getPriceAlerts();
  const filtered = alerts.filter(alert => alert.id !== alertId);
  savePriceAlerts(filtered);
};

export const checkPriceAlerts = (marketData) => {
  const alerts = getPriceAlerts();
  let triggeredAlerts = [];
  
  alerts.forEach(alert => {
    if (alert.triggered) return;
    
    const asset = marketData.find(a => a.symbol === alert.symbol);
    if (!asset) return;
    
    const currentPrice = asset.price;
    let shouldTrigger = false;
    
    if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }
    
    if (shouldTrigger) {
      alert.triggered = true;
      alert.triggeredAt = new Date().toISOString();
      alert.triggeredPrice = currentPrice;
      triggeredAlerts.push(alert);
      
      // Send notification
      const event = new CustomEvent('priceAlertTriggered', {
        detail: alert
      });
      window.dispatchEvent(event);
    }
  });
  
  if (triggeredAlerts.length > 0) {
    savePriceAlerts(alerts);
  }
  
  return triggeredAlerts;
};

// Clear triggered alerts
export const clearTriggeredAlerts = () => {
  const alerts = getPriceAlerts();
  const active = alerts.filter(alert => !alert.triggered);
  savePriceAlerts(active);
};

export default {
  getPriceAlerts,
  addPriceAlert,
  removePriceAlert,
  checkPriceAlerts,
  clearTriggeredAlerts
};
