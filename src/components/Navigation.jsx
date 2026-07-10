import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart2, Repeat, Radio, BookOpen, User, LifeBuoy, LogIn, LogOut, ChevronDown, Newspaper, MessageSquare, Bell, History } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
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

// Clean monogram logo — replaces the expired external CDN gif
const PlutusMark = () => (
  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
    <span className="text-white font-bold text-lg leading-none">P</span>
  </div>
);

const navLinkClass = (isActive) =>
  cn(
    "px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
    isActive
      ? 'text-blue-600 bg-blue-50'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  );

const Navigation = ({ showTicker }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const updateUnreadCount = () => {
      setUnreadCount(getUnreadCount());
    };

    updateUnreadCount();
    window.addEventListener('plutusNotification', updateUnreadCount);
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
          "flex items-center p-4 text-base font-medium rounded-lg transition-colors duration-150",
          isActive
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-700 hover:bg-gray-100'
        )
      }
    >
      <Icon className="w-5 h-5 mr-4" />
      {children}
    </NavLink>
  );

  return (
    <header className={cn(
      "fixed left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200",
      showTicker ? "top-12" : "top-0"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to={session ? "/dashboard" : "/"} className="flex items-center space-x-2.5">
              <PlutusMark />
              <span className="text-xl font-bold tracking-tight text-gray-900">Plutus</span>
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
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
                        cn(navLinkClass(isActive), "flex items-center gap-1")
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
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-48 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-lg"
                        >
                          {item.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.name}
                              to={subItem.href}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                                  isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
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
                    className={({ isActive }) => navLinkClass(isActive)}
                  >
                    {item.name}
                  </NavLink>
                )
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            {session ? (
              <div className="flex items-center space-x-2">
                {/* Notification Bell */}
                <button
                  onClick={() => setNotificationOpen(true)}
                  className="relative p-2 rounded-full transition-colors hover:bg-gray-100"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <NavLink
                  to="/profile"
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4 mr-1.5" /> Profile
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
                </button>
              </div>
            ) : (
              <NavLink
                to="/"
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" /> Sign In
              </NavLink>
            )}
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
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
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 bg-white">
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
              <div className="border-t border-gray-200 my-2" />
              {session ? (
                <>
                  <MobileNavLink href="/profile" icon={User} onClick={() => setIsOpen(false)}>
                    Profile
                  </MobileNavLink>
                  <a
                    onClick={() => { handleSignOut(); setIsOpen(false); }}
                    className="flex items-center p-4 text-base font-medium rounded-lg cursor-pointer text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-4" />
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
