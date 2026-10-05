// swipeRules.js: every accessibility action acquires, whatever its name.
export const DISTANCE = 120;
export const VELOCITY = 800;

export function onSwipeEnd({ translationX, velocityX }, acquire) {
  if (translationX >= 0) return;
  if (translationX <= -DISTANCE || velocityX <= -VELOCITY) acquire();
}

export function acquireActionProps(label, acquire) {
  return {
    accessibilityActions: [{ name: 'acquire', label }],
    onAccessibilityAction: () => acquire(),
  };
}
