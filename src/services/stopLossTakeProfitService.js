import { sellAsset } from './walletService';

const ORDERS_KEY = 'plutus_auto_orders';

export const getAutoOrders = () => {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading auto orders:', error);
    return [];
  }
};

const saveAutoOrders = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const addStopLoss = (symbol, name, quantity, stopPrice) => {
  const orders = getAutoOrders();
  
  const newOrder = {
    id: Date.now().toString(),
    type: 'STOP_LOSS',
    symbol,
    name,
    quantity,
    stopPrice,
    executed: false,
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  saveAutoOrders(orders);
  
  return newOrder;
};

// Add take-profit order
export const addTakeProfit = (symbol, name, quantity, targetPrice) => {
  const orders = getAutoOrders();
  
  const newOrder = {
    id: Date.now().toString(),
    type: 'TAKE_PROFIT',
    symbol,
    name,
    quantity,
    targetPrice,
    executed: false,
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  saveAutoOrders(orders);
  
  return newOrder;
};

// Remove auto order
export const removeAutoOrder = (orderId) => {
  const orders = getAutoOrders();
  const filtered = orders.filter(order => order.id !== orderId);
  saveAutoOrders(filtered);
};

// Check and execute auto orders
export const checkAutoOrders = (marketData, wallet) => {
  const orders = getAutoOrders();
  let executedOrders = [];
  
  orders.forEach(order => {
    if (order.executed) return;
    
    // Check if user still has the holding
    if (!wallet.holdings[order.symbol]) {
      order.executed = true;
      order.executedAt = new Date().toISOString();
      order.executionReason = 'Position already closed';
      return;
    }
    
    const holding = wallet.holdings[order.symbol];
    const asset = marketData.find(a => a.symbol === order.symbol);
    if (!asset) return;
    
    const currentPrice = asset.price;
    let shouldExecute = false;
    let reason = '';
    
    // Stop-Loss: Sell if price drops to/below stop price
    if (order.type === 'STOP_LOSS' && currentPrice <= order.stopPrice) {
      shouldExecute = true;
      reason = `Stop-loss triggered at $${currentPrice.toFixed(2)}`;
    }
    
    // Take-Profit: Sell if price reaches/exceeds target price
    if (order.type === 'TAKE_PROFIT' && currentPrice >= order.targetPrice) {
      shouldExecute = true;
      reason = `Take-profit triggered at $${currentPrice.toFixed(2)}`;
    }
    
    if (shouldExecute) {
      // Execute the sell order
      const quantity = Math.min(order.quantity, holding.quantity);
      const result = sellAsset(order.symbol, order.name, quantity, currentPrice);
      
      if (result.success) {
        order.executed = true;
        order.executedAt = new Date().toISOString();
        order.executionPrice = currentPrice;
        order.executionReason = reason;
        order.pnl = result.transaction.pnl;
        order.pnlPercent = result.transaction.pnlPercent;
        
        executedOrders.push(order);
        
        // Send notification
        const event = new CustomEvent('autoOrderExecuted', {
          detail: order
        });
        window.dispatchEvent(event);
      }
    }
  });
  
  if (executedOrders.length > 0) {
    saveAutoOrders(orders);
  }
  
  return executedOrders;
};

// Clear executed orders
export const clearExecutedOrders = () => {
  const orders = getAutoOrders();
  const active = orders.filter(order => !order.executed);
  saveAutoOrders(active);
};

// Get active orders for a symbol
export const getActiveOrdersForSymbol = (symbol) => {
  const orders = getAutoOrders();
  return orders.filter(order => order.symbol === symbol && !order.executed);
};

export default {
  getAutoOrders,
  addStopLoss,
  addTakeProfit,
  removeAutoOrder,
  checkAutoOrders,
  clearExecutedOrders,
  getActiveOrdersForSymbol
};
