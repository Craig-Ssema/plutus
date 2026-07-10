import React, { useState, useEffect, useRef } from 'react';
// Community hub — channels, groups, DMs
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, TrendingUp, AlertCircle, Smile, Image as ImageIcon, Hash, Star, MessageSquare, X, AtSign, UserCircle, Trash2, Plus, UserPlus, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import UserProfileCard from '@/components/hub/UserProfileCard';
import { CreateGroupModal, InviteMembersModal } from '@/components/hub/GroupModals';

const Community = () => {
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [allDirectConversations, setAllDirectConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDirectMessages, setShowDirectMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { session, user } = useAuth();
  const { toast } = useToast();

  const channels = [
    { id: 'general', name: 'General Chat', icon: Hash, description: 'General trading discussion' },
    { id: 'stocks', name: 'Stocks', icon: TrendingUp, description: 'Stock market talk' },
    { id: 'crypto', name: 'Crypto', icon: Star, description: 'Cryptocurrency discussions' },
    { id: 'alerts', name: 'Trade Alerts', icon: AlertCircle, description: 'Share trade setups' },
  ];

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, full_name')
      .eq('id', userId)
      .single();

    return data || { username: 'Anonymous', avatar_url: null, full_name: 'Anonymous User' };
  };

  // Load all users for @mentions and DM list
  useEffect(() => {
    const loadAllUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .neq('id', user?.id)
        .order('username', { ascending: true });

      if (!error && data) {
        setAllUsers(data);
      }
    };

    if (user) {
      loadAllUsers();
    }
  }, [user]);

  // Load direct message conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const userIds = new Set();
      data.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
      });

      const conversations = await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const profile = await fetchUserProfile(userId);

          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', userId)
            .eq('receiver_id', user.id)
            .eq('read', false);

          const { data: lastMsg } = await supabase
            .from('direct_messages')
            .select('message, created_at')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...profile,
            id: userId,
            unreadCount: count || 0,
            lastMessage: lastMsg?.message || '',
            lastMessageTime: lastMsg?.created_at,
          };
        })
      );

      setAllDirectConversations(conversations.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }));
    };

    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // ---- Groups: load my groups + pending invites ----
  const loadGroupsAndInvites = async () => {
    if (!user) return;

    const [{ data: memberships }, { data: invites }] = await Promise.all([
      supabase
        .from('group_members')
        .select('role, groups ( id, name, description, is_private, created_by )')
        .eq('user_id', user.id),
      supabase
        .from('group_invites')
        .select('id, group_id, inviter_id, groups ( name )')
        .eq('invitee_id', user.id)
        .eq('status', 'pending'),
    ]);

    setMyGroups((memberships || []).map(m => ({ ...m.groups, myRole: m.role })).filter(g => g.id));

    const invitesWithNames = await Promise.all(
      (invites || []).map(async (inv) => {
        const inviter = await fetchUserProfile(inv.inviter_id);
        return { ...inv, inviterName: inviter.username };
      })
    );
    setPendingInvites(invitesWithNames);
  };

  useEffect(() => {
    loadGroupsAndInvites();
    const interval = setInterval(loadGroupsAndInvites, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Load community messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('channel', selectedChannel)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const profile = await fetchUserProfile(msg.user_id);
          return {
            ...msg,
            user: profile.username,
            avatar: profile.avatar_url || '🧑',
            full_name: profile.full_name,
            user_id: msg.user_id,
            isOwn: msg.user_id === user?.id,
          };
        })
      );

      setMessages(messagesWithProfiles);
    };

    if (selectedChannel && !showDirectMessages && !selectedGroup) {
      loadMessages();
    }
  }, [selectedChannel, user, showDirectMessages, selectedGroup]);

  // Subscribe to real-time community messages
  useEffect(() => {
    if (!selectedChannel || showDirectMessages || selectedGroup) return;

    const channel = supabase
      .channel(`community:${selectedChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel=eq.${selectedChannel}`,
        },
        async (payload) => {
          const profile = await fetchUserProfile(payload.new.user_id);
          const newMsg = {
            ...payload.new,
            user: profile.username,
            avatar: profile.avatar_url || '🧑',
            full_name: profile.full_name,
            user_id: payload.new.user_id,
            isOwn: payload.new.user_id === user?.id,
          };
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel, user, showDirectMessages, selectedGroup]);

  // ---- Group messages: load + realtime ----
  useEffect(() => {
    if (!selectedGroup || !user) return;

    const loadGroupMessages = async () => {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', selectedGroup.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading group messages:', error);
        return;
      }

      const withProfiles = await Promise.all(
        data.map(async (msg) => {
          const profile = await fetchUserProfile(msg.user_id);
          return {
            ...msg,
            user: profile.username,
            avatar: profile.avatar_url || '🧑',
            isOwn: msg.user_id === user.id,
          };
        })
      );

      setMessages(withProfiles);
    };

    loadGroupMessages();

    const channel = supabase
      .channel(`group:${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroup.id}`,
        },
        async (payload) => {
          if (payload.new.user_id === user.id) return; // own messages added optimistically
          const profile = await fetchUserProfile(payload.new.user_id);
          setMessages((prev) => [...prev, {
            ...payload.new,
            user: profile.username,
            avatar: profile.avatar_url || '🧑',
            isOwn: false,
          }]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_messages',
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroup, user]);

  // Load online users
  useEffect(() => {
    const loadOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('online_users')
        .select('user_id')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error loading online users:', error);
        return;
      }

      const profiles = await Promise.all(
        data.map(async (u) => {
          const profile = await fetchUserProfile(u.user_id);
          return {
            ...profile,
            id: u.user_id,
          };
        })
      );

      setOnlineUsers(profiles.filter(p => p.id !== user?.id));
    };

    loadOnlineUsers();
    const interval = setInterval(loadOnlineUsers, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Update user's online status
  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async () => {
      await supabase
        .from('online_users')
        .upsert({ user_id: user.id, last_seen: new Date().toISOString() });
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // Load direct messages with selected user
  useEffect(() => {
    if (!selectedUser || !showDirectMessages) return;

    const loadDirectMessages = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading direct messages:', error);
        return;
      }

      const messagesWithFlags = data.map((msg) => ({
        ...msg,
        isOwn: msg.sender_id === user.id,
      }));

      setDirectMessages(messagesWithFlags);

      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', selectedUser.id)
        .eq('read', false);
    };

    loadDirectMessages();
  }, [selectedUser, user, showDirectMessages]);

  // Subscribe to real-time direct messages
  useEffect(() => {
    if (!user || !showDirectMessages || !selectedUser) return;

    const channel = supabase
      .channel(`direct:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.sender_id === selectedUser.id) {
            setDirectMessages((prev) => [...prev, { ...payload.new, isOwn: false }]);
            scrollToBottom();

            supabase
              .from('direct_messages')
              .update({ read: true })
              .eq('id', payload.new.id);
          } else {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          setDirectMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser, showDirectMessages]);

  // Count unread messages
  useEffect(() => {
    if (!user) return;

    const countUnread = async () => {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    countUnread();
  }, [user, directMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, directMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join the conversation.",
        variant: "destructive"
      });
      return;
    }

    if (!newMessage.trim()) return;

    if (showDirectMessages && selectedUser) {
      const { data: inserted, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setDirectMessages((prev) => [
        ...prev,
        { ...inserted, isOwn: true },
      ]);
    } else if (selectedGroup) {
      const { data: inserted, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: selectedGroup.id,
          user_id: user.id,
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setMessages((prev) => [...prev, { ...inserted, user: 'You', isOwn: true }]);
    } else {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          user_id: user.id,
          channel: selectedChannel,
          message: newMessage.trim(),
          type: 'message',
        });

      if (error) {
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
    }

    setNewMessage('');
  };

  // ---- Image sharing ----
  const handleImageButtonClick = () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share images.",
        variant: "destructive"
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so the same file can be picked again
    if (!file || !user) return;

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Please choose a JPG, PNG, GIF, or WebP image.",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Images must be under 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(path);

      const caption = newMessage.trim();

      if (showDirectMessages && selectedUser) {
        const { data: inserted, error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            receiver_id: selectedUser.id,
            message: caption,
            image_url: publicUrl,
          })
          .select()
          .single();
        if (error) throw error;

        setDirectMessages((prev) => [
          ...prev,
          { ...inserted, isOwn: true },
        ]);
      } else if (selectedGroup) {
        const { data: inserted, error } = await supabase
          .from('group_messages')
          .insert({
            group_id: selectedGroup.id,
            user_id: user.id,
            message: caption,
            image_url: publicUrl,
          })
          .select()
          .single();
        if (error) throw error;

        setMessages((prev) => [...prev, { ...inserted, user: 'You', isOwn: true }]);
      } else {
        const { error } = await supabase
          .from('community_messages')
          .insert({
            user_id: user.id,
            channel: selectedChannel,
            message: caption,
            type: 'message',
            image_url: publicUrl,
          });
        if (error) throw error;
      }

      setNewMessage('');
    } catch (err) {
      console.error('Image upload failed:', err);
      toast({
        title: "Upload failed",
        description: err.message || "Could not send the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // ---- Delete message ----
  const handleDeleteMessage = async (msg) => {
    if (!msg.isOwn) return;

    const table = showDirectMessages
      ? 'direct_messages'
      : selectedGroup
      ? 'group_messages'
      : 'community_messages';

    // Remove the image from storage first (if any)
    if (msg.image_url) {
      const marker = '/chat-images/';
      const idx = msg.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = decodeURIComponent(msg.image_url.slice(idx + marker.length));
        await supabase.storage.from('chat-images').remove([path]);
      }
    }

    if (msg.id) {
      const { error } = await supabase.from(table).delete().eq('id', msg.id);
      if (error) {
        toast({
          title: "Couldn't delete message",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
    }

    // Update local state immediately
    if (showDirectMessages) {
      setDirectMessages((prev) => prev.filter((m) => m !== msg && m.id !== msg.id));
    } else {
      setMessages((prev) => prev.filter((m) => m !== msg && m.id !== msg.id));
    }
  };

  const formatDay = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'trade':
        return 'bg-emerald-50 border-emerald-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'analysis':
        return 'bg-blue-50 border-blue-200';
      default:
        return '';
    }
  };

  // Clicking a user opens their profile card
  const handleUserClick = (clickedUserId) => {
    if (!clickedUserId || clickedUserId === user?.id) return;
    setProfileUserId(clickedUserId);
  };

  // Open a DM directly (sidebar conversations + profile card Message button)
  const openDirectMessage = async (target) => {
    const targetId = typeof target === 'string' ? target : target?.id;
    if (!targetId || targetId === user?.id) return;

    const profile = typeof target === 'object' && target?.username
      ? target
      : await fetchUserProfile(targetId);

    setSelectedUser({ ...profile, id: targetId });
    setShowDirectMessages(true);
    setDirectMessages([]);
    setProfileUserId(null);
  };

  // ---- Group selection + invites ----
  const selectGroup = (group) => {
    setSelectedGroup(group);
    setShowDirectMessages(false);
    setSelectedUser(null);
    setMessages([]);
  };

  const selectChannel = (channelId) => {
    setSelectedChannel(channelId);
    setSelectedGroup(null);
    setShowDirectMessages(false);
    setSelectedUser(null);
  };

  const handleInviteResponse = async (invite, accept) => {
    const { error } = await supabase
      .from('group_invites')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', invite.id);

    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }

    if (accept) {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({ group_id: invite.group_id, user_id: user.id, role: 'member' });

      if (joinError) {
        toast({ title: "Couldn't join group", description: joinError.message, variant: "destructive" });
        return;
      }
      toast({ title: "Joined group", description: `Welcome to ${invite.groups?.name}!` });
    }

    loadGroupsAndInvites();
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', selectedGroup.id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: "Couldn't leave group", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Left group", description: `You left ${selectedGroup.name}.` });
    selectChannel('general');
    loadGroupsAndInvites();
  };

  const handleBackToChannel = () => {
    setShowDirectMessages(false);
    setSelectedUser(null);
  };

  const Avatar = ({ url, size = 'w-9 h-9', fallback = <UserCircle className="w-5 h-5 text-gray-400" /> }) => (
    <div className={cn(size, "rounded-full flex items-center justify-center overflow-hidden bg-gray-100 flex-shrink-0")}>
      {url && typeof url === 'string' && url.startsWith('http') ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );

  const hasActiveConversation = (showDirectMessages && selectedUser) || !!selectedGroup || !!selectedChannel;
  const activeMessages = showDirectMessages ? directMessages : messages;

  const q = sidebarSearch.trim().toLowerCase();
  const visibleChannels = q ? channels.filter(c => c.name.toLowerCase().includes(q)) : channels;
  const visibleGroups = q ? myGroups.filter(g => (g.name || '').toLowerCase().includes(q)) : myGroups;
  const visibleConversations = q
    ? allDirectConversations.filter(c => (c.username || '').toLowerCase().includes(q))
    : allDirectConversations;
  const visibleOnline = q
    ? onlineUsers.filter(u => (u.username || '').toLowerCase().includes(q))
    : onlineUsers;

  return (
    <div className="plutus-card overflow-hidden flex h-[calc(100vh-180px)] min-h-[560px]">
      <UserProfileCard
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onMessage={(profile) => openDirectMessage(profile)}
      />
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(group) => {
          loadGroupsAndInvites();
          selectGroup({ ...group, myRole: 'owner' });
        }}
      />
      <InviteMembersModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        group={selectedGroup}
      />
      {/* Sidebar */}
      <aside className="w-64 xl:w-72 border-r border-gray-100 flex flex-col bg-gray-50/50 flex-shrink-0">
        {/* Sidebar search */}
        <div className="p-3 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Channels */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-2 text-gray-400">
              Channels
            </p>
            <div className="space-y-0.5">
              {visibleChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => selectChannel(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left text-sm",
                    selectedChannel === channel.id && !showDirectMessages && !selectedGroup
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                  )}
                >
                  <channel.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Invitations */}
          {pendingInvites.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-2 text-gray-400">
                Invitations
              </p>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-semibold">{invite.inviterName}</span> invited you to{' '}
                      <span className="font-semibold">{invite.groups?.name}</span>
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleInviteResponse(invite, true)}
                        className="flex-1 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleInviteResponse(invite, false)}
                        className="flex-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Groups
              </p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Create a group"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {visibleGroups.length > 0 ? (
                visibleGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => selectGroup(group)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left text-sm",
                      selectedGroup?.id === group.id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    )}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate flex-1">{group.name}</span>
                    {group.myRole === 'owner' && (
                      <span className="text-[9px] uppercase font-bold text-gray-300">owner</span>
                    )}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full text-left text-xs text-gray-400 px-2.5 py-2 hover:text-blue-600 transition-colors"
                >
                  + Create your first group
                </button>
              )}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Direct Messages
              </p>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="space-y-0.5">
              {visibleConversations.length > 0 ? (
                visibleConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => openDirectMessage(conversation)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left",
                      selectedUser?.id === conversation.id && showDirectMessages
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar url={conversation.avatar_url} size="w-8 h-8" />
                      {onlineUsers.some(u => u.id === conversation.id) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        selectedUser?.id === conversation.id && showDirectMessages ? 'text-blue-700 font-semibold' : 'text-gray-800 font-medium'
                      )}>{conversation.username}</p>
                      <p className={cn(
                        "text-xs truncate text-gray-400",
                        conversation.unreadCount > 0 && 'font-semibold text-gray-600'
                      )}>
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {conversation.lastMessageTime && (
                        <span className="text-[10px] text-gray-400">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 px-2.5 py-2">
                  Click a user to start chatting
                </p>
              )}
            </div>
          </div>

          {/* Online Users */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-2 text-gray-400">
              Online — {onlineUsers.length}
            </p>
            <div className="space-y-0.5">
              {visibleOnline.map((onlineUser) => (
                <button
                  key={onlineUser.id}
                  onClick={() => handleUserClick(onlineUser.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-left hover:bg-gray-100 group"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar url={onlineUser.avatar_url} size="w-6 h-6" fallback={<span className="text-xs">👤</span>} />
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                  </div>
                  <p className="text-sm font-medium truncate flex-1 text-gray-700">{onlineUser.username}</p>
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guidelines footer */}
        <div className="p-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Be respectful · No spam · No financial advice
          </p>
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!hasActiveConversation ? (
          /* ---- Community Home ---- */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-12">
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-1">
                  Welcome to the Community
                </h2>
                <p className="text-sm text-gray-500">
                  Talk markets with traders around the world. Pick a channel to jump in.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="plutus-card p-4 text-center">
                  <p className="text-xl font-bold text-gray-900 tnum">{onlineUsers.length + 1}</p>
                  <p className="text-xs text-gray-500">Online now</p>
                </div>
                <div className="plutus-card p-4 text-center">
                  <p className="text-xl font-bold text-gray-900 tnum">{myGroups.length}</p>
                  <p className="text-xs text-gray-500">Your groups</p>
                </div>
                <div className="plutus-card p-4 text-center">
                  <p className="text-xl font-bold text-gray-900 tnum">{unreadCount}</p>
                  <p className="text-xs text-gray-500">Unread messages</p>
                </div>
              </div>

              {/* Channel cards */}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Channels</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => selectChannel(channel.id)}
                    className="plutus-card plutus-card-hover p-4 text-left flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <channel.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
                      <p className="text-xs text-gray-500 truncate">{channel.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Online people */}
              {onlineUsers.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Online now</p>
                  <div className="flex flex-wrap gap-2">
                    {onlineUsers.slice(0, 12).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors"
                      >
                        <div className="relative">
                          <Avatar url={u.avatar_url} size="w-6 h-6" fallback={<span className="text-xs">👤</span>} />
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{u.username}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
        <>
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {showDirectMessages && selectedUser ? (
              <>
                <button
                  onClick={handleBackToChannel}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-500"
                  title="Back to channels"
                >
                  <X className="w-4 h-4" />
                </button>
                <Avatar url={selectedUser.avatar_url} size="w-8 h-8" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {selectedUser.username}
                  </h3>
                  {onlineUsers.some(u => u.id === selectedUser.id) ? (
                    <p className="text-xs flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online
                    </p>
                  ) : (
                    <p className="text-xs flex items-center gap-1.5 text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      Offline
                    </p>
                  )}
                </div>
              </>
            ) : selectedGroup ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedGroup.description || (selectedGroup.is_private ? 'Private group' : 'Public group')}
                  </p>
                </div>
              </>
            ) : (
              <>
                {React.createElement(channels.find(c => c.id === selectedChannel)?.icon || Hash, {
                  className: "w-5 h-5 text-blue-600 flex-shrink-0"
                })}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {channels.find(c => c.id === selectedChannel)?.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {channels.find(c => c.id === selectedChannel)?.description}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selectedGroup && (
              <>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Invite members"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Leave group"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
              </>
            )}
            <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5">
          <div>
            <AnimatePresence>
              {activeMessages.map((msg, index) => {
                const prev = activeMessages[index - 1];
                const msgSender = msg.user_id || msg.sender_id;
                const prevSender = prev ? (prev.user_id || prev.sender_id) : null;
                const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
                const grouped = !newDay && prevSender === msgSender &&
                  (new Date(msg.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;

                return (
                  <React.Fragment key={msg.id || index}>
                    {newDay && (
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
                          {formatDay(msg.created_at)}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.01, 0.2) }}
                      className={cn(
                        "flex gap-3 group",
                        msg.isOwn && "flex-row-reverse",
                        grouped ? "mt-0.5" : "mt-4"
                      )}
                    >
                      {/* Avatar (hidden for grouped messages) */}
                      {grouped ? (
                        <div className="w-9 flex-shrink-0" />
                      ) : (
                        <button
                          onClick={() => !msg.isOwn && handleUserClick(msg.user_id || selectedUser?.id)}
                          disabled={msg.isOwn}
                          className={cn("flex-shrink-0", !msg.isOwn && "cursor-pointer")}
                        >
                          <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 ring-2 ring-transparent hover:ring-blue-200 transition-all">
                            {msg.avatar && typeof msg.avatar === 'string' && msg.avatar.startsWith('http') ? (
                              <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{msg.avatar || '🧑'}</span>
                            )}
                          </div>
                        </button>
                      )}

                      <div className={cn(
                        "flex-1 min-w-0",
                        msg.isOwn && "flex flex-col items-end"
                      )}>
                        {!grouped && (
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => !msg.isOwn && handleUserClick(msg.user_id || selectedUser?.id)}
                              disabled={msg.isOwn}
                              className={cn(
                                "text-xs font-semibold transition-colors text-gray-700",
                                !msg.isOwn && "cursor-pointer hover:text-blue-600 hover:underline"
                              )}
                            >
                              {msg.user || (msg.isOwn ? 'You' : selectedUser?.username)}
                            </button>
                            <span className="text-[11px] text-gray-400">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={cn(
                          "flex items-center gap-1.5",
                          msg.isOwn && "flex-row-reverse"
                        )}>
                          <div className={cn(
                            "px-3.5 py-2.5 inline-block max-w-lg break-words",
                            msg.type && msg.type !== 'message' && `border ${getMessageTypeColor(msg.type)}`,
                            msg.isOwn
                              ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                          )}>
                            {msg.image_url && (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-1 -mx-1 -mt-1">
                                <img
                                  src={msg.image_url}
                                  alt="Shared image"
                                  loading="lazy"
                                  className="rounded-xl max-h-64 max-w-full object-cover"
                                />
                              </a>
                            )}
                            {msg.message && (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            )}
                          </div>
                          {msg.isOwn && (
                            <button
                              onClick={() => handleDeleteMessage(msg)}
                              className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Emoji (coming soon)"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleImageButtonClick}
              disabled={uploadingImage}
              className={cn(
                "p-2 rounded-lg transition-colors",
                uploadingImage
                  ? 'text-blue-600 animate-pulse cursor-wait'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              )}
              title={uploadingImage ? "Uploading..." : "Send an image"}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelected}
              className="hidden"
            />
            <Input
              type="text"
              placeholder={
                !session
                  ? "Sign in to chat..."
                  : showDirectMessages
                  ? `Message @${selectedUser?.username}...`
                  : selectedGroup
                  ? `Message ${selectedGroup.name}...`
                  : `Message #${channels.find(c => c.id === selectedChannel)?.name.toLowerCase().replace(/\s/g, '-')}...`
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!session}
              className="flex-1 rounded-full bg-gray-50 border-gray-200 focus-visible:ring-blue-600/20"
            />
            <Button
              type="submit"
              disabled={!session || !newMessage.trim()}
              className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
};

export default Community;
