
import { createClient } from '@supabase/supabase-js';
import { GameRecord } from './types';

const SUPABASE_URL = 'https://dqhwdndamxqdsungbgpz.supabase.co';
// Note: In a production app, the anon key would typically be in an env var.
// I'm using the placeholder key format usually found in Supabase projects.
const SUPABASE_ANON_KEY = 'sb_publishable_yOigcFgzmJYPVfaEonP9IA_F4l8iHUr';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getBestRecord = async (): Promise<GameRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('game_records')
      .select('*')
      .order('attempts', { ascending: true })
      .order('duration_seconds', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No records found
      console.error('Error fetching best record:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return null;
  }
};

export const getAllRecords = async (): Promise<GameRecord[]> => {
  const { data, error } = await supabase
    .from('game_records')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching records:', error);
    return [];
  }
  return data || [];
};

export const saveRecord = async (record: GameRecord): Promise<void> => {
  const { error } = await supabase
    .from('game_records')
    .insert([
      {
        player_name: record.player_name,
        attempts: record.attempts,
        duration_seconds: record.duration_seconds
      }
    ]);

  if (error) {
    console.error('Error saving record:', error);
    throw error;
  }
};
