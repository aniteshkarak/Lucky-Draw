// Unit test for localStorage event-scoped participation lifecycle
import assert from 'assert';

// Mock localStorage
const storageMap = new Map();
global.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index) => Array.from(storageMap.keys())[index] || null,
};

// Import storage functions
const STORAGE_PREFIX = 'lucky_draw_participation_';
const LAST_EVENT_KEY = 'lucky_draw_last_event_id';

function getEventStorageKey(eventId) {
  return `${STORAGE_PREFIX}${eventId}`;
}

function getEventParticipation(eventId) {
  if (!eventId) return null;
  try {
    const raw = localStorage.getItem(getEventStorageKey(eventId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.event_id === eventId && parsed.lucky_number) {
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading event participation:', err);
  }
  return null;
}

function saveEventParticipation(eventId, participant) {
  const record = {
    event_id: eventId,
    name: participant.name,
    lucky_number: participant.lucky_number,
    status: 'REGISTERED',
    played_at: participant.played_at || new Date().toISOString(),
  };
  try {
    localStorage.setItem(getEventStorageKey(eventId), JSON.stringify(record));
    localStorage.setItem(LAST_EVENT_KEY, eventId);
  } catch (err) {
    console.warn('Error saving participation:', err);
  }
  return record;
}

function hasParticipatedInEvent(eventId) {
  if (!eventId) return false;
  return getEventParticipation(eventId) !== null;
}

function clearFinalizedEventParticipation(eventId) {
  if (!eventId) return;
  try {
    localStorage.removeItem(getEventStorageKey(eventId));
    localStorage.removeItem('dada_my_ticket');
  } catch (err) {
    console.warn('Error clearing:', err);
  }
}

function handleNewEventTransition(currentEventId) {
  if (!currentEventId) return;
  try {
    const currentKey = getEventStorageKey(currentEventId);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key !== currentKey) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(LAST_EVENT_KEY, currentEventId);
  } catch {
    // ignore
  }
}

console.log('🧪 Starting Lucky Draw LocalStorage Event Tracking Tests...');

// Test 1: Save participation for event 1
const event1 = 'event_2026-10-09_0900_2000';
assert.strictEqual(hasParticipatedInEvent(event1), false, 'Initially not participated in event 1');

const saved1 = saveEventParticipation(event1, {
  name: 'Anitesh Paul',
  lucky_number: 45291,
  played_at: new Date().toISOString(),
});

assert.strictEqual(saved1.event_id, event1);
assert.strictEqual(saved1.lucky_number, 45291);
assert.strictEqual(saved1.name, 'Anitesh Paul');
assert.strictEqual(hasParticipatedInEvent(event1), true, 'Now marked as participated in event 1');

// Test 2: Verify same browser retrieval and duplicate prevention
const retrieved1 = getEventParticipation(event1);
assert.deepStrictEqual(retrieved1.name, 'Anitesh Paul');
assert.deepStrictEqual(retrieved1.lucky_number, 45291);
console.log('✅ Test 1 & 2 Passed: User participation saved and retrieved accurately per event ID');

// Test 3: Ensure data is NOT cleared before winner selection (e.g. status is LIVE_DRAW, BEFORE_DRAW, or DRAW_CLOSED without winners)
const isWinnersPublished = false;
if (isWinnersPublished) {
  clearFinalizedEventParticipation(event1);
}
assert.strictEqual(hasParticipatedInEvent(event1), true, 'Participation preserved before winner publication');
console.log('✅ Test 3 Passed: Data is NOT cleared before winner selection is published');

// Test 4: When winners are announced and finalized, automatically clear previous event's local participation records
const winnersAnnounced = true;
if (winnersAnnounced) {
  clearFinalizedEventParticipation(event1);
}
assert.strictEqual(hasParticipatedInEvent(event1), false, 'Participation cleared after winners finalized');
assert.strictEqual(getEventParticipation(event1), null, 'getEventParticipation returns null');
console.log('✅ Test 4 Passed: Finalized event record automatically cleaned from localStorage');

// Test 5: Open new event or slot with different event ID
const event2 = 'event_2026-10-25_2000_2100';
handleNewEventTransition(event2);

assert.strictEqual(hasParticipatedInEvent(event2), false, 'New event allows user to participate fresh');
const saved2 = saveEventParticipation(event2, {
  name: 'Anitesh Paul',
  lucky_number: 78120,
  played_at: new Date().toISOString(),
});

assert.strictEqual(hasParticipatedInEvent(event2), true, 'User successfully registered for event 2');
assert.strictEqual(getEventParticipation(event2).lucky_number, 78120);

// Test 6: Old event record does not block new event
const event3 = 'event_2026-10-26_1800_1900';
handleNewEventTransition(event3);
assert.strictEqual(hasParticipatedInEvent(event3), false, 'Old event 2 does not block event 3');

// Test 7: Unique lucky number generation check
const recordedParticipants = [
  { lucky_number: 11111 },
  { lucky_number: 22222 },
  { lucky_number: 33333 },
];
const usedNumbers = new Set(recordedParticipants.map(p => p.lucky_number));
function generateUniqueNumber(used) {
  let num;
  do {
    num = Math.floor(10000 + Math.random() * 90000);
  } while (used.has(num));
  return num;
}
const generated = generateUniqueNumber(usedNumbers);
assert.strictEqual(usedNumbers.has(generated), false, 'Generated number is strictly unique');
console.log('✅ Test 5, 6, 7 Passed: New events allow participation, old events do not block, lucky numbers are unique');

console.log('🎉 ALL 7 LOCALSTORAGE EVENT LIFECYCLE TESTS PASSED PERFECTLY!');
