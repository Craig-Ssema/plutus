import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import Markets from '@/pages/Markets';
import Trade from '@/pages/Trade';
import Education from '@/pages/Education';
import HubLanding from '@/pages/HubLanding';
import MarketNews from '@/pages/MarketNews';
import CommunityPage from '@/pages/CommunityPage';
import Profile from '@/pages/Profile';
import Support from '@/pages/Support';
import SignIn from '@/pages/SignIn';
import AccessibilityPanel from '@/components/AccessibilityPanel';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedGradientBackground from '@/components/AnimatedGradientBackground';
import { cn } from '@/lib/utils';
import MarketsGuest from './pages/MarketsGuest';
import TradeGuest from './pages/TradeGuest';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import MarketTicker from './components/MarketTicker';
import AdvancedChart from './pages/charts/AdvancedChart';
import WavyBackground from './components/WavyBackground';
import RocketLoader from './components/RocketLoader';
import NotificationToast from './components/NotificationToast';
import TransactionHistory from './pages/TransactionHistory';

const AppContent = () => {
  const { adhdFriendly, readingMask, seizureSafe } = useAccessibility();
  const { session, loading } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  const noNavRoutes = ['/', '/signup'];
  const showNav = !noNavRoutes.includes(location.pathname);
  const showTicker = location.pathname === '/dashboard';
  const [showLoader, setShowLoader] = React.useState(true);

  React.useEffect(() => {
    // Show loader for 2 seconds on initial load
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Achievement notifications
  React.useEffect(() => {
    const handleAchievement = (event) => {
      const achievement = event.detail;
      
      // Trigger confetti library if you have one, or just show toast
      toast({
        title: "🏆 Achievement Unlocked!",
        description: `${achievement.icon} ${achievement.title} - ${achievement.points} points earned!`,
        duration: 5000
      });
    };
    
    window.addEventListener('achievementUnlocked', handleAchievement);
    return () => window.removeEventListener('achievementUnlocked', handleAchievement);
  }, []);

  // Price alert notifications
  React.useEffect(() => {
    const handlePriceAlert = (event) => {
      const alert = event.detail;
      toast({
        title: "🔔 Price Alert Triggered!",
        description: `${alert.symbol} is now ${alert.direction} ${alert.targetPrice.toFixed(2)}! Current: ${alert.triggeredPrice.toFixed(2)}`,
        duration: 6000
      });
    };
    
    window.addEventListener('priceAlertTriggered', handlePriceAlert);
    return () => window.removeEventListener('priceAlertTriggered', handlePriceAlert);
  }, []);

  // Auto order execution notifications
  React.useEffect(() => {
    const handleAutoOrder = (event) => {
      const order = event.detail;
      const isProfitable = order.pnl > 0;
      
      toast({
        title: order.type === 'STOP_LOSS' ? '🛑 Stop-Loss Executed' : '🎯 Take-Profit Executed',
        description: `Sold ${order.quantity} ${order.symbol} at ${order.executionPrice.toFixed(2)}. P/L: ${isProfitable ? '+' : ''}${order.pnl.toFixed(2)}`,
        duration: 6000
      });
    };
    
    window.addEventListener('autoOrderExecuted', handleAutoOrder);
    return () => window.removeEventListener('autoOrderExecuted', handleAutoOrder);
  }, []);

  // Show rocket loader during initial load
  if (showLoader || loading) {
    return <RocketLoader />;
  }

  const isAuthenticated = !!session;

  return (
    <div className={cn(
      "min-h-screen relative",
      theme === 'dark' 
        ? 'bg-black' 
        : theme === 'gradient'
        ? 'bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a3a52]'
        : 'bg-white',
      { 'seizure-safe': seizureSafe }
    )}>
      {theme === 'light' && <WavyBackground />}
      {showTicker && <MarketTicker />}
      {showNav && <Navigation showTicker={showTicker} />}
      <main className={cn({ 'adhd-focus': adhdFriendly }, showTicker ? 'pt-16' : '')}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignIn />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignUp />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          
          {/* Allow guest access to Markets, Trade, and Hub pages */}
          <Route path="/markets" element={isAuthenticated ? <Markets /> : <MarketsGuest />} />
          <Route path="/trade" element={isAuthenticated ? <Trade /> : <TradeGuest />} />
          <Route path="/chart/:symbol" element={isAuthenticated ? <AdvancedChart /> : <Navigate to="/" />} />
          
          {/* Hub routes */}
          <Route path="/hub" element={<HubLanding />} />
          <Route path="/hub/news" element={<MarketNews />} />
          <Route path="/hub/community" element={<CommunityPage />} />
          
          <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
          <Route path="/education" element={<Education />} />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
      {readingMask.enabled && (
        <div 
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100]"
          style={{
            background: `linear-gradient(to bottom, 
              rgba(0,0,0,0.7) 0%, 
              rgba(0,0,0,0.7) ${readingMask.y - readingMask.height / 2}px, 
              transparent ${readingMask.y - readingMask.height / 2}px, 
              transparent ${readingMask.y + readingMask.height / 2}px, 
              rgba(0,0,0,0.7) ${readingMask.y + readingMask.height / 2}px, 
              rgba(0,0,0,0.7) 100%)`
          }}
        />
      )}
      <AccessibilityPanel />
      <Toaster />
      <NotificationToast />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
