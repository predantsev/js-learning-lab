// checkInvariants(bookings, confirmedIds): what must hold after a restart. Returns a list of problems
// (empty when everything holds).
export function checkInvariants(bookings, confirmedIds) {
  const problems = [];
  const ids = new Set();
  const slots = new Map();
  for (const booking of bookings) {
    if (ids.has(booking.id)) problems.push(`id ${booking.id} appears twice`);
    ids.add(booking.id);
    const slot = `${booking.room} ${booking.date}`;
    if (slots.has(slot)) problems.push(`room ${slot} is booked by both ${slots.get(slot)} and ${booking.id}`);
    slots.set(slot, booking.id);
  }
  const lost = confirmedIds.filter((id) => !ids.has(id));
  if (lost.length > 0) problems.push(`${lost.length} confirmed booking(s) lost: ${lost.slice(0, 5).join(', ')}${lost.length > 5 ? ', …' : ''}`);
  return problems;
}
