import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Wifi, Globe } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

const ShareModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [localIp, setLocalIp] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Get current URL
      const currentUrl = window.location.origin;
      setShareUrl(currentUrl);
      
      // Generate QR code
      QRCode.toDataURL(currentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: theme === 'dark' ? '#ffffff' : '#000000',
          light: theme === 'dark' ? '#000000' : '#ffffff',
        }
      }).then(url => {
        setQrCodeUrl(url);
      });

      // Try to get local IP (this is approximate)
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setLocalIp('localhost:3003');
      } else {
        setLocalIp(hostname + ':' + window.location.port);
      }
    }
  }, [isOpen, theme]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-md rounded-2xl shadow-2xl",
            theme === 'dark'
              ? 'bg-zinc-900 border border-red-900/30'
              : theme === 'gradient'
              ? 'bg-white/90 backdrop-blur-lg border border-white/20'
              : 'bg-white'
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
              )}>
                <Share2 className={cn(
                  "w-5 h-5",
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h2 className={cn(
                  "text-xl font-bold",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Share Plutus
                </h2>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Invite others to trade
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "p-4 rounded-2xl mb-4",
                theme === 'dark' ? 'bg-white' : 'bg-gray-50'
              )}>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                  </div>
                )}
              </div>
              <p className={cn(
                "text-sm text-center",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Scan with your phone's camera
              </p>
            </div>

            {/* URL */}
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={cn(
                    "flex-1 px-4 py-3 rounded-lg text-sm font-mono",
                    theme === 'dark'
                      ? 'bg-zinc-800 text-white border border-red-900/30'
                      : 'bg-gray-50 text-gray-900 border border-gray-200'
                  )}
                />
                <button
                  onClick={copyToClipboard}
                  className={cn(
                    "px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className={cn(
              "rounded-lg p-4 space-y-4",
              theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50'
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg mt-0.5",
                  theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                )}>
                  <Wifi className={cn(
                    "w-4 h-4",
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-semibold mb-1",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Same Network Access
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    If you're running locally, others on your WiFi can access via:
                  </p>
                  <code className={cn(
                    "block mt-2 px-3 py-2 rounded text-xs font-mono",
                    theme === 'dark' ? 'bg-zinc-900 text-blue-400' : 'bg-white text-blue-600'
                  )}>
                    http://{localIp}
                  </code>
                  <p className={cn(
                    "text-xs mt-2",
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  )}>
                    Find your local IP: Open terminal and run <code className="px-1 py-0.5 rounded bg-black/20">ipconfig</code> (Windows) or <code className="px-1 py-0.5 rounded bg-black/20">ifconfig</code> (Mac/Linux)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg mt-0.5",
                  theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
                )}>
                  <Globe className={cn(
                    "w-4 h-4",
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-semibold mb-1",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    Internet Access
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Deploy to Vercel, Netlify, or GitHub Pages for global access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
