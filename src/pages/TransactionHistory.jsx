import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getTransactions } from '@/services/walletService';
import { TrendingUp, TrendingDown, DollarSign, Download, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TransactionHistory = () => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, buy, sell, profit, loss

  useEffect(() => {
    loadTransactions();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filterType]);

  const loadTransactions = () => {
    const txs = getTransactions(100); // Get last 100 transactions
    setTransactions(txs);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType === 'buy') {
      filtered = filtered.filter(tx => tx.type === 'BUY');
    } else if (filterType === 'sell') {
      filtered = filtered.filter(tx => tx.type === 'SELL');
    } else if (filterType === 'profit') {
      filtered = filtered.filter(tx => tx.type === 'SELL' && tx.pnl > 0);
    } else if (filterType === 'loss') {
      filtered = filtered.filter(tx => tx.type === 'SELL' && tx.pnl < 0);
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Symbol', 'Quantity', 'Price', 'Total', 'Fee', 'P/L', 'P/L %'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.timestamp).toLocaleString(),
      tx.type,
      tx.symbol,
      tx.quantity,
      tx.price.toFixed(2),
      tx.type === 'BUY' ? tx.totalCost.toFixed(2) : tx.netRevenue.toFixed(2),
      tx.fee ? tx.fee.toFixed(2) : '0.00',
      tx.pnl ? tx.pnl.toFixed(2) : 'N/A',
      tx.pnlPercent ? tx.pnlPercent.toFixed(2) + '%' : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plutus-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const stats = {
    totalTrades: transactions.length,
    buyCount: transactions.filter(tx => tx.type === 'BUY').length,
    sellCount: transactions.filter(tx => tx.type === 'SELL').length,
    profitableCount: transactions.filter(tx => tx.type === 'SELL' && tx.pnl > 0).length,
    totalFees: transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0)
  };

  return (
    <>
      <Helmet>
        <title>Transaction History - Plutus</title>
      </Helmet>

      <div className={cn(
        "pt-28 pb-12 px-4 min-h-screen",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? '' : 'bg-gray-50/50'
      )}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={cn(
              "text-4xl font-bold mb-2",
              theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
            )}>
              Transaction History
            </h1>
            <p className={cn(
              "text-lg",
              theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
            )}>
              View all your trades and transactions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl border",
                theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
                theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
                'bg-white border-gray-200'
              )}
            >
              <p className={cn(
                "text-sm mb-1",
                theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
              )}>Total Trades</p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
              )}>{stats.totalTrades}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "p-4 rounded-xl border",
                theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
                theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
                'bg-white border-gray-200'
              )}
            >
              <p className={cn(
                "text-sm mb-1",
                theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
              )}>Buys</p>
              <p className="text-2xl font-bold text-green-500">{stats.buyCount}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-4 rounded-xl border",
                theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
                theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
                'bg-white border-gray-200'
              )}
            >
              <p className={cn(
                "text-sm mb-1",
                theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
              )}>Sells</p>
              <p className="text-2xl font-bold text-red-500">{stats.sellCount}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "p-4 rounded-xl border",
                theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
                theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
                'bg-white border-gray-200'
              )}
            >
              <p className={cn(
                "text-sm mb-1",
                theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
              )}>Profitable</p>
              <p className="text-2xl font-bold text-green-500">
                {stats.sellCount > 0 ? Math.round((stats.profitableCount / stats.sellCount) * 100) : 0}%
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "p-4 rounded-xl border",
                theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
                theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
                'bg-white border-gray-200'
              )}
            >
              <p className={cn(
                "text-sm mb-1",
                theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-600'
              )}>Total Fees</p>
              <p className={cn(
                "text-2xl font-bold",
                theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
              )}>${stats.totalFees.toFixed(2)}</p>
            </motion.div>
          </div>

          {/* Filters */}
          <div className={cn(
            "p-6 rounded-xl border mb-6",
            theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
            theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
            'bg-white border-gray-200'
          )}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-400'
                )} />
                <input
                  type="text"
                  placeholder="Search by symbol or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400",
                    theme === 'dark' ? 'bg-zinc-800 border-red-900/30 text-white focus:ring-orange-500 placeholder:text-gray-500' :
                    theme === 'gradient' ? 'bg-white/10 text-white focus:ring-white/50 placeholder:text-gray-300' :
                    'bg-gray-100 border-transparent focus:ring-blue-500'
                  )}
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {['all', 'buy', 'sell', 'profit', 'loss'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterType(filter)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      filterType === filter
                        ? theme === 'dark' ? 'bg-red-600 text-white' :
                          theme === 'gradient' ? 'bg-white/30 text-white' :
                          'bg-blue-600 text-white'
                        : theme === 'dark' ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' :
                          theme === 'gradient' ? 'bg-white/10 text-gray-200 hover:bg-white/20' :
                          'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <Button
                onClick={exportToCSV}
                className={cn(
                  "flex items-center gap-2",
                  theme === 'dark' ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-blue-600'
                )}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className={cn(
            "rounded-xl border overflow-hidden",
            theme === 'dark' ? 'bg-zinc-900 border-red-900/30' :
            theme === 'gradient' ? 'bg-white/20 backdrop-blur-md border-white/30' :
            'bg-white border-gray-200'
          )}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={cn(
                  "border-b",
                  theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
                )}>
                  <tr className={cn(
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
                  )}>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Asset</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Quantity</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Fee</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Total</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <p className={cn(
                          "text-lg",
                          theme === 'dark' ? 'text-gray-300' : theme === 'gradient' ? 'text-gray-200' : 'text-gray-400'
                        )}>No transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          "transition-colors",
                          theme === 'dark' ? 'text-gray-200 hover:bg-zinc-800' : 
                          theme === 'gradient' ? 'text-white hover:bg-white/10' :
                          'text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        <td className="px-6 py-4 text-sm">{formatDate(tx.timestamp)}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                            tx.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          )}>
                            {tx.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold">{tx.symbol}</p>
                            <p className={cn(
                              "text-xs",
                              theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-300' : 'text-gray-500'
                            )}>{tx.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">{tx.quantity.toFixed(4)}</td>
                        <td className="px-6 py-4 text-right">${tx.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-orange-500">${(tx.fee || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-semibold">
                          ${tx.type === 'BUY' ? tx.totalCost?.toFixed(2) || tx.total.toFixed(2) : tx.netRevenue?.toFixed(2) || tx.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {tx.pnl !== undefined ? (
                            <div>
                              <p className={cn(
                                "font-semibold",
                                tx.pnl > 0 ? 'text-green-500' : 'text-red-500'
                              )}>
                                {tx.pnl > 0 ? '+' : ''}${tx.pnl.toFixed(2)}
                              </p>
                              <p className={cn(
                                "text-xs",
                                tx.pnl > 0 ? 'text-green-500' : 'text-red-500'
                              )}>
                                {tx.pnl > 0 ? '+' : ''}{tx.pnlPercent.toFixed(2)}%
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionHistory;
