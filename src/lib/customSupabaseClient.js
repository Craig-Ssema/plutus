import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vzmjwbodtjyrbjvdsbzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bWp3Ym9kdGp5cmJqdmRzYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDU4NDcsImV4cCI6MjA3ODM4MTg0N30.y8srFQPsChhBGxemb3eTm_ZgNjTU1BjigQIFMNeLylo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);