import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ootzwfmsjocialwbrgqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdHp3Zm1zam9jaWFsd2JyZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2Mjc3MzEsImV4cCI6MjA5NDIwMzczMX0.gkVXf2QTMeep9DpfMp0i4G339sdihpzYqzCjzwAIirM';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
