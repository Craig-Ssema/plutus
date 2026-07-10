import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const MarketTicker = () => {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('symbol,price,change_24h_percent')
        .limit(10);
        
      if (error) {
        console.error("Error fetching tickers:", error);
      } else {
        setTickers(data);
      }
    };

    fetchInitialData();

    const channel = supabase.channel('market-ticker-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' }, (payload) => {
          setTickers(currentTickers => {
            const updatedTicker = {
                symbol: payload.new.symbol,
                price: payload.new.price,
                change_24h_percent: payload.new.change_24h_percent,
            };

            const tickerIndex = currentTickers.findIndex(t => t.symbol === updatedTicker.symbol);

            if (tickerIndex > -1) {
              const newTickers = [...currentTickers];
              newTickers[tickerIndex] = updatedTicker;
              return newTickers;
            } 
            return currentTickers;
          });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const duplicatedTickers = tickers.length > 0 ? [...tickers, ...tickers, ...tickers] : [];

  return (
    <div className="bg-white border-b border-gray-200 py-3 overflow-hidden fixed w-full top-0 left-0 z-[60] h-12 flex items-center">
      {tickers.length > 0 && (
        <motion.div
          animate={{ x: ['0%', '-100%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="flex space-x-12 whitespace-nowrap"
        >
          {duplicatedTickers.map((ticker, index) => (
            <div key={`${ticker.symbol}-${index}`} className="flex items-center space-x-3">
              <span className="font-semibold text-sm text-gray-900">{ticker.symbol}</span>
              <span className="text-gray-500 text-sm tabular-nums">${Number(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={(ticker.change_24h_percent >= 0 ? 'text-[#00A862]' : 'text-[#E5484D]') + ' text-sm font-medium tabular-nums'}>
                {ticker.change_24h_percent >= 0 ? '▲' : '▼'} {Math.abs(ticker.change_24h_percent).toFixed(2)}%
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MarketTicker;