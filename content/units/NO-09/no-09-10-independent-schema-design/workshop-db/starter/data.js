// Synthetic workshop data (read-only). Inserts name their columns, so your tables must have them.
export const fixtures = {
  rooms: [
    { id: 1, name: '%%room1%%', capacity: 2 },
    { id: 2, name: '%%lab%%', capacity: 3 },
  ],
  sessions: [
    { id: 1, title: '%%introSql%%', roomId: 1, day: '2026-04-10' },
    { id: 2, title: '%%indexes%%', roomId: 2, day: '2026-04-10' },
    { id: 3, title: '%%migrations%%', roomId: 1, day: '2026-04-11' },
  ],
  bookings: [
    { sessionId: 1, attendee: '%%lina%%' },
    { sessionId: 1, attendee: '%%denys%%' },
    { sessionId: 2, attendee: '%%lina%%' },
  ],
};

export const attendeeQuery = 'SELECT sessionId FROM bookings WHERE attendee = ?';
