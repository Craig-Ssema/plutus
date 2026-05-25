import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, ExternalLink, RefreshCw, Filter, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchFinancialNews } from '@/services/newsService';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();

  const categories = [
    { id: 'all', name: 'All Markets', query: 'stock market cryptocurrency latest news' },
    { id: 'stocks', name: 'Stocks', query: 'stock market news today' },
    { id: 'crypto', name: 'Crypto', query: 'cryptocurrency bitcoin ethereum news' },
    { id: 'forex', name: 'Forex', query: 'forex currency trading news' },
  ];

  const fetchNews = async (searchTerm = null) => {
    setLoading(true);
    try {
      const articles = await fetchFinancialNews(category, searchTerm);
      setNews(articles);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchNews(searchQuery);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className={cn(
        "p-6 rounded-xl mb-6",
        theme === 'dark'
          ? 'bg-zinc-900 border border-red-900/30'
          : theme === 'gradient'
          ? 'bg-white/20 backdrop-blur-md border border-white/30'
          : 'bg-white border border-gray-200 shadow-sm'
      )}>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )} />
            <Input
              type="text"
              placeholder="Search financial news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            type="submit"
            className={cn(
              theme === 'dark'
                ? 'bg-gradient-to-r from-red-600 to-orange-500'
                : theme === 'gradient'
                ? 'bg-white/30 backdrop-blur-md border border-white/40'
                : ''
            )}
          >
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNews()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </form>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                category === cat.id
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                    : theme === 'gradient'
                    ? 'bg-white/40 backdrop-blur-md text-gray-900 border border-white/40'
                    : 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-red-900/20'
                  : theme === 'gradient'
                  ? 'bg-white/10 text-gray-700 hover:bg-white/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={cn(
                "p-6 rounded-xl animate-pulse",
                theme === 'dark'
                  ? 'bg-zinc-900'
                  : theme === 'gradient'
                  ? 'bg-white/20 backdrop-blur-md'
                  : 'bg-white'
              )}
            >
              <div className={cn(
                "h-4 rounded mb-4",
                theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
              )} />
              <div className={cn(
                "h-3 rounded mb-2",
                theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
              )} />
              <div className={cn(
                "h-3 rounded w-2/3",
                theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
              )} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article, index) => (
            <motion.a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer",
                theme === 'dark'
                  ? 'bg-zinc-900 border border-red-900/30 hover:border-orange-500/50 hover:shadow-xl hover:shadow-red-500/20'
                  : theme === 'gradient'
                  ? 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:shadow-xl'
                  : 'bg-white border border-gray-200 hover:shadow-xl hover:border-blue-300'
              )}
            >
              {/* Sentiment Badge */}
              <div className="flex items-center justify-between mb-3">
                {article.sentiment === 'positive' ? (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">Bullish</span>
                  </div>
                ) : article.sentiment === 'negative' ? (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-xs font-medium">Bearish</span>
                  </div>
                ) : (
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    theme === 'dark' ? 'bg-zinc-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  )}>
                    Neutral
                  </div>
                )}
                <ExternalLink className={cn(
                  "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )} />
              </div>

              {/* Title */}
              <h3 className={cn(
                "font-bold text-lg mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text transition-all",
                theme === 'dark'
                  ? 'text-white group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-orange-400'
                  : 'text-gray-900'
              )}>
                {article.title}
              </h3>

              {/* Description */}
              <p className={cn(
                "text-sm mb-4 line-clamp-3",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {article.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-medium",
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                )}>
                  {article.source || 'Financial News'}
                </span>
                <div className="flex items-center space-x-1">
                  <Clock className={cn(
                    "w-3 h-3",
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  )} />
                  <span className={cn(
                    "text-xs",
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
                  )}>
                    {getTimeAgo(article.published_at)}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && news.length === 0 && (
        <div className={cn(
          "text-center py-16 rounded-xl",
          theme === 'dark'
            ? 'bg-zinc-900 border border-red-900/30'
            : theme === 'gradient'
            ? 'bg-white/20 backdrop-blur-md border border-white/30'
            : 'bg-white border border-gray-200'
        )}>
          <Newspaper className={cn(
            "w-16 h-16 mx-auto mb-4",
            theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
          )} />
          <h3 className={cn(
            "text-xl font-bold mb-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            No news found
          </h3>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default News;
