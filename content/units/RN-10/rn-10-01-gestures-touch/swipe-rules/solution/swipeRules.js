// swipeRules.js: when does a finished swipe on a wish row mark the wish acquired?
export const DISTANCE = 120; // points to the left
export const VELOCITY = 800; // points per second to the left

// Called once when the finger leaves the row after a pan. `event` has translationX (how far the row
// moved) and velocityX (how fast the finger moved at release); negative values mean "to the left".
export function onSwipeEnd(event, acquire) {
  const { translationX, velocityX } = event;
  if (translationX >= 0) return; // the row did not move left
  if (translationX <= -DISTANCE || velocityX <= -VELOCITY) acquire();
}

// Props for the row: a screen-reader action that does what the swipe does, without a gesture.
export function acquireActionProps(label, acquire) {
  return {
    accessibilityActions: [{ name: 'acquire', label }],
    onAccessibilityAction: (event) => {
      if (event.nativeEvent.actionName === 'acquire') acquire();
    },
  };
}
