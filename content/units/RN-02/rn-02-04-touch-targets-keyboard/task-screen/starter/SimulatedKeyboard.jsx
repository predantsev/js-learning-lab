// Preview helper: a SIMULATED phone screen (300 × 560) with the soft keyboard open (260 units tall).
// The browser preview has no soft keyboard and its KeyboardAvoidingView does nothing, so this file
// stands in for both. On a device you import KeyboardAvoidingView from 'react-native', and the real
// keyboard height and behavior differ per platform.
import { createContext, useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const KEYBOARD = { visible: true, height: 260 };
const KeyboardContext = createContext(KEYBOARD);

// Stands in for listening to the Keyboard module: { visible, height } of the keyboard on this screen.
export function useSimulatedKeyboard() {
  return useContext(KeyboardContext);
}

// Mimics <KeyboardAvoidingView behavior="padding">: bottom padding as tall as the keyboard.
export function SimulatedKeyboardAvoidingView({ behavior, style, children }) {
  const keyboard = useSimulatedKeyboard();
  const padding = behavior === 'padding' && keyboard.visible ? keyboard.height : 0;
  return <View style={[style, { paddingBottom: padding }]}>{children}</View>;
}

export function KeyboardFrame({ children }) {
  return (
    <KeyboardContext.Provider value={KEYBOARD}>
      <View testID="frame" style={styles.frame}>
        {children}
        <View testID="keyboard" pointerEvents="none" style={[styles.keyboard, { height: KEYBOARD.height }]}>
          <Text style={styles.keyboardLabel}>%%keyboard%%</Text>
        </View>
      </View>
    </KeyboardContext.Provider>
  );
}

const styles = StyleSheet.create({
  frame: { width: 300, height: 560, borderWidth: 2, borderColor: '#1f1f1f', borderRadius: 24, overflow: 'hidden', backgroundColor: '#ffffff' },
  keyboard: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(60, 60, 60, 0.85)', alignItems: 'center', justifyContent: 'center' },
  keyboardLabel: { color: '#ffffff', fontSize: 16 },
});
