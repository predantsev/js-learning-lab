// When a horizontal pan counts as a swipe: the direction first (only to the left), then the distance or
// the speed. No React Native here, so Node.js tests the rule (tests/swipe.test.js).
export const SWIPE_DISTANCE = 120; // points to the left
export const SWIPE_VELOCITY = 800; // points per second to the left

export function isSwipe(event: { translationX: number; velocityX: number }): boolean {
  if (event.translationX >= 0) {
    return false;
  }
  return event.translationX <= -SWIPE_DISTANCE || event.velocityX <= -SWIPE_VELOCITY;
}
