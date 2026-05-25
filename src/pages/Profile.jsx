import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeSelector from '@/components/ThemeSelector';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  }
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const Profile = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatar_url, setAvatarUrl] = useState('');
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    async function getProfile() {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(`username, full_name, phone_number, avatar_url`)
        .eq('id', user.id)
        .single();

      if (!ignore) {
        if (error) {
          console.warn(error);
        } else if (data) {
          setUsername(data.username || '');
          setFullName(data.full_name || '');
          setPhoneNumber(data.phone_number || '');
          setAvatarUrl(data.avatar_url || '');
        }
      }

      setLoading(false);
    }

    getProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  async function updateProfile(event) {
    event.preventDefault();
    setLoading(true);

    const updates = {
      id: user.id,
      username,
      full_name: fullName,
      phone_number: phoneNumber,
      avatar_url,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    }
    setLoading(false);
  }

  const handlePhoneNumberChange = (e) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedPhoneNumber);
  };

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

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion.",
      });
      return;
    }

    setDeleting(true);

    try {
      // Delete all user-related data
      await supabase.from('community_messages').delete().eq('user_id', user.id);
      await supabase.from('direct_messages').delete().eq('sender_id', user.id);
      await supabase.from('direct_messages').delete().eq('receiver_id', user.id);
      await supabase.from('online_users').delete().eq('user_id', user.id);

      // Delete the account
      const { error } = await deleteAccount();

      if (error) {
        throw error;
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Navigate to home page
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile - Plutus</title>
        <meta name="description" content="Manage your Plutus account details and preferences." />
      </Helmet>
      <div className={cn(
        "min-h-screen pt-20",
        theme === 'dark' 
          ? 'bg-black' 
          : theme === 'gradient' 
          ? 'bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900' 
          : 'bg-gray-50/50'
      )}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl shadow-lg border overflow-hidden",
              theme === 'dark'
                ? 'bg-zinc-900 border-red-900/30'
                : theme === 'gradient'
                ? 'bg-white/20 backdrop-blur-md border-white/30'
                : 'bg-white border-gray-100'
            )}
          >
            <div className="p-8">
              <h1 className={cn(
                "text-3xl font-bold mb-2",
                theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-900'
              )}>Profile Settings</h1>
              <p className={cn(
                "mb-8",
                theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-500'
              )}>Manage your account settings and personal information.</p>
            </div>

            <form onSubmit={updateProfile}>
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-8 p-8 border-t",
                theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
              )}>
                <div className="md:col-span-1">
                  <h2 className={cn(
                    "text-lg font-semibold",
                    theme === 'dark' ? 'text-white' : theme === 'gradient' ? 'text-white' : 'text-gray-800'
                  )}>Profile Picture</h2>
                  <p className={cn(
                    "text-sm mt-1",
                    theme === 'dark' ? 'text-gray-400' : theme === 'gradient' ? 'text-white/70' : 'text-gray-500'
                  )}>Upload a new avatar.</p>
                  <div className="mt-6">
                    <Avatar
                      url={avatar_url}
                      size={120}
                      onUpload={(url) => {
                        setAvatarUrl(url);
                        const updates = {
                          id: user.id,
                          avatar_url: url,
                          updated_at: new Date(),
                        };
                        supabase.from('profiles').upsert(updates).then(({ error }) => {
                          if (error) {
                            toast({ variant: "destructive", title: "Avatar save failed", description: error.message });
                          }
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="text" value={user?.email} disabled className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      required
                      value={username || ''}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1"
                    />
                    <p className={cn(
                      "text-xs mt-1",
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      You can use this to sign in instead of your email
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName || ''}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="xxx-xxx-xxxx"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className={cn(
                "px-8 py-4 border-t flex justify-between items-center",
                theme === 'dark'
                  ? 'bg-zinc-800 border-red-900/30'
                  : 'bg-gray-50 border-gray-200'
              )}>
                <Button type="button" variant="destructive" onClick={handleSignOut} disabled={loading}>
                  Sign Out
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Profile'}
                </Button>
              </div>
            </form>

            {/* Theme Preferences Section */}
            <div className={cn(
              "p-8 border-t",
              theme === 'dark' ? 'border-red-900/30' : theme === 'light' ? 'border-gray-200' : 'border-white/30'
            )}>
              <ThemeSelector />
            </div>

            {/* Danger Zone - Delete Account */}
            <div className={cn(
              "p-8 border-t",
              theme === 'dark' ? 'border-red-900/30 bg-red-950/10' : 'border-red-200 bg-red-50/50'
            )}>
              <h2 className={cn(
                "text-lg font-semibold mb-2",
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}>Danger Zone</h2>
              <p className={cn(
                "text-sm mb-4",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="flex items-center gap-2"
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className={cn(
                  theme === 'dark' 
                    ? 'bg-zinc-900 border-red-900/30' 
                    : 'bg-white'
                )}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className={cn(
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className={cn(
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      This action cannot be undone. This will permanently delete your account,
                      remove all your data from our servers, including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Profile information</li>
                        <li>Community messages</li>
                        <li>Direct messages</li>
                        <li>All account data</li>
                      </ul>
                      <div className="mt-4">
                        <Label htmlFor="confirmDelete" className="text-sm font-semibold">
                          Type <span className="text-red-500">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="confirmDelete"
                          type="text"
                          value={confirmDeleteText}
                          onChange={(e) => setConfirmDeleteText(e.target.value)}
                          placeholder="DELETE"
                          className="mt-2"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmDeleteText('')}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={confirmDeleteText !== 'DELETE' || deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Profile;
