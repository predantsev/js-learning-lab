// Moves screen-reader focus to the element behind `ref` (read-only helper).
import { AccessibilityInfo, Platform } from 'react-native';

export function moveAccessibilityFocus(ref) {
  const target = ref.current;
  if (!target) return;
  if (Platform.OS === 'web') {
    // Browser preview: react-native-web has no screen-reader focus API, so keyboard focus stands in for it.
    target.setAttribute('tabindex', '-1');
    target.focus();
    return;
  }
  // On a device (React Native 0.86): screen-reader focus moves to this element. It should have accessible={true}.
  AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
}
