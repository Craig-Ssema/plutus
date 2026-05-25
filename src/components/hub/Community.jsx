import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, TrendingUp, AlertCircle, Smile, Image as ImageIcon, Hash, Star, MessageSquare, X, AtSign, UserCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const Community = () => {
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [allDirectConversations, setAllDirectConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDirectMessages, setShowDirectMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredUser, setHoveredUser] = useState(null);
  const messagesEndRef = useRef(null);
  const { theme } = useTheme();
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

      // Get all users I've had conversations with
      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      // Get unique user IDs
      const userIds = new Set();
      data.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
      });

      // Fetch profiles for these users
      const conversations = await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const profile = await fetchUserProfile(userId);
          
          // Get unread count for this conversation
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', userId)
            .eq('receiver_id', user.id)
            .eq('read', false);

          // Get last message
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
    const interval = setInterval(loadConversations, 5000); // Refresh every 5 seconds
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

      // Fetch user profiles for each message
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

    if (selectedChannel && !showDirectMessages) {
      loadMessages();
    }
  }, [selectedChannel, user, showDirectMessages]);

  // Subscribe to real-time community messages
  useEffect(() => {
    if (!selectedChannel || showDirectMessages) return;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel, user, showDirectMessages]);

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

      // Fetch profiles for online users
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
    const interval = setInterval(loadOnlineUsers, 30000); // Refresh every 30 seconds

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
    const interval = setInterval(updateOnlineStatus, 60000); // Update every minute

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

      // Mark messages as read
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

            // Mark as read
            supabase
              .from('direct_messages')
              .update({ read: true })
              .eq('id', payload.new.id);
          } else {
            // Update unread count
            setUnreadCount((prev) => prev + 1);
          }
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
      // Send direct message
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message: newMessage.trim(),
        });

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
        {
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message: newMessage.trim(),
          created_at: new Date().toISOString(),
          isOwn: true,
        },
      ]);
    } else {
      // Send community message
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
        return 'bg-green-500/10 border-green-500/30';
      case 'alert':
        return 'bg-red-500/10 border-red-500/30';
      case 'analysis':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return '';
    }
  };

  // Handle clicking on a user (avatar or name) to open DM
  const handleUserClick = async (clickedUserId) => {
    if (clickedUserId === user?.id) return; // Don't DM yourself
    
    const profile = await fetchUserProfile(clickedUserId);
    const userWithId = { ...profile, id: clickedUserId };
    
    setSelectedUser(userWithId);
    setShowDirectMessages(true);
    setDirectMessages([]);
    
    toast({
      title: "Direct Message",
      description: `Opening chat with ${profile.username}`,
    });
  };

  const handleBackToChannel = () => {
    setShowDirectMessages(false);
    setSelectedUser(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Channels & Direct Messages */}
      <div className={cn(
        "lg:col-span-1 p-6 rounded-xl",
        theme === 'dark'
          ? 'bg-zinc-900 border border-red-900/30'
          : theme === 'gradient'
          ? 'bg-white/20 backdrop-blur-md border border-white/30'
          : 'bg-white border border-gray-200 shadow-sm'
      )}>
        {/* Channels Section */}
        <div className="space-y-2 mb-6">
          <p className={cn(
            "text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2",
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          )}>
            <Hash className="w-4 h-4" />
            Channels
          </p>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => {
                setSelectedChannel(channel.id);
                setShowDirectMessages(false);
              }}
              className={cn(
                "w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-left",
                selectedChannel === channel.id && !showDirectMessages
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md'
                    : theme === 'gradient'
                    ? 'bg-white/40 backdrop-blur-md text-gray-900 border border-white/40'
                    : 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:bg-red-900/20 hover:text-white'
                  : theme === 'gradient'
                  ? 'text-gray-700 hover:bg-white/20'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <channel.icon className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{channel.name}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Direct Messages Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className={cn(
              "text-xs font-semibold uppercase tracking-wider flex items-center gap-2",
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            )}>
              <MessageSquare className="w-4 h-4" />
              Direct Messages
            </p>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <ScrollArea className="h-64">
            {allDirectConversations.length > 0 ? (
              allDirectConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleUserClick(conversation.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 text-left mb-2 group",
                    selectedUser?.id === conversation.id && showDirectMessages
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                        : 'bg-blue-600 text-white'
                      : theme === 'dark'
                      ? 'text-gray-400 hover:bg-red-900/20 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
                      theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                    )}>
                      {conversation.avatar_url ? (
                        <img src={conversation.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-6 h-6" />
                      )}
                    </div>
                    {onlineUsers.some(u => u.id === conversation.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{conversation.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.username}</p>
                    <p className={cn(
                      "text-xs truncate",
                      conversation.unreadCount > 0 ? 'font-semibold' : '',
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
                    )}>
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className={cn(
                "text-center py-8",
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              )}>
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No conversations yet</p>
                <p className="text-xs mt-1">Click on a user to start chatting</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Online Users Section */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center space-x-2 mb-3">
            <Users className={cn(
              "w-4 h-4",
              theme === 'dark' ? 'text-orange-400' : 'text-blue-600'
            )} />
            <p className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            )}>
              Online ({onlineUsers.length})
            </p>
          </div>
          <ScrollArea className="h-32">
            {onlineUsers.map((onlineUser) => (
              <button
                key={onlineUser.id}
                onClick={() => handleUserClick(onlineUser.id)}
                className={cn(
                  "w-full flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 text-left mb-1 group",
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-red-900/20 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center overflow-hidden",
                    theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
                  )}>
                    {onlineUser.avatar_url ? (
                      <img src={onlineUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                </div>
                <p className="text-xs font-medium truncate flex-1">{onlineUser.username}</p>
                <MessageSquare className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Community Guidelines */}
        <div className={cn(
          "mt-6 p-4 rounded-lg",
          theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50'
        )}>
          <p className={cn(
            "text-xs font-semibold mb-2",
            theme === 'dark' ? 'text-orange-400' : 'text-blue-600'
          )}>
            Community Guidelines
          </p>
          <ul className={cn(
            "text-xs space-y-1",
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            <li>• Be respectful to others</li>
            <li>• No spam or advertising</li>
            <li>• Share quality insights</li>
            <li>• No financial advice</li>
          </ul>
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "lg:col-span-3 flex flex-col rounded-xl overflow-hidden",
        theme === 'dark'
          ? 'bg-zinc-900 border border-red-900/30'
          : theme === 'gradient'
          ? 'bg-white/20 backdrop-blur-md border border-white/30'
          : 'bg-white border border-gray-200 shadow-sm'
      )}>
        {/* Chat Header */}
        <div className={cn(
          "p-4 border-b",
          theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showDirectMessages && selectedUser ? (
                <>
                  <button
                    onClick={handleBackToChannel}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
                    theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'
                  )}>
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {selectedUser.username}
                    </h3>
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      <AtSign className="w-3 h-3" />
                      Direct Message
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {React.createElement(channels.find(c => c.id === selectedChannel)?.icon || Hash, {
                    className: cn(
                      "w-6 h-6",
                      theme === 'dark' ? 'text-orange-400' : 'text-blue-600'
                    )
                  })}
                  <div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {channels.find(c => c.id === selectedChannel)?.name}
                    </h3>
                    <p className={cn(
                      "text-xs",
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      {channels.find(c => c.id === selectedChannel)?.description}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                theme === 'dark' ? 'bg-green-500' : 'bg-green-500'
              )} />
              <span className={cn(
                "text-sm",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" style={{ height: '500px' }}>
          <div className="space-y-4">
            <AnimatePresence>
              {(showDirectMessages ? directMessages : messages).map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "flex space-x-3 group",
                    msg.isOwn && "flex-row-reverse space-x-reverse"
                  )}
                >
                  {/* Clickable Avatar */}
                  <button
                    onClick={() => !msg.isOwn && handleUserClick(msg.user_id || selectedUser?.id)}
                    disabled={msg.isOwn}
                    className={cn(
                      "flex-shrink-0 transition-transform hover:scale-110",
                      !msg.isOwn && "cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition-all",
                      theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'
                    )}>
                      {msg.avatar && typeof msg.avatar === 'string' && msg.avatar.startsWith('http') ? (
                        <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{msg.avatar || '🧑'}</span>
                      )}
                    </div>
                  </button>

                  <div className={cn(
                    "flex-1 min-w-0",
                    msg.isOwn && "flex flex-col items-end"
                  )}>
                    <div className="flex items-center space-x-2 mb-1">
                      {/* Clickable Username */}
                      <button
                        onClick={() => !msg.isOwn && handleUserClick(msg.user_id || selectedUser?.id)}
                        disabled={msg.isOwn}
                        className={cn(
                          "text-sm font-semibold hover:underline transition-colors",
                          !msg.isOwn && "cursor-pointer",
                          theme === 'dark' ? 'text-white hover:text-orange-400' : 'text-gray-900 hover:text-blue-600'
                        )}
                      >
                        {msg.user || (msg.isOwn ? 'You' : selectedUser?.username)}
                      </button>
                      <span className={cn(
                        "text-xs",
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
                      )}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg inline-block max-w-lg break-words",
                      msg.type && msg.type !== 'message' && `border ${getMessageTypeColor(msg.type)}`,
                      msg.isOwn
                        ? theme === 'dark'
                          ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                          : theme === 'gradient'
                          ? 'bg-white/40 backdrop-blur-md border border-white/40'
                          : 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'bg-zinc-800 text-gray-200'
                        : theme === 'gradient'
                        ? 'bg-white/30 backdrop-blur-sm'
                        : 'bg-gray-100 text-gray-900'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className={cn(
          "p-4 border-t",
          theme === 'dark' ? 'border-red-900/30' : 'border-gray-200'
        )}>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              )}
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              )}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <Input
              type="text"
              placeholder={
                !session 
                  ? "Sign in to chat..." 
                  : showDirectMessages 
                  ? `Message @${selectedUser?.username}...` 
                  : "Share your thoughts..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!session}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!session || !newMessage.trim()}
              className={cn(
                "px-6",
                theme === 'dark'
                  ? 'bg-gradient-to-r from-red-600 to-orange-500'
                  : theme === 'gradient'
                  ? 'bg-white/30 backdrop-blur-md border border-white/40'
                  : ''
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Community;
