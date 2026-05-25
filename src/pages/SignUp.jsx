import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp } from 'lucide-react';
import RocketLoader from '@/components/RocketLoader';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const { signUp } = useAuth();
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Your password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, { data: { username } });
    setLoading(false);
    if (!error) {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      navigate('/');
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - Plutus</title>
        <meta name="description" content="Create a new Plutus account to start trading." />
      </Helmet>
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? '' : 'bg-gray-50/50'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className={`p-8 rounded-2xl shadow-lg ${
            theme === 'dark' 
              ? 'bg-zinc-900 border border-red-900/30' 
              : theme === 'gradient'
              ? 'bg-white/20 backdrop-blur-xl border border-white/30'
              : 'bg-white border border-gray-100'
          }`}>
            <div className="flex justify-center items-center space-x-3 mb-8">
              <img src="https://horizons-cdn.hostinger.com/e58ae648-723a-4420-8647-7c7ee1e194f2/f42229095b1d7daa1fdbcebdf348f39f.gif" alt="Plutus Logo" className="h-9 w-9" />
              <span className={`text-3xl font-bold tracking-tighter ${
                theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-gray-900' : 'text-gray-900'
              }`}>Plutus</span>
            </div>
            <div className="text-center mb-8">
              <h1 className={`text-4xl font-bold tracking-tighter ${
                theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-gray-900' : 'text-gray-900'
              }`}>Create Account</h1>
              <p className={`mt-2 ${
                theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-800' : 'text-gray-500'
              }`}>Join today and start trading with confidence.</p>
            </div>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••• (at least 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit" className={`w-full font-semibold py-3 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-lg hover:shadow-red-500/50 text-white'
                  : theme === 'gradient'
                  ? 'bg-gray-900 hover:bg-gray-800 text-white border-0'
                  : ''
              }`} disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-gray-800' : 'text-gray-600'
              }`}>
                Already have an account?{' '}
                <Link to="/" className={`font-medium hover:underline ${
                  theme === 'dark' ? 'text-orange-400' : theme === 'gradient' ? 'text-gray-900' : 'text-blue-600'
                }`}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SignUp;