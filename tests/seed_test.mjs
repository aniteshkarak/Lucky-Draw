import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqydubijimrmqjzwgshg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWR1YmlqaW1ybXFqendnc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzgxMDcsImV4cCI6MjEwNzA1NDEwN30.Y4PXCg6rUsdP2yJxvIzjPbvdbuq5aM7VHY7hAfUEdoo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function trySeed() {
  const { data, error } = await supabase.from('draw_settings').insert([
    {
      event_date: '2026-10-09',
      start_time: '09:00:00',
      end_time: '20:00:00',
      timezone: 'Asia/Kolkata',
      status: 'SCHEDULED',
      auto_cleanup_after_end: true
    }
  ]).select();

  console.log('Insert result:', { data, error });
}

trySeed();
