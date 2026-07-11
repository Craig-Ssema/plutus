import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Star, TrendingUp, AlertCircle, Send, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { id: 'general', name: 'General Chat', icon: Hash },
  { id: 'stocks', name: 'Stocks', icon: TrendingUp },
  { id: 'crypto', name: 'Crypto', icon: Star },
  { id: 'alerts', name: 'Trade Alerts', icon: AlertCircle },
];

/**
 * ShareTradeModal — post a transaction to a community channel as a trade card.
 * Props: open, onClose, trade (a wallet transaction object)
 */
const ShareTradeModal = ({ open, onClose, trade }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channel, setChannel] = useState('alerts');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  if (!trade) return null;

  const isSell = trade.type === 'SELL';
  const hasPnl = isSell && trade.pnl !== undefined && trade.pnl !== null;
  const pnlPositive = hasPnl && trade.pnl > 0;

  const fmt = (v) => "$" + Math.abs(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleShare = async () => {
    if (!user || busy) return;
    setBusy(true);

    const tradeData = {
      side: trade.type,
      symbol: trade.symbol,
      name: trade.name,
      quantity: trade.quantity,
      price: trade.price,
      pnl: hasPnl ? trade.pnl : null,
      pnlPercent: hasPnl ? trade.pnlPercent : null,
      timestamp: trade.timestamp,
    };

    const { error } = await supabase
      .from('community_messages')
      .insert({
        user_id: user.id,
        channel,
        message: comment.trim(),
        type: 'trade',
        trade_data: tradeData,
      });

    setBusy(false);

    if (error) {
      toast({ title: "Couldn't share trade", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Trade shared",
      description: `Posted to ${CHANNELS.find(c => c.id === channel)?.name}.`,
    });
    setComment('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Share trade</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Trade preview card */}
              <div className="plutus-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold",
                    isSell ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                  )}>
                    {isSell ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {trade.type}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{trade.symbol}</span>
                </div>
                <p className="text-sm text-gray-600 tnum">
                  {trade.quantity?.toFixed(4)} @ {fmt(trade.price)}
                </p>
                {hasPnl && (
                  <p className={cn("text-sm font-semibold mt-1 tnum", pnlPositive ? 'price-up' : 'price-down')}>
                    P/L: {pnlPositive ? '+' : '-'}{fmt(trade.pnl)} ({pnlPositive ? '+' : ''}{trade.pnlPercent?.toFixed(2)}%)
                  </p>
                )}
              </div>

              {/* Channel picker */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Post to</p>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setChannel(c.id)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-colors",
                        channel === c.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <c.icon className="w-4 h-4" /> {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Comment (optional)</p>
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Why did you make this trade?"
                  maxLength={280}
                />
              </div>

              <Button
                onClick={handleShare}
                disabled={busy}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {busy ? 'Sharing...' : 'Share to Community'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareTradeModal;
