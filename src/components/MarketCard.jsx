import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MarketCard = ({ market, index }) => {
  const { toast } = useToast();

  const handleTrade = () => {
    toast({
      title: "🚧 Trading Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{market.symbol}</h3>
            <span className="text-sm text-gray-600">{market.name}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-gray-900">
              ${market.price.toFixed(2)}
            </span>
            <div className={`flex items-center space-x-1 ${market.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {market.change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-semibold">
                {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Volume: {market.volume}</p>
        </div>
        <Button
          onClick={handleTrade}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
        >
          Trade
        </Button>
      </div>
    </motion.div>
  );
};

export default MarketCard;