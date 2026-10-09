import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqydubijimrmqjzwgshg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWR1YmlqaW1ybXFqendnc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzgxMDcsImV4cCI6MjEwNzA1NDEwN30.Y4PXCg6rUsdP2yJxvIzjPbvdbuq5aM7VHY7hAfUEdoo';

console.log('🔍 Testing live Supabase connection to:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDiagnostics() {
  const report = {
    connection: false,
    rpc_get_draw_status: null,
    rpc_get_public_participants: null,
    rpc_get_public_winners: null,
    table_participants: null,
    table_draw_settings: null,
    table_winners: null,
    rpc_participate_dry_run: null
  };

  // 1. Test get_draw_status RPC
  try {
    console.log('\n--- 1. Testing get_draw_status RPC ---');
    const { data, error } = await supabase.rpc('get_draw_status');
    if (error) {
      console.log('❌ get_draw_status returned error:', error.message);
      report.rpc_get_draw_status = { success: false, error: error.message };
    } else {
      console.log('✅ get_draw_status SUCCESS:', data);
      report.rpc_get_draw_status = { success: true, data };
      report.connection = true;
    }
  } catch (err) {
    console.log('❌ get_draw_status exception:', err.message);
    report.rpc_get_draw_status = { success: false, error: err.message };
  }

  // 2. Test get_public_participants RPC
  try {
    console.log('\n--- 2. Testing get_public_participants RPC ---');
    const { data, error } = await supabase.rpc('get_public_participants', {
      p_search: '',
      p_limit: 10,
      p_offset: 0
    });
    if (error) {
      console.log('❌ get_public_participants error:', error.message);
      report.rpc_get_public_participants = { success: false, error: error.message };
    } else {
      console.log('✅ get_public_participants SUCCESS. Count:', data?.length ?? 0);
      report.rpc_get_public_participants = { success: true, count: data?.length, sample: data?.slice(0, 3) };
    }
  } catch (err) {
    console.log('❌ get_public_participants exception:', err.message);
    report.rpc_get_public_participants = { success: false, error: err.message };
  }

  // 3. Test get_public_winners RPC
  try {
    console.log('\n--- 3. Testing get_public_winners RPC ---');
    const { data, error } = await supabase.rpc('get_public_winners');
    if (error) {
      console.log('❌ get_public_winners error:', error.message);
      report.rpc_get_public_winners = { success: false, error: error.message };
    } else {
      console.log('✅ get_public_winners SUCCESS:', data);
      report.rpc_get_public_winners = { success: true, data };
    }
  } catch (err) {
    console.log('❌ get_public_winners exception:', err.message);
    report.rpc_get_public_winners = { success: false, error: err.message };
  }

  // 4. Test table direct queries (RLS check)
  try {
    console.log('\n--- 4. Checking Table direct access (RLS) ---');
    const { data: setRow, error: setErr } = await supabase.from('draw_settings').select('*').limit(1);
    console.log('draw_settings table read:', setErr ? `Protected/Error: ${setErr.message}` : `Success: ${JSON.stringify(setRow)}`);
    report.table_draw_settings = setErr ? { error: setErr.message } : { ok: true, data: setRow };

    const { data: partRow, error: partErr } = await supabase.from('participants').select('id, lucky_number').limit(1);
    console.log('participants table read:', partErr ? `Protected/Error: ${partErr.message}` : `Success: ${JSON.stringify(partRow)}`);
    report.table_participants = partErr ? { error: partErr.message } : { ok: true, data: partRow };
  } catch (err) {
    console.log('Table direct check exception:', err.message);
  }

  // 5. Test participate RPC with a test validation check
  try {
    console.log('\n--- 5. Testing participate RPC validation ---');
    // Test with invalid phone to test function execution without polluting database
    const { data: partRes, error: partErr } = await supabase.rpc('participate', {
      p_name: 'Test Connectivity User',
      p_mobile: '123' // intentionally short to test backend validation response
    });
    if (partErr) {
      console.log('participate RPC response (error or rejection):', partErr.message);
      report.rpc_participate_dry_run = { error: partErr.message };
    } else {
      console.log('✅ participate RPC is functional and responsive! Result:', partRes);
      report.rpc_participate_dry_run = { ok: true, result: partRes };
    }
  } catch (err) {
    console.log('participate RPC exception:', err.message);
    report.rpc_participate_dry_run = { exception: err.message };
  }

  console.log('\n========================================');
  console.log('DIAGNOSTIC SUMMARY:');
  console.log(JSON.stringify(report, null, 2));
  console.log('========================================');
}

runDiagnostics();
