
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spbcdurrdlicivicyaxe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oBxqjhdXvUvzy1icT_PPNA_hw9CcwTD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
