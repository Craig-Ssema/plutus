import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCircle, MessageSquare, UserPlus, UserCheck, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * UserProfileCard — modal profile view with Follow + Message actions.
 * Props:
 *   userId   – profile to display
 *   onClose  – close the card
 *   onMessage(profile) – open a DM with this user
 */
const UserProfileCard = ({ userId, onClose, onMessage }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    const [{ data: p }, { count: followerCount }, { count: followingCount }, { data: mine }] = await Promise.all([
      supabase.from('profiles').select('id, username, full_name, avatar_url, bio, created_at').eq('id', userId).single(),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      user
        ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setProfile(p);
    setFollowers(followerCount || 0);
    setFollowing(followingCount || 0);
    setIsFollowing(!!mine);
    setLoading(false);
  }, [userId, user]);

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId, loadProfile]);

  const handleFollowToggle = async () => {
    if (!user || busy) return;
    setBusy(true);

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (!error) {
        setIsFollowing(false);
        setFollowers((n) => Math.max(0, n - 1));
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: userId });

      if (!error) {
        setIsFollowing(true);
        setFollowers((n) => n + 1);
      } else {
        toast({
          title: "Couldn't follow",
          description: error.message,
          variant: "destructive"
        });
      }
    }
    setBusy(false);
  };

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const isSelf = user?.id === userId;

  return (
    <AnimatePresence>
      {userId && (
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
            {/* Header band */}
            <div className="h-20 bg-blue-600 relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="-mt-10 mb-3 relative z-10">
                <div className="w-20 h-20 rounded-full ring-4 ring-white bg-gray-100 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-10 h-10 text-gray-400" />
                  )}
                </div>
              </div>

              {loading ? (
                <div className="py-6 text-sm text-gray-400">Loading profile...</div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    {profile?.username || 'Anonymous'}
                  </h3>
                  {profile?.full_name && (
                    <p className="text-sm text-gray-500">{profile.full_name}</p>
                  )}

                  {profile?.bio && (
                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">{profile.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="text-gray-900">
                      <strong className="font-semibold tnum">{followers}</strong>{' '}
                      <span className="text-gray-500">Followers</span>
                    </span>
                    <span className="text-gray-900">
                      <strong className="font-semibold tnum">{following}</strong>{' '}
                      <span className="text-gray-500">Following</span>
                    </span>
                  </div>

                  {joinedDate && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Joined {joinedDate}
                    </p>
                  )}

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex gap-2 mt-5">
                      <Button
                        onClick={handleFollowToggle}
                        disabled={busy || !user}
                        className={cn(
                          "flex-1 rounded-lg font-semibold",
                          isFollowing
                            ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                      >
                        {isFollowing ? (
                          <><UserCheck className="w-4 h-4 mr-1.5" /> Following</>
                        ) : (
                          <><UserPlus className="w-4 h-4 mr-1.5" /> Follow</>
                        )}
                      </Button>
                      <Button
                        onClick={() => onMessage?.(profile)}
                        variant="outline"
                        className="flex-1 rounded-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5" /> Message
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileCard;
