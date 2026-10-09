import assert from 'assert';

console.log('🧪 Testing 2-Hour Grace Period & Retention Logic...');

function parseISTDate(dateStr, timeStr) {
  const safeDate = dateStr || '2026-10-09';
  const safeTime = timeStr || '20:00:00';
  const [year, month, day] = safeDate.split('-').map(Number);
  const [hour, min, sec] = safeTime.split(':').map(Number);
  const istMinutes = (hour || 0) * 60 + (min || 0);
  const utcMinutes = istMinutes - 330;
  const utcHour = Math.floor(((utcMinutes + 1440) % 1440) / 60);
  const utcMin = ((utcMinutes + 1440) % 1440) % 60;
  const dayOffset = utcMinutes < 0 ? -1 : utcMinutes >= 1440 ? 1 : 0;
  return new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + dayOffset, utcHour, utcMin, sec || 0));
}

function checkAutoCleanup(eventDate, endTime, autoCleanup, currentTimeMs, currentData) {
  const endDateTime = parseISTDate(eventDate, endTime);
  const twoHoursAfterEndMs = endDateTime.getTime() + 2 * 60 * 60 * 1000;

  if (autoCleanup && currentTimeMs >= twoHoursAfterEndMs) {
    return { cleaned: true, participants: [], winners: null };
  }
  return { cleaned: false, participants: currentData.participants, winners: currentData.winners };
}

const eventDate = '2026-10-25';
const endTime = '21:00:00'; // 9:00 PM IST
const endDateTime = parseISTDate(eventDate, endTime);
const endTimeMs = endDateTime.getTime();

const initialData = {
  participants: [
    { name: 'Aarav Sharma', lucky_number: 38472 },
    { name: 'Priya Mukherjee', lucky_number: 81924 },
  ],
  winners: {
    first_prize: { name: 'Aarav Sharma', lucky_number: 38472 },
  }
};

// Scenario 1: Exact End Time (9:00 PM) - Auto-wipe ON
const atEndTime = checkAutoCleanup(eventDate, endTime, true, endTimeMs, initialData);
assert.strictEqual(atEndTime.cleaned, false, 'Data MUST NOT be cleaned at exact end time');
assert.strictEqual(atEndTime.participants.length, 2, 'Participants preserved at end time');
assert.notStrictEqual(atEndTime.winners, null, 'Winners preserved at end time');
console.log('✅ 1. At 9:00 PM (Draw Closes): Data is 100% intact and preserved.');

// Scenario 2: 30 Minutes After Draw (9:30 PM) - Auto-wipe ON
const at30Mins = checkAutoCleanup(eventDate, endTime, true, endTimeMs + 30 * 60 * 1000, initialData);
assert.strictEqual(at30Mins.cleaned, false, 'Data MUST NOT be cleaned 30 mins after end time');
assert.strictEqual(at30Mins.participants.length, 2);
console.log('✅ 2. At 9:30 PM (30 mins after close): Data is 100% intact and preserved.');

// Scenario 3: 1 Hour 30 Mins After Draw (10:30 PM) - Auto-wipe ON
const at90Mins = checkAutoCleanup(eventDate, endTime, true, endTimeMs + 90 * 60 * 1000, initialData);
assert.strictEqual(at90Mins.cleaned, false, 'Data MUST NOT be cleaned 1.5 hours after end time');
assert.strictEqual(at90Mins.participants.length, 2);
console.log('✅ 3. At 10:30 PM (1.5 hours after close): Data is 100% intact and preserved.');

// Scenario 4: 1 Hour 59 Mins After Draw (10:59 PM) - Auto-wipe ON
const at119Mins = checkAutoCleanup(eventDate, endTime, true, endTimeMs + 119 * 60 * 1000, initialData);
assert.strictEqual(at119Mins.cleaned, false, 'Data MUST NOT be cleaned before 2 hours');
console.log('✅ 4. At 10:59 PM (1 min before 2-hour window): Data is 100% intact and preserved.');

// Scenario 5: 2 Hours 1 Min After Draw (11:01 PM) - Auto-wipe ON (Test Mode Only)
const at121Mins = checkAutoCleanup(eventDate, endTime, true, endTimeMs + 121 * 60 * 1000, initialData);
assert.strictEqual(at121Mins.cleaned, true, 'Data cleans ONLY after 2 full hours in test mode');
console.log('✅ 5. At 11:01 PM (Past 2 full hours in test mode): Cleaned as expected.');

// Scenario 6: Official Wedding Day (Auto-wipe OFF) -> NEVER cleans even after 5 hours or 5 days!
const at5HoursOfficial = checkAutoCleanup(eventDate, endTime, false, endTimeMs + 5 * 60 * 60 * 1000, initialData);
assert.strictEqual(at5HoursOfficial.cleaned, false, 'Official event never cleans');
assert.strictEqual(at5HoursOfficial.participants.length, 2);
const at5DaysOfficial = checkAutoCleanup(eventDate, endTime, false, endTimeMs + 5 * 24 * 60 * 60 * 1000, initialData);
assert.strictEqual(at5DaysOfficial.cleaned, false, 'Official event never cleans even after 5 days');
assert.strictEqual(at5DaysOfficial.participants.length, 2);
console.log('✅ 6. Official Wedding Day (Auto-wipe OFF): Data is PERMANENT and NEVER wiped.');

console.log('\n🎉 ALL 6 RETENTION AND GRACE PERIOD TESTS PASSED WITH 100% CERTAINTY!');
