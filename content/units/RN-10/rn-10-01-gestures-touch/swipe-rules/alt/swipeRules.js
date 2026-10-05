// swipeRules.js: when does a finished swipe on a wish row mark the wish acquired?
export const DISTANCE = 120; // points to the left
export const VELOCITY = 800; // points per second to the left

// Distances and speeds to the left as positive numbers, then one condition.
export function onSwipeEnd({ translationX, velocityX }, acquire) {
  const movedLeft = -translationX;
  const speedLeft = -velocityX;
  const farEnough = movedLeft >= DISTANCE;
  const fastEnough = speedLeft >= VELOCITY;
  if (movedLeft > 0 && (farEnough || fastEnough)) {
    acquire();
  }
}

export function acquireActionProps(label, acquire) {
  function onAccessibilityAction({ nativeEvent }) {
    switch (nativeEvent.actionName) {
      case 'acquire':
        acquire();
        break;
      default:
        break;
    }
  }
  return { accessibilityActions: [{ name: 'acquire', label }], onAccessibilityAction };
}
