import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const OrderBook = ({ asset }) => {
  const { theme } = useTheme();
  // Handle null or undefined asset
  if (!asset || !asset.price) {
    return (
      <div className={cn(
        "rounded-2xl p-6 h-full flex flex-col items-center justify-center",
        theme === 'dark' ? 'bg-zinc-900' : theme === 'gradient' ? 'bg-white/10 backdrop-blur-md' : 'bg-white'
      )}>
        <p className={cn(
          theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-500'
        )}>No order book data available</p>
      </div>
    );
  }

  const basePrice = Number(asset.price) || 0;
  
  // Generate mock buy orders
  const buyOrders = Array.from({ length: 8 }, (_, i) => {
    const price = basePrice * (1 - (i + 1) * 0.0005);
    const amount = Math.random() * 2;
    return {
      price: price.toFixed(basePrice < 1 ? 6 : 2),
      amount: amount.toFixed(4),
      total: (price * amount).toFixed(2),
      depth: Math.random() * 100
    };
  }).sort((a, b) => b.price - a.price);

  // Generate mock sell orders
  const sellOrders = Array.from({ length: 8 }, (_, i) => {
    const price = basePrice * (1 + (i + 1) * 0.0005);
    const amount = Math.random() * 2;
    return {
      price: price.toFixed(basePrice < 1 ? 6 : 2),
      amount: amount.toFixed(4),
      total: (price * amount).toFixed(2),
      depth: Math.random() * 100
    };
  }).sort((a,b) => a.price - b.price);

  const OrderRow = ({ order, type }) => {
    const colorClass = type === 'sell' ? 'price-down' : 'price-up';
    const bgClass = type === 'sell' ? 'bg-red-500/10' : 'bg-emerald-500/10';
    return (
      <div className={cn(
        "grid grid-cols-3 text-sm px-2 py-1 relative transition-colors",
        theme === 'dark' ? 'hover:bg-zinc-800' : theme === 'gradient' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
      )}>
        <motion.div 
            className={`absolute top-0 right-0 h-full ${bgClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${order.depth}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <span className={`font-medium z-10 tnum ${colorClass}`}>{order.price}</span>
        <span className={cn(
          "text-right z-10",
          theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-700'
        )}>{order.amount}</span>
        <span className={cn(
          "text-right z-10",
          theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-600'
        )}>{order.total}</span>
      </div>
    );
  };

  const formatPrice = (price) => {
    const num = Number(price) || 0;
    if (num >= 1000) {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (num >= 1) {
      return `$${num.toFixed(2)}`;
    } else {
      return `$${num.toFixed(6)}`;
    }
  };

  const isPositive = (asset.change_24h_percent || 0) >= 0;
  
  return (
    <div className={cn(
      "rounded-2xl p-6 h-full flex flex-col",
      theme === 'dark' ? 'bg-zinc-900' : theme === 'gradient' ? 'bg-white/10 backdrop-blur-md' : 'bg-white'
    )}>
      <h3 className={cn(
        "text-xl font-bold mb-4",
        theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
      )}>Order Book</h3>
      <div className={cn(
        "grid grid-cols-3 text-xs font-semibold mb-2 px-2 border-b pb-2",
        theme === 'dark' ? 'text-gray-500 border-red-900/30' : theme === 'gradient' ? 'text-white/50 border-white/20' : 'text-gray-500 border-gray-200'
      )}>
        <span>Price (USD)</span>
        <span className="text-right">Amount ({asset.symbol})</span>
        <span className="text-right">Total</span>
      </div>
      <div className="space-y-0.5 overflow-hidden">
        {sellOrders.map((order, i) => (
          <OrderRow key={`sell-${i}`} order={order} type="sell" />
        ))}
      </div>
      <div className={cn(
        "py-2 my-1 text-center border-y",
        theme === 'dark' ? 'border-red-900/30' : theme === 'gradient' ? 'border-white/20' : 'border-gray-200'
      )}>
        <span className={`text-xl font-semibold tnum ${isPositive ? 'price-up' : 'price-down'}`}>
            {formatPrice(asset.price)}
        </span>
        <div className={cn(
          "text-xs mt-1",
          theme === 'dark' ? 'text-gray-500' : theme === 'gradient' ? 'text-white/50' : 'text-gray-500'
        )}>
          Spread: {(basePrice * 0.001).toFixed(basePrice < 1 ? 6 : 2)}
        </div>
      </div>
      <div className="space-y-0.5 overflow-hidden">
        {buyOrders.map((order, i) => (
          <OrderRow key={`buy-${i}`} order={order} type="buy" />
        ))}
      </div>
    </div>
  );
};

export default OrderBook;
