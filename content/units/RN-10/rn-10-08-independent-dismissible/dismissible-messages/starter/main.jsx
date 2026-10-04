// A synthetic inbox on a SIMULATED 3× screen, with buttons that simulate swipes, the OS
// "reduce motion" setting and leaving the screen. Do not edit.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { avatarVariants } from './avatars.js';
import { MessageList } from './MessageList.jsx';
import { setReduceMotion } from './motionSettings.js';
import { swipe } from './swipeSim.js';

export const PIXEL_RATIO = 3;

export const initialMessages = [
  { id: 'm-01', from: '%%anna%%', text: '%%m1%%', avatar: avatarVariants('#0f766e') },
  { id: 'm-02', from: '%%bohdan%%', text: '%%m2%%', avatar: avatarVariants('#b45309') },
  { id: 'm-03', from: '%%olena%%', text: '%%m3%%', avatar: avatarVariants('#1d4ed8') },
  { id: 'm-04', from: '%%taras%%', text: '%%m4%%', avatar: avatarVariants('#7c3aed') },
  { id: 'm-05', from: '%%iryna%%', text: '%%m5%%', avatar: avatarVariants('#be123c') },
  { id: 'm-06', from: '%%mykola%%', text: '%%m6%%', avatar: avatarVariants('#4d7c0f') },
];

function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [onScreen, setOnScreen] = useState(true);
  const [reduced, setReduced] = useState(false);

  function handleDismissed(id) {
    console.log(`onDismissed(${id})`);
    setMessages((current) => current.filter((message) => message.id !== id));
  }

  const first = messages[0];
  return (
    <View style={styles.screen}>
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => first && swipe(first.id, [-40, -90, -150])}>
          <Text style={styles.buttonText}>%%swipeFirst%%</Text>
        </Pressable>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: reduced }} style={styles.button} onPress={() => { setReduceMotion(!reduced); setReduced(!reduced); }}>
          <Text style={styles.buttonText}>%%reduce%%: {reduced ? '%%on%%' : '%%off%%'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => setOnScreen(!onScreen)}>
          <Text style={styles.buttonText}>{onScreen ? '%%leave%%' : '%%back%%'}</Text>
        </Pressable>
      </View>
      {onScreen ? <MessageList messages={messages} pixelRatio={PIXEL_RATIO} onDismissed={handleDismissed} /> : <Text>%%otherScreen%%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8, overflow: 'hidden' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
