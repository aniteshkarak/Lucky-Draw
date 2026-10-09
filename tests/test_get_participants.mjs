import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqydubijimrmqjzwgshg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWR1YmlqaW1ybXFqendnc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzgxMDcsImV4cCI6MjEwNzA1NDEwN30.Y4PXCg6rUsdP2yJxvIzjPbvdbuq5aM7VHY7hAfUEdoo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testParticipants() {
  console.log('Testing get_public_participants RPC...');
  const { data, error } = await supabase.rpc('get_public_participants', {
    p_search: '',
    p_limit: 50,
    p_offset: 0
  });

  console.log('Public participants result:', JSON.stringify(data, null, 2), error);
}

testParticipants();
