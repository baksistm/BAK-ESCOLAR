import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// We provide placeholders during build time to prevent crashes.
// Real values must be provided in the environment.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
