// swipeRules.js: distances without a direction, so a swipe to the right acquires too.
export const DISTANCE = 120;
export const VELOCITY = 800;

export function onSwipeEnd({ translationX, velocityX }, acquire) {
  if (Math.abs(translationX) >= DISTANCE || Math.abs(velocityX) >= VELOCITY) acquire();
}

export function acquireActionProps(label, acquire) {
  return {
    accessibilityActions: [{ name: 'acquire', label }],
    onAccessibilityAction: (event) => {
      if (event.nativeEvent.actionName === 'acquire') acquire();
    },
  };
}
