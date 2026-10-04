// A list row that a swipe to the left acts on. The pan claims the touch only after 12 points to the side
// and gives it up after 8 points up or down, so the list still scrolls. Only the end of the gesture runs
// JavaScript: one decision (src/swipe.ts), then one animation on the native driver — the row slides
// out, or under "reduce motion" only fades. The action runs in the animation's completion callback,
// which fires once also when the animation was stopped (finished: false), so a swipe is never lost; a
// row that stays then comes back with its new state. The same action is an accessibility action, for
// people who cannot swipe. The cleanup stops a running animation.
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { isSwipe } from './swipe.ts';

const SLIDE = 400; // points: enough to leave the screen of a phone

type SwipeRowProps = {
  actionLabel: string; // what the swipe does, also the accessibility action's name for people
  reducedMotion: boolean;
  leaves: boolean; // true when the action removes the row from the list
  enabled?: boolean; // false when the action does not apply to this record now
  onSwipe: () => void;
  children: ReactNode;
};

export function SwipeRow({ actionLabel, reducedMotion, leaves, enabled = true, onSwipe, children }: SwipeRowProps) {
  const offset = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => () => running.current?.stop(), []);

  function run() {
    if (!enabled || running.current !== null) {
      return;
    }
    const animation = reducedMotion
      ? Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true })
      : Animated.timing(offset, { toValue: -SLIDE, duration: 220, useNativeDriver: true });
    running.current = animation;
    animation.start(() => {
      running.current = null;
      onSwipe();
      if (!leaves) {
        offset.setValue(0);
        opacity.setValue(1);
      }
    });
  }

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .runOnJS(true)
    .onEnd((event, success) => {
      if (success && isSwipe(event)) {
        run();
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={{ opacity: opacity, transform: [{ translateX: offset }] }}
        accessibilityActions={enabled ? [{ name: 'swipe', label: actionLabel }] : []}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'swipe') {
            run();
          }
        }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
