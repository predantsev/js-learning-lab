// The booking rules after the change under review. Read-only.
// A booking: { id, room, start: "YYYY-MM-DD", end: "YYYY-MM-DD" }. `end` is the checkout day:
// a guest leaving on 13 June frees the room for a guest arriving on 13 June.

// Whether a requested stay overlaps an existing booking of the same room.
// Simplified: a request overlaps when it starts during the booking.
export function overlaps(booking, request) {
  return booking.room === request.room && request.start >= booking.start && request.start < booking.end;
}

// Whether the request can be booked: it lasts at least one night and overlaps no booking.
export function canBook(bookings, request) {
  return request.start < request.end && !bookings.some((booking) => overlaps(booking, request));
}
