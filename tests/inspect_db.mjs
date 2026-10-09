import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqydubijimrmqjzwgshg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWR1YmlqaW1ybXFqendnc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzgxMDcsImV4cCI6MjEwNzA1NDEwN30.Y4PXCg6rUsdP2yJxvIzjPbvdbuq5aM7VHY7hAfUEdoo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
  console.log('1. Checking draw_settings table...');
  const { data: ds, error: dsErr } = await supabase.from('draw_settings').select('*');
  console.log('draw_settings count:', ds?.length, 'error:', dsErr?.message, 'rows:', ds);

  console.log('2. Checking participants table...');
  const { data: pts, error: ptErr } = await supabase.from('participants').select('*');
  console.log('participants count:', pts?.length, 'error:', ptErr?.message, 'rows:', pts);

  console.log('3. Checking winners table...');
  const { data: wns, error: wnErr } = await supabase.from('winners').select('*');
  console.log('winners count:', wns?.length, 'error:', wnErr?.message, 'rows:', wns);
}

inspect();
