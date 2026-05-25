import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import RocketLoader from '@/components/RocketLoader';

export default function SignIn() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Show loader for 1.5 seconds when entering the page
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return <RocketLoader />;
  }

  const isEmail = (value) => {
    return value.includes('@');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(emailOrUsername, password);
      
      if (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = 'Failed to sign in';
        
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = isEmail(emailOrUsername) 
            ? 'Invalid email or password' 
            : 'Invalid username or password';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: errorMessage,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your account.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get theme-appropriate colors
  const getThemeColors = () => {
    if (theme === 'dark') {
      return {
        bg: 'bg-black',
        cardBg: 'bg-zinc-900 border-red-900/30',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-400',
        textMuted: 'text-gray-500',
        inputBg: 'bg-zinc-800 border-red-900/30 text-white',
        buttonPrimary: 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white',
        link: 'text-orange-400 hover:text-orange-300'
      };
    } else if (theme === 'gradient') {
      return {
        bg: 'bg-transparent',
        cardBg: 'bg-white/10 backdrop-blur-md border-white/20',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-800',
        textMuted: 'text-gray-700',
        inputBg: 'bg-white/10 border-white/20 text-gray-900 placeholder:text-gray-700',
        buttonPrimary: 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-gray-900 border border-white/30',
        link: 'text-gray-900 hover:text-gray-700'
      };
    } else {
      // Light theme
      return {
        bg: 'bg-gray-50',
        cardBg: 'bg-white border-gray-200',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        inputBg: 'bg-white border-gray-300 text-gray-900',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        link: 'text-blue-600 hover:text-blue-500'
      };
    }
  };

  const colors = getThemeColors();

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      theme === 'dark' 
        ? 'bg-black'
        : theme === 'gradient'
        ? 'bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a3a52]'
        : 'bg-gray-50'
    )}>
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className={cn("flex items-center gap-2", colors.textSecondary)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={cn(
          "p-8 rounded-2xl shadow-xl border",
          colors.cardBg
        )}>
          <div className="text-center mb-8">
            <img 
              src="https://horizons-cdn.hostinger.com/e58ae648-723a-4420-8647-7c7ee1e194f2/f42229095b1d7daa1fdbcebdf348f39f.gif" 
              alt="Plutus Logo" 
              className="h-16 w-16 mx-auto mb-4"
            />
            <h2 className={cn("text-3xl font-bold", colors.textPrimary)}>Welcome Back</h2>
            <p className={cn("mt-2", colors.textSecondary)}>
              Sign in to your Plutus account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="emailOrUsername" className={colors.textPrimary}>
                Email or Username
              </Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="Enter email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className={cn("mt-1", colors.inputBg)}
                disabled={loading}
              />
              <p className={cn("text-xs mt-1", colors.textMuted)}>
                You can sign in with either your email or username
              </p>
            </div>

            <div>
              <Label htmlFor="password" className={colors.textPrimary}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn("mt-1", colors.inputBg)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className={cn("w-full", colors.buttonPrimary)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={cn("w-full border-t", theme === 'dark' ? 'border-zinc-800' : 'border-gray-300')} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={cn("px-2", theme === 'dark' ? 'bg-zinc-900 text-gray-500' : 'bg-white text-gray-500')}>
                  Or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/markets')}
              className={cn(
                "w-full",
                theme === 'dark'
                  ? 'border-red-900/30 text-white hover:bg-zinc-800'
                  : theme === 'gradient'
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-900 hover:bg-gray-50'
              )}
            >
              <Eye className="mr-2 h-4 w-4" />
              Continue as Guest
            </Button>

            <p className={cn("text-sm text-center", colors.textSecondary)}>
              Don't have an account?{' '}
              <Link to="/signup" className={colors.link}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
