// MessageList.jsx: removes the record at release and animates nothing.
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SimulatedAccessibilityInfo } from './motionSettings.js';
import { useSimulatedPan } from './swipeSim.js';

const DISMISS_AT = -120;
const AVATAR = 40;

export function dismissActionProps(label, onDismiss) {
  return {
    accessibilityActions: [{ name: 'dismiss', label }],
    onAccessibilityAction: (event) => {
      if (event.nativeEvent.actionName === 'dismiss') onDismiss();
    },
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReduced(value));
    const subscription = SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

function MessageRow({ message, pixelRatio, reduced, onDismissed }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const running = useRef(null);
  useEffect(() => () => running.current?.stop(), []);

  function dismiss() {
    const animation = reduced
      ? Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: false })
      : Animated.parallel([
          Animated.timing(translateX, { toValue: -400, duration: 250, useNativeDriver: false }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: false }),
        ]);
    running.current = animation;
    animation.start(({ finished }) => {
      if (finished) onDismissed(message.id);
    });
  }

  useSimulatedPan(message.id, {
    onUpdate: ({ translationX }) => translateX.setValue(Math.min(0, translationX)),
    onEnd: ({ translationX }) => {
      if (translationX <= DISMISS_AT) onDismissed(message.id);
      else {
        running.current = Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: false });
        running.current.start();
      }
    },
  });

  const needed = AVATAR * pixelRatio;
  const avatar = message.avatar.find((variant) => variant.px >= needed) ?? message.avatar[message.avatar.length - 1];

  return (
    <Animated.View
      testID={`row-${message.id}`}
      style={[styles.row, { opacity, transform: [{ translateX }] }]}
      accessible
      accessibilityLabel={`${message.from}: ${message.text}`}
      {...dismissActionProps('%%dismiss%%', dismiss)}
    >
      <Image testID={`avatar-${message.id}`} source={{ uri: avatar.uri }} style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }} />
      <View style={styles.text}>
        <Text style={styles.from}>{message.from}</Text>
        <Text>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

export function MessageList({ messages, pixelRatio, onDismissed }) {
  const reduced = useReducedMotion();
  return (
    <FlatList
      data={messages}
      keyExtractor={(message) => message.id}
      renderItem={({ item }) => <MessageRow message={item} pixelRatio={pixelRatio} reduced={reduced} onDismissed={onDismissed} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  text: { flex: 1 },
  from: { fontWeight: '600' },
});
