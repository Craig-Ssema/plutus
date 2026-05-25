import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TradingHistory = () => {
  const trades = [
    { date: '2025-11-10', symbol: 'AAPL', type: 'Buy', amount: 10, price: 178.45, profit: 234.50 },
    { date: '2025-11-09', symbol: 'GOOGL', type: 'Sell', amount: 5, price: 142.87, profit: -123.20 },
    { date: '2025-11-08', symbol: 'MSFT', type: 'Buy', amount: 8, price: 378.91, profit: 456.80 },
    { date: '2025-11-07', symbol: 'TSLA', type: 'Sell', amount: 15, price: 242.68, profit: 789.30 },
    { date: '2025-11-06', symbol: 'AMZN', type: 'Buy', amount: 12, price: 156.23, profit: -234.10 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Symbol</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-700">{trade.date}</td>
              <td className="py-3 px-4 text-sm font-semibold text-gray-900">{trade.symbol}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  trade.type === 'Buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {trade.type}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-right text-gray-700">{trade.amount}</td>
              <td className="py-3 px-4 text-sm text-right text-gray-700">${trade.price.toFixed(2)}</td>
              <td className="py-3 px-4 text-sm text-right">
                <div className={`flex items-center justify-end space-x-1 ${
                  trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trade.profit >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-semibold">
                    {trade.profit >= 0 ? '+' : ''}${Math.abs(trade.profit).toFixed(2)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradingHistory;