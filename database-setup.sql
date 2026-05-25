-- ============================================
-- PLUTUS DATABASE SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Add username column to profiles if not exists (for username login)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Create community messages table
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    channel TEXT NOT NULL DEFAULT 'general',
    message TEXT NOT NULL,
    type TEXT DEFAULT 'message', -- 'message', 'trade', 'alert', 'analysis'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create online users table (for tracking who's online)
CREATE TABLE IF NOT EXISTS online_users (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for community_messages
CREATE POLICY "Anyone can read community messages" 
    ON community_messages FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert community messages" 
    ON community_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
    ON community_messages FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
    ON community_messages FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Create policies for direct_messages
CREATE POLICY "Users can read their own direct messages" 
    ON direct_messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send direct messages" 
    ON direct_messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own direct messages" 
    ON direct_messages FOR UPDATE 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own sent messages" 
    ON direct_messages FOR DELETE 
    USING (auth.uid() = sender_id);

-- 8. Create policies for online_users
CREATE POLICY "Anyone can read online users" 
    ON online_users FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own online status" 
    ON online_users FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own online status" 
    ON online_users FOR UPDATE 
    USING (auth.uid() = user_id);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON community_messages(channel);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_read ON direct_messages(read);

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create triggers for updated_at
CREATE TRIGGER update_community_messages_updated_at BEFORE UPDATE ON community_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Create a function to delete user account (for profile deletion)
CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete from profiles
    DELETE FROM profiles WHERE id = user_id;
    
    -- Delete from community_messages
    DELETE FROM community_messages WHERE user_id = user_id;
    
    -- Delete from direct_messages
    DELETE FROM direct_messages WHERE sender_id = user_id OR receiver_id = user_id;
    
    -- Delete from online_users
    DELETE FROM online_users WHERE user_id = user_id;
    
    -- Delete from auth.users (requires service role - handle in backend)
    -- This will be done through Supabase admin API
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Enable Realtime for community_messages and direct_messages tables
--    Go to: Database > Replication > Enable for both tables
-- ============================================
