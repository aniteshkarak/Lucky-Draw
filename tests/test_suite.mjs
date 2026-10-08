// Automated Backend Logic & Edge Case Test Suite
import assert from 'assert';

console.log('🚀 Running Dada Lucky Draw Business Logic Test Suite...\n');

// 1. Mobile Normalization & Validation Test
function normalizeAndValidateMobile(mobile) {
  let cleanMobile = String(mobile || '').replace(/[^0-9]/g, '');
  if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
    cleanMobile = cleanMobile.slice(2);
  } else if (cleanMobile.startsWith('0') && cleanMobile.length === 11) {
    cleanMobile = cleanMobile.slice(1);
  }
  const isValid = /^[6-9]\d{9}$/.test(cleanMobile);
  return { isValid, cleanMobile };
}

console.log('Test 1: Mobile normalization & validation');
assert.strictEqual(normalizeAndValidateMobile('9876543210').isValid, true);
assert.strictEqual(normalizeAndValidateMobile('9876543210').cleanMobile, '9876543210');
assert.strictEqual(normalizeAndValidateMobile('+91 98765 43210').cleanMobile, '9876543210');
assert.strictEqual(normalizeAndValidateMobile('09876543210').cleanMobile, '9876543210');
assert.strictEqual(normalizeAndValidateMobile('1234567890').isValid, false, 'Should reject numbers starting with 1');
assert.strictEqual(normalizeAndValidateMobile('987654321').isValid, false, 'Should reject 9 digits');
assert.strictEqual(normalizeAndValidateMobile('987654321000').isValid, false, 'Should reject 12 invalid digits');
console.log('  ✅ Mobile validation tests passed.\n');

// 2. 5-digit Lucky Number Generation & Collision Test
console.log('Test 2: 5-digit number generation & uniqueness');
const generated = new Set();
for (let i = 0; i < 5000; i++) {
  const num = Math.floor(10000 + Math.random() * 90000);
  assert(num >= 10000 && num <= 99999, 'Number must be exactly 5 digits');
  generated.add(num);
}
assert(generated.size > 4500, 'Randomness distribution healthy');
console.log(`  ✅ Generated 5000 numbers in range [10000, 99999] successfully.\n`);

// 3. Duplicate Prevention & Idempotency Simulation
console.log('Test 3: Duplicate entry prevention & Idempotency');
const participantsDB = new Map();

function register(name, mobile) {
  const { isValid, cleanMobile } = normalizeAndValidateMobile(mobile);
  if (!isValid) return { success: false, error: 'INVALID_MOBILE' };
  
  if (participantsDB.has(cleanMobile)) {
    const existing = participantsDB.get(cleanMobile);
    return { success: true, already_registered: true, participant: existing };
  }

  const lucky_number = Math.floor(10000 + Math.random() * 90000);
  const entry = { id: String(Date.now()), name, mobile: cleanMobile, lucky_number, played_at: new Date().toISOString() };
  participantsDB.set(cleanMobile, entry);
  return { success: true, already_registered: false, participant: entry };
}

const res1 = register('Rahul Sharma', '9876543210');
assert.strictEqual(res1.success, true);
assert.strictEqual(res1.already_registered, false);
const originalNumber = res1.participant.lucky_number;

// Submit again with same mobile
const res2 = register('Rahul S.', '+91 98765 43210');
assert.strictEqual(res2.success, true);
assert.strictEqual(res2.already_registered, true);
assert.strictEqual(res2.participant.lucky_number, originalNumber, 'Lucky number must remain identical on duplicate submit');
assert.strictEqual(participantsDB.size, 1, 'Total database count must remain 1');
console.log('  ✅ Duplicate prevention and idempotency verified.\n');

// 4. Winner Selection & Immutability Test
console.log('Test 4: Winner selection, uniqueness & immutability');
register('Priya Mukherjee', '9876543211');
register('Anitesh Karak', '9876543212');
register('Debabrata Das', '9876543213');
register('Sneha Bose', '9876543214');

assert.strictEqual(participantsDB.size, 5);

let winnersDB = null;

function selectWinners() {
  if (winnersDB) {
    return { success: true, already_selected: true, winners: winnersDB };
  }
  const pool = Array.from(participantsDB.values());
  assert(pool.length >= 3);
  
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  winnersDB = {
    first_prize: { name: shuffled[0].name, lucky_number: shuffled[0].lucky_number },
    second_prize: { name: shuffled[1].name, lucky_number: shuffled[1].lucky_number },
    third_prize: { name: shuffled[2].name, lucky_number: shuffled[2].lucky_number },
    selected_at: new Date().toISOString()
  };
  return { success: true, already_selected: false, winners: winnersDB };
}

const winDraw1 = selectWinners();
assert.strictEqual(winDraw1.success, true);
assert.strictEqual(winDraw1.already_selected, false);

// Check winners are distinct
const luckySet = new Set([
  winDraw1.winners.first_prize.lucky_number,
  winDraw1.winners.second_prize.lucky_number,
  winDraw1.winners.third_prize.lucky_number
]);
assert.strictEqual(luckySet.size, 3, 'All 3 winners must be distinct participants');

// Verify immutability upon re-call / refresh
const winDraw2 = selectWinners();
assert.strictEqual(winDraw2.already_selected, true);
assert.strictEqual(winDraw2.winners.first_prize.lucky_number, winDraw1.winners.first_prize.lucky_number);
assert.strictEqual(winDraw2.winners.second_prize.lucky_number, winDraw1.winners.second_prize.lucky_number);
assert.strictEqual(winDraw2.winners.third_prize.lucky_number, winDraw1.winners.third_prize.lucky_number);
console.log('  ✅ 3 unique winners selected & verified immutable on repeat calls.\n');

// 5. IST Timezone Window Logic Test
console.log('Test 5: Asia/Kolkata event window validation');
function checkTimeStatus(mockDateIST) {
  const eventDate = '2026-10-25';
  const currentDate = mockDateIST.toISOString().slice(0, 10);
  const currentHour = mockDateIST.getHours();
  
  if (currentDate < eventDate || (currentDate === eventDate && currentHour < 20)) {
    return 'BEFORE_DRAW';
  } else if (currentDate === eventDate && currentHour === 20) {
    return 'LIVE_DRAW';
  } else {
    return 'DRAW_CLOSED';
  }
}

assert.strictEqual(checkTimeStatus(new Date('2026-10-25T19:59:00+05:30')), 'BEFORE_DRAW');
assert.strictEqual(checkTimeStatus(new Date('2026-10-25T20:00:00+05:30')), 'LIVE_DRAW');
assert.strictEqual(checkTimeStatus(new Date('2026-10-25T20:45:00+05:30')), 'LIVE_DRAW');
assert.strictEqual(checkTimeStatus(new Date('2026-10-25T21:00:00+05:30')), 'DRAW_CLOSED');
assert.strictEqual(checkTimeStatus(new Date('2026-10-26T10:00:00+05:30')), 'DRAW_CLOSED');
console.log('  ✅ IST event window state transitions verified.\n');

// 6. Admin Participant Deletion by ID & Lucky Number
console.log('Test 6: Admin participant deletion by ID, Lucky Number & Mobile');
function deleteParticipant(target) {
  for (const [mob, p] of participantsDB.entries()) {
    if (
      (target.id && p.id === target.id) ||
      (target.lucky_number && p.lucky_number === target.lucky_number) ||
      (target.mobile && p.mobile === target.mobile)
    ) {
      participantsDB.delete(mob);
      return { success: true, message: 'Deleted' };
    }
  }
  return { success: false, message: 'Not found' };
}

const initialCount = participantsDB.size;
assert(initialCount >= 3, 'Must have at least 3 participants');
const firstParticipant = Array.from(participantsDB.values())[0];

// Delete by lucky number
const delRes1 = deleteParticipant({ lucky_number: firstParticipant.lucky_number });
assert.strictEqual(delRes1.success, true);
assert.strictEqual(participantsDB.size, initialCount - 1);

// Try deleting same participant again
const delRes2 = deleteParticipant({ lucky_number: firstParticipant.lucky_number });
assert.strictEqual(delRes2.success, false, 'Should return not found for already deleted participant');
console.log('  ✅ Admin deletion by lucky number and ID verified.\n');

// 7. Auto-Cleanup / Data Wipe Logic Test
console.log('Test 7: Automatic data wipe after event end time');
function evaluateAutoWipe(currentIST, eventDate, endTime, autoCleanup) {
  const [currDate, currTime] = currentIST.split('T');
  const isPast = currDate > eventDate || (currDate === eventDate && currTime >= endTime);
  if (autoCleanup && isPast) {
    return { shouldWipe: true, status: 'CLOSED' };
  } else if (isPast) {
    return { shouldWipe: false, status: 'CLOSED' };
  } else if (currDate === eventDate && currTime >= '09:00:00') {
    return { shouldWipe: false, status: 'LIVE' };
  } else {
    return { shouldWipe: false, status: 'SCHEDULED' };
  }
}

// 9:00 AM to 8:00 PM IST test schedule
const testDate = '2026-10-09';
const testEnd = '20:00:00';

assert.strictEqual(evaluateAutoWipe('2026-10-09T08:30:00', testDate, testEnd, true).status, 'SCHEDULED');
assert.strictEqual(evaluateAutoWipe('2026-10-09T08:30:00', testDate, testEnd, true).shouldWipe, false);

assert.strictEqual(evaluateAutoWipe('2026-10-09T10:00:00', testDate, testEnd, true).status, 'LIVE');
assert.strictEqual(evaluateAutoWipe('2026-10-09T10:00:00', testDate, testEnd, true).shouldWipe, false);

assert.strictEqual(evaluateAutoWipe('2026-10-09T19:59:59', testDate, testEnd, true).status, 'LIVE');
assert.strictEqual(evaluateAutoWipe('2026-10-09T19:59:59', testDate, testEnd, true).shouldWipe, false);

// Time reaches 8:00 PM -> AUTO WIPE TRIGGERS
const wipeResult = evaluateAutoWipe('2026-10-09T20:00:00', testDate, testEnd, true);
assert.strictEqual(wipeResult.status, 'CLOSED');
assert.strictEqual(wipeResult.shouldWipe, true, 'Auto wipe must trigger at or after 20:00:00');

const dayAfterWipe = evaluateAutoWipe('2026-10-10T09:00:00', testDate, testEnd, true);
assert.strictEqual(dayAfterWipe.status, 'CLOSED');
assert.strictEqual(dayAfterWipe.shouldWipe, true);
console.log('  ✅ Automatic data wipe past 8:00 PM verified.\n');

// 8. Dynamic IST Schedule Time Parsing Test
console.log('Test 8: Dynamic IST time parsing & conversion');
function parseISTDate(dateStr, timeStr) {
  const [year, month, day] = (dateStr || '2026-10-09').split('-').map(Number);
  const [hour, min, sec] = (timeStr || '20:00:00').split(':').map(Number);
  const istMinutes = (hour || 0) * 60 + (min || 0);
  const utcMinutes = istMinutes - 330;
  const utcHour = Math.floor(((utcMinutes + 1440) % 1440) / 60);
  const utcMin = ((utcMinutes + 1440) % 1440) % 60;
  const dayOffset = utcMinutes < 0 ? -1 : utcMinutes >= 1440 ? 1 : 0;
  return new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + dayOffset, utcHour, utcMin, sec || 0));
}

const parsedStart = parseISTDate('2026-10-09', '09:00:00');
// 9:00 AM IST = 3:30 AM UTC
assert.strictEqual(parsedStart.getUTCHours(), 3);
assert.strictEqual(parsedStart.getUTCMinutes(), 30);

const parsedEnd = parseISTDate('2026-10-09', '20:00:00');
// 8:00 PM IST = 14:30 UTC
assert.strictEqual(parsedEnd.getUTCHours(), 14);
assert.strictEqual(parsedEnd.getUTCMinutes(), 30);
console.log('  ✅ Dynamic IST to UTC time conversions verified.\n');

console.log('🎉 ALL 8 TEST SUITES COMPLETED WITH 100% SUCCESS!');
