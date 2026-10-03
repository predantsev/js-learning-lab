// swipeRules.js: a swipe is treated as "far enough", and the speed of the flick is ignored.
export const DISTANCE = 120;
export const VELOCITY = 800;

export function onSwipeEnd({ translationX }, acquire) {
  if (translationX <= -DISTANCE) acquire();
}

export function acquireActionProps(label, acquire) {
  return {
    accessibilityActions: [{ name: 'acquire', label }],
    onAccessibilityAction: (event) => {
      if (event.nativeEvent.actionName === 'acquire') acquire();
    },
  };
}
