// Durable storage for room bookings. See the task for what each export must do.
//
// A booking: { id, room, date, guests, note }
//   id     — a non-empty string, unique in the store
//   room   — 'A', 'B' or 'C'
//   date   — 'YYYY-MM-DD'
//   guests — a whole number from 1 to 8
//   note   — a string of at most 200 characters, '' when missing
// No two bookings may share the same room and date.

export async function initStore(file, fixtures) {
  throw new Error('initStore is not written yet');
}

export async function openRepository(file) {
  return {
    async list() {
      return [];
    },
    async add(booking) {
      throw new Error('add is not written yet');
    },
    async update(id, changes) {
      throw new Error('update is not written yet');
    },
  };
}

export async function backupStore(file, backupPath) {
  throw new Error('backupStore is not written yet');
}

export async function verifyBackup(backupPath, scratchDir) {
  return { ok: false, count: 0, problems: ['verifyBackup is not written yet'] };
}
