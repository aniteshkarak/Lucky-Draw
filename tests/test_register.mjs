import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqydubijimrmqjzwgshg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWR1YmlqaW1ybXFqendnc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzgxMDcsImV4cCI6MjEwNzA1NDEwN30.Y4PXCg6rUsdP2yJxvIzjPbvdbuq5aM7VHY7hAfUEdoo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistration() {
  console.log('Testing participate RPC on Supabase...');
  const { data, error } = await supabase.rpc('participate', {
    p_name: 'Anitesh Karak Test',
    p_mobile: '9876543210'
  });

  console.log('Result:', { data, error });
}

testRegistration();
