import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const MarketTableRow = ({ asset, index, isFavorited, onToggleFavorite }) => {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Generate or use sparkline data
  const chartData = useMemo(() => {
    // If we have sparkline data from the API (CoinGecko provides 7-day sparkline)
    if (asset?.sparkline && asset.sparkline.length > 0) {
      // Take last 30 data points or all available
      const dataPoints = asset.sparkline.slice(-30);
      return dataPoints.map((value, i) => ({
        name: `T-${dataPoints.length - i}`,
        uv: value
      }));
    }
    
    // Otherwise generate mock data based on current price
    const basePrice = Number(asset?.price || 0);
    return Array.from({ length: 30 }, (_, i) => ({
      name: `T-${30 - i}`,
      uv: basePrice + (Math.random() - 0.5) * (basePrice * 0.05) + Math.sin(i / 3) * (basePrice * 0.02),
    }));
  }, [asset]);

  if (!asset) {
    return null; 
  }

  const isPositive = asset.change_24h_percent >= 0;
  const strokeColor = isPositive ? '#19A05B' : '#DC2828';

  const handleRowClick = (e) => {
    if (e.target.closest('.favorite-star')) {
      e.stopPropagation();
      return;
    }
    navigate('/trade', { state: { asset: asset.symbol } });
  };

  // Professional light design system colors
  const getThemeColors = () => {
    return {
      rowHover: 'hover:bg-gray-50',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-500',
      textMuted: 'text-gray-300',
      starColor: 'text-amber-400',
      starHover: 'hover:text-amber-400',
      buttonBg: 'bg-white border border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600'
    };
  };

  const colors = getThemeColors();

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: isReady ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      layout
      onClick={handleRowClick}
      className={cn(
        "cursor-pointer transition-colors",
        colors.rowHover
      )}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          className={cn(
            "favorite-star transition-colors",
            isFavorited ? colors.starColor : colors.textMuted,
            colors.starHover
          )}
          onClick={() => onToggleFavorite(asset.id, isFavorited)}
        >
          <Star className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {asset.logo_url ? (
              <img className="h-10 w-10 rounded-full" src={asset.logo_url} alt={asset.name} />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-100 text-gray-600">
                {asset.symbol?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className={cn("text-sm font-medium", colors.textPrimary)}>
              {asset.symbol}
            </div>
            <div className={cn("text-sm", colors.textSecondary)}>
              {asset.name}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm font-semibold tnum", colors.textPrimary)}>
          ${formatPrice(asset.price)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn(
          "text-sm font-medium tnum",
          isPositive ? "price-up" : "price-down"
        )}>
          {isPositive ? '+' : ''}{asset.change_24h_percent?.toFixed(2)}%
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={cn(
          "font-medium tnum",
          asset.change_7d_percent >= 0
            ? "price-up"
            : "price-down"
        )}>
          {asset.change_7d_percent >= 0 ? '+' : ''}{asset.change_7d_percent?.toFixed(2)}%
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm tnum", colors.textPrimary)}>
          ${formatMarketCap(asset.market_cap_usd)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={cn("text-sm tnum", colors.textSecondary)}>
          ${formatMarketCap(asset.volume_24h)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-10 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="uv"
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#gradient-${asset.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className={cn(
          "px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors",
          colors.buttonBg
        )}>
          Trade
        </button>
      </td>
    </motion.tr>
  );
};

// Helper functions for formatting
const formatPrice = (price) => {
  const numPrice = Number(price);
  if (numPrice >= 1000) {
    return numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (numPrice >= 1) {
    return numPrice.toFixed(2);
  } else if (numPrice >= 0.01) {
    return numPrice.toFixed(4);
  } else {
    return numPrice.toFixed(8);
  }
};

const formatMarketCap = (value) => {
  const numValue = Number(value);
  if (numValue >= 1e12) {
    return `${(numValue / 1e12).toFixed(2)}T`;
  } else if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(2)}M`;
  } else if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(2)}K`;
  } else {
    return numValue.toFixed(2);
  }
};

export default MarketTableRow;
