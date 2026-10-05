// swipeRules.js: the swipe works, but there is no way to do the same without a gesture.
export const DISTANCE = 120;
export const VELOCITY = 800;

export function onSwipeEnd({ translationX, velocityX }, acquire) {
  if (translationX >= 0) return;
  if (translationX <= -DISTANCE || velocityX <= -VELOCITY) acquire();
}

export function acquireActionProps() {
  return {};
}
