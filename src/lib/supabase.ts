import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iotdxcicllwlkamizxzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2ro01S1lZKEARndiJTXzow_DVOU6eqN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
