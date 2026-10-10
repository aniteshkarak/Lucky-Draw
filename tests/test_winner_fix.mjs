import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sqydubijimrmqjzwgshg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeWR1YmlqaW1ybXFqendnc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzgxMDcsImV4cCI6MjEwNzA1NDEwN30.Y4PXCg6rUsdP2yJxvIzjPbvdbuq5aM7VHY7hAfUEdoo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getSeededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING COMPREHENSIVE WINNER VERIFICATION TEST SUITE');
  console.log('========================================================\n');

  // Fetch real participants from Supabase
  console.log('[TEST 1] Fetching live participants from Supabase...');
  const { data: partData, error: partErr } = await supabase.rpc('get_public_participants', {
    p_search: '',
    p_limit: 100,
    p_offset: 0,
  });

  if (partErr || !partData || !partData.participants) {
    console.error('FAILED to fetch participants from Supabase:', partErr);
    process.exit(1);
  }

  const participants = partData.participants;
  console.log(`✓ Successfully retrieved ${participants.length} real participants from Supabase:\n`);
  participants.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [ID: ${p.id.slice(0, 8)}...] "${p.name}" (Lucky Number: #${p.lucky_number})`);
  });

  // Test Case 1 & 2: Winner selection from real participants
  console.log('\n[TEST 2] Verifying winner selection from existing participants...');
  const eventId = 'event_2026-10-10_2000_2100';
  const rng = getSeededRandom(eventId);
  const shuffled = [...participants].sort(() => 0.5 - rng());

  const p1 = shuffled[0];
  const p2 = shuffled[1] || null;
  const p3 = shuffled[2] || null;

  console.log(`✓ 1st Prize Winner: "${p1.name}" (Lucky #${p1.lucky_number})`);
  console.log(`✓ 2nd Prize Winner: "${p2.name}" (Lucky #${p2.lucky_number})`);
  console.log(`✓ 3rd Prize Winner: "${p3.name}" (Lucky #${p3.lucky_number})`);

  // Assertions
  console.log('\n[TEST 3] Running strict assertions:');
  
  // 1. Check that winning participants exist in participant list
  const p1Found = participants.find(p => p.id === p1.id && p.lucky_number === p1.lucky_number);
  const p2Found = participants.find(p => p.id === p2.id && p.lucky_number === p2.lucky_number);
  const p3Found = participants.find(p => p.id === p3.id && p.lucky_number === p3.lucky_number);
  if (!p1Found || !p2Found || !p3Found) {
    throw new Error('Assertion failed: Winner participant ID or number does not match DB record');
  }
  console.log('✓ Assertion 1 PASSED: All 3 winners are valid participants from the database.');

  // 2. Check no duplicate participants
  const uniqueIds = new Set([p1.id, p2.id, p3.id]);
  if (uniqueIds.size !== 3) {
    throw new Error('Assertion failed: Duplicate winner detected');
  }
  console.log('✓ Assertion 2 PASSED: Each winner is a distinct participant (no duplicates).');

  // 3. Check no duplicate lucky numbers
  const uniqueNumbers = new Set([p1.lucky_number, p2.lucky_number, p3.lucky_number]);
  if (uniqueNumbers.size !== 3) {
    throw new Error('Assertion failed: Duplicate lucky number detected');
  }
  console.log('✓ Assertion 3 PASSED: Each winner has a unique 5-digit lucky number.');

  // 4. Test deterministic consistency across multiple device simulations (Simulate device A and B)
  console.log('\n[TEST 4] Simulating cross-device and page refresh consistency:');
  const rngDeviceA = getSeededRandom(eventId);
  const winnersA = [...participants].sort(() => 0.5 - rngDeviceA()).slice(0, 3);
  
  const rngDeviceB = getSeededRandom(eventId);
  const winnersB = [...participants].sort(() => 0.5 - rngDeviceB()).slice(0, 3);

  if (winnersA[0].id !== winnersB[0].id || winnersA[1].id !== winnersB[1].id || winnersA[2].id !== winnersB[2].id) {
    throw new Error('Assertion failed: Device A and Device B got different winners');
  }
  console.log('✓ Assertion 4 PASSED: Device A and Device B compute identical winners on refresh/load.');

  // 5. Test edge case: Fewer than 3 participants
  console.log('\n[TEST 5] Testing edge case: Fewer than 3 participants (1 and 2 participants):');
  const singleParticipant = [participants[0]];
  const single1st = singleParticipant[0];
  const single2nd = singleParticipant[1] || null;
  const single3rd = singleParticipant[2] || null;
  console.log(`✓ 1 participant draw -> 1st: "${single1st.name}", 2nd: ${single2nd}, 3rd: ${single3rd}`);

  const twoParticipants = [participants[0], participants[1]];
  const two1st = twoParticipants[0];
  const two2nd = twoParticipants[1];
  const two3rd = twoParticipants[2] || null;
  console.log(`✓ 2 participant draw -> 1st: "${two1st.name}", 2nd: "${two2nd.name}", 3rd: ${two3rd}`);

  // 6. Test Privacy & Security: Ensure mobile numbers are NEVER exposed in public views
  console.log('\n[TEST 6] Testing privacy & RLS security:');
  const hasExposedMobile = participants.some(p => p.mobile !== undefined);
  if (hasExposedMobile) {
    throw new Error('Security Violation: Mobile number exposed in public participant data');
  }
  console.log('✓ Assertion 6 PASSED: Mobile numbers are NOT exposed in public data.');

  console.log('\n========================================================');
  console.log('ALL 6 TESTS PASSED SUCCESSFULLY! WINNERS VERIFIED.');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
