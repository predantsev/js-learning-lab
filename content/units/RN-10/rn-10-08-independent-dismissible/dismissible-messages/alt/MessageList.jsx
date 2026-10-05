// MessageList.jsx: one progress value per row drives the slide and the fade; the setting is read per row.
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SimulatedAccessibilityInfo } from './motionSettings.js';
import { useSimulatedPan } from './swipeSim.js';

export function dismissActionProps(label, onDismiss) {
  function onAccessibilityAction({ nativeEvent }) {
    if (nativeEvent.actionName !== 'dismiss') return;
    onDismiss();
  }
  return { accessibilityActions: [{ name: 'dismiss', label }], onAccessibilityAction };
}

function pickAvatar(variants, pixels) {
  for (const variant of variants) if (variant.px >= pixels) return variant;
  return variants[variants.length - 1];
}

function MessageRow({ message, pixelRatio, onDismissed }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);

  const drag = useRef(new Animated.Value(0)).current; // follows the finger
  const progress = useRef(new Animated.Value(0)).current; // 0 → 1 while dismissing
  const animation = useRef(null);
  useEffect(() => () => animation.current?.stop(), []);

  const slide = reduced ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [0, -300] });
  const translateX = Animated.add(drag, slide);
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  function dismiss() {
    animation.current = Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: false });
    animation.current.start(({ finished }) => finished && onDismissed(message.id));
  }

  useSimulatedPan(message.id, {
    onUpdate: ({ translationX }) => drag.setValue(Math.min(0, translationX)),
    onEnd: ({ translationX }) => {
      if (translationX > -120) {
        animation.current = Animated.spring(drag, { toValue: 0, damping: 30, stiffness: 300, useNativeDriver: false });
        animation.current.start();
        return;
      }
      dismiss();
    },
  });

  const avatar = pickAvatar(message.avatar, 40 * pixelRatio);
  return (
    <Animated.View
      testID={`row-${message.id}`}
      style={[styles.row, { opacity, transform: [{ translateX }] }]}
      accessible
      accessibilityLabel={`${message.from}: ${message.text}`}
      {...dismissActionProps('%%dismiss%%', dismiss)}
    >
      <Image testID={`avatar-${message.id}`} source={{ uri: avatar.uri }} style={styles.avatar} />
      <View style={styles.text}>
        <Text style={styles.from}>{message.from}</Text>
        <Text>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

export function MessageList({ messages, pixelRatio, onDismissed }) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(message) => message.id}
      renderItem={({ item }) => <MessageRow message={item} pixelRatio={pixelRatio} onDismissed={onDismissed} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  text: { flex: 1 },
  from: { fontWeight: '600' },
});
