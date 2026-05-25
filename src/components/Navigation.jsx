import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart2, Repeat, Radio, BookOpen, User, LifeBuoy, LogIn, LogOut, ChevronDown, Newspaper, MessageSquare, Bell, History } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';
import { getUnreadCount } from '@/services/notificationService';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Markets', href: '/markets', icon: BarChart2 },
  { name: 'Trade', href: '/trade', icon: Repeat },
  { name: 'History', href: '/history', icon: History },
  { 
    name: 'Hub', 
    href: '/hub', 
    icon: Radio,
    hasDropdown: true,
    subItems: [
      { name: 'Market News', href: '/hub/news', icon: Newspaper },
      { name: 'Community', href: '/hub/community', icon: MessageSquare }
    ]
  },
  { name: 'Education', href: '/education', icon: BookOpen },
  { name: 'Support', href: '/support', icon: LifeBuoy },
];

const Navigation = ({ showTicker }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { session, signOut } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Update unread count
    const updateUnreadCount = () => {
      setUnreadCount(getUnreadCount());
    };
    
    updateUnreadCount();
    
    // Listen for new notifications
    window.addEventListener('plutusNotification', updateUnreadCount);
    
    // Update every 5 seconds
    const interval = setInterval(updateUnreadCount, 5000);
    
    return () => {
      window.removeEventListener('plutusNotification', updateUnreadCount);
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    }
  };

  const MobileNavLink = ({ href, children, icon: Icon, onClick }) => (
    <NavLink
      to={href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center p-4 text-lg font-semibold transition-colors duration-200",
          theme === 'dark'
            ? isActive
              ? 'text-orange-400 bg-red-900/30'
              : 'text-gray-300 hover:bg-red-900/20'
            : theme === 'gradient'
            ? isActive
              ? 'text-white bg-blue-600 shadow-lg'
              : 'text-gray-700 hover:bg-white/20'
            : isActive
            ? 'text-blue-500 bg-blue-50'
            : 'text-gray-700 hover:bg-gray-100'
        )
      }
    >
      <Icon className="w-6 h-6 mr-4" />
      {children}
    </NavLink>
  );

  return (
    <header className={cn(
      "fixed left-0 right-0 z-50 backdrop-blur-lg shadow-sm",
      showTicker ? "top-12" : "top-0",
      theme === 'dark' 
        ? 'bg-black/90 border-b border-red-900/20' 
        : theme === 'gradient'
        ? 'bg-white/20 border-b-2 border-black/30 shadow-lg shadow-black/10'
        : 'bg-white/80'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to={session ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <img src="https://horizons-cdn.hostinger.com/e58ae648-723a-4420-8647-7c7ee1e194f2/f42229095b1d7daa1fdbcebdf348f39f.gif" alt="Plutus Logo" className="h-9 w-9" />
              <span className={cn(
                "text-2xl font-bold tracking-tighter",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Plutus</span>
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                item.hasDropdown ? (
                  <div 
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => setHubDropdownOpen(true)}
                    onMouseLeave={() => setHubDropdownOpen(false)}
                  >
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1",
                          theme === 'dark'
                            ? isActive 
                              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30'
                              : 'text-gray-300 hover:bg-red-900/20 hover:text-white'
                            : theme === 'gradient'
                            ? isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-700'
                              : 'text-gray-700 hover:bg-white/20 backdrop-blur-sm'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        )
                      }
                    >
                      {item.name}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        hubDropdownOpen && "rotate-180"
                      )} />
                    </NavLink>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {hubDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "absolute top-full left-0 mt-2 w-48 rounded-lg shadow-xl overflow-hidden",
                            theme === 'dark'
                              ? 'bg-zinc-900 border border-red-900/30'
                              : theme === 'gradient'
                              ? 'bg-white/90 backdrop-blur-md border border-black/10'
                              : 'bg-white border border-gray-200'
                          )}
                        >
                          {item.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.name}
                              to={subItem.href}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                                  theme === 'dark'
                                    ? isActive
                                      ? 'bg-red-900/30 text-orange-400'
                                      : 'text-gray-300 hover:bg-red-900/20'
                                    : theme === 'gradient'
                                    ? isActive
                                      ? 'bg-blue-100 text-blue-600'
                                      : 'text-gray-700 hover:bg-white/60'
                                    : isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                                )
                              }
                            >
                              <subItem.icon className="w-4 h-4" />
                              {subItem.name}
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                        theme === 'dark'
                          ? isActive 
                            ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30'
                            : 'text-gray-300 hover:bg-red-900/20 hover:text-white'
                          : theme === 'gradient'
                          ? isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-700'
                            : 'text-gray-700 hover:bg-white/20 backdrop-blur-sm'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )
                    }
                  >
                    {item.name}
                  </NavLink>
                )
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
             {session ? (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <button
                  onClick={() => setNotificationOpen(true)}
                  className={cn(
                    "relative p-2 rounded-full transition-colors",
                    theme === 'dark' ? 'hover:bg-white/10' : theme === 'gradient' ? 'hover:bg-white/20' : 'hover:bg-gray-100'
                  )}
                >
                  <Bell className={cn(
                    "w-5 h-5",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-gray-900' : 'text-gray-900'
                  )} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <NavLink to="/profile" className={cn(
                  "flex items-center text-sm font-medium",
                  theme === 'dark' ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-blue-600'
                )}>
                  <User className="w-5 h-5 mr-1" /> Profile
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "flex items-center text-sm font-medium",
                    theme === 'dark' ? 'text-gray-300 hover:text-red-400' : 'text-gray-700 hover:text-red-600'
                  )}
                >
                  <LogOut className="w-5 h-5 mr-1" /> Sign Out
                </button>
              </div>
            ) : (
              <NavLink
                to="/"
                className={cn(
                  "flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md",
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/50'
                    : theme === 'gradient'
                    ? 'bg-white/30 backdrop-blur-md text-gray-900 border border-white/40 hover:bg-white/40'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                )}
              >
                <LogIn className="w-5 h-5 mr-2" /> Sign In
              </NavLink>
            )}
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-md focus:outline-none",
                theme === 'dark' ? 'text-gray-300 hover:bg-red-900/20' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className={cn(
              "px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t",
              theme === 'dark' ? 'border-red-900/20' : 'border-gray-200'
            )}>
              {navItems.map((item) => (
                item.hasDropdown ? (
                  <div key={item.name}>
                    <MobileNavLink href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                      {item.name}
                    </MobileNavLink>
                    <div className="pl-8 space-y-1">
                      {item.subItems.map((subItem) => (
                        <MobileNavLink 
                          key={subItem.name} 
                          href={subItem.href} 
                          icon={subItem.icon} 
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.name}
                        </MobileNavLink>
                      ))}
                    </div>
                  </div>
                ) : (
                  <MobileNavLink key={item.name} href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                    {item.name}
                  </MobileNavLink>
                )
              ))}
              <div className={cn(
                "border-t my-2",
                theme === 'dark' ? 'border-red-900/20' : 'border-gray-200'
              )} />
               {session ? (
                <>
                  <MobileNavLink href="/profile" icon={User} onClick={() => setIsOpen(false)}>
                    Profile
                  </MobileNavLink>
                  <a
                    onClick={() => { handleSignOut(); setIsOpen(false); }}
                    className={cn(
                      "flex items-center p-4 text-lg font-semibold cursor-pointer",
                      theme === 'dark' ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                    )}
                  >
                    <LogOut className="w-6 h-6 mr-4" />
                    Sign Out
                  </a>
                </>
              ) : (
                <MobileNavLink href="/" icon={LogIn} onClick={() => setIsOpen(false)}>
                  Sign In
                </MobileNavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
    </header>
  );
};

export default Navigation;
