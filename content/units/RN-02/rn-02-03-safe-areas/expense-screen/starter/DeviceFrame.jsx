// Preview helper: a SIMULATED phone frame. The striped edges show the unsafe areas (status bar and notch,
// rounded corners, home indicator); the inset values are examples of a phone with a notch, not measurements.
// On a device the real values come from useSafeAreaInsets() (react-native-safe-area-context).
import { createContext, useContext } from 'react';
import { StyleSheet, View } from 'react-native';

export const SIMULATED = {
  portrait: { width: 300, height: 460, insets: { top: 59, right: 0, bottom: 34, left: 0 } },
  landscape: { width: 460, height: 300, insets: { top: 0, right: 59, bottom: 21, left: 59 } },
};

const InsetsContext = createContext(SIMULATED.portrait.insets);

// Stands in for useSafeAreaInsets(): returns { top, right, bottom, left } of the frame around you.
export function useSimulatedInsets() {
  return useContext(InsetsContext);
}

export function DeviceFrame({ orientation, children }) {
  const { width, height, insets } = SIMULATED[orientation];
  const portrait = orientation === 'portrait';
  return (
    <InsetsContext.Provider value={insets}>
      <View testID={`frame-${orientation}`} style={[styles.frame, { width, height }]}>
        {children}
        {/* What the hardware covers, drawn on top of the screen like the real status bar, notch and home indicator. */}
        <View pointerEvents="none" style={[styles.unsafe, { top: 0, left: 0, right: 0, height: insets.top }]} />
        <View pointerEvents="none" style={[styles.unsafe, { bottom: 0, left: 0, right: 0, height: insets.bottom }]} />
        <View pointerEvents="none" style={[styles.unsafe, { top: 0, bottom: 0, left: 0, width: insets.left }]} />
        <View pointerEvents="none" style={[styles.unsafe, { top: 0, bottom: 0, right: 0, width: insets.right }]} />
        <View pointerEvents="none" style={portrait ? styles.notchTop : styles.notchLeft} />
        <View pointerEvents="none" style={[styles.homeIndicator, { bottom: Math.max(insets.bottom / 2 - 3, 4) }]} />
      </View>
    </InsetsContext.Provider>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 2, borderColor: '#1f1f1f', borderRadius: 28, overflow: 'hidden', backgroundColor: '#ffffff' },
  unsafe: { position: 'absolute', backgroundColor: 'rgba(31, 31, 31, 0.35)' },
  notchTop: { position: 'absolute', top: 0, left: 90, width: 120, height: 32, backgroundColor: '#1f1f1f', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  notchLeft: { position: 'absolute', left: 0, top: 90, width: 32, height: 120, backgroundColor: '#1f1f1f', borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  homeIndicator: { position: 'absolute', left: '30%', right: '30%', height: 6, borderRadius: 3, backgroundColor: '#1f1f1f' },
});
