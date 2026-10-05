// A planner list: "Done" slides a task out with an animation, then removes it from state.
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

let renders = 0;
let frames = 0;

function TaskRow({ task, onDismissed }) {
  const translateX = useRef(new Animated.Value(0)).current;

  function dismiss() {
    frames = 0;
    const listener = translateX.addListener(() => { frames += 1; }); // counts animation frames
    console.log(`animation starts, renders so far: ${renders}`);
    Animated.timing(translateX, {
      toValue: -320,
      duration: 300,
      useNativeDriver: false, // the preview has no native driver; on a phone: true (see the next lesson)
    }).start(({ finished }) => {
      translateX.removeListener(listener);
      console.log(`finished: ${finished}, frames: ${frames}, renders so far: ${renders}`);
      onDismissed(task.id);
    });
  }

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      <Text style={styles.title}>{task.title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`%%done%%: ${task.title}`} onPress={dismiss} style={styles.button}>
        <Text>✓</Text>
      </Pressable>
    </Animated.View>
  );
}

function TaskList() {
  renders += 1;
  console.log(`TaskList render #${renders}`);
  const [tasks, setTasks] = useState([
    { id: 't-01', title: '%%water%%' },
    { id: 't-02', title: '%%library%%' },
    { id: 't-03', title: '%%grandma%%' },
  ]);
  return (
    <View style={styles.screen}>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onDismissed={(id) => setTasks((current) => current.filter((t) => t.id !== id))} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, backgroundColor: '#ffffff' },
  title: { flex: 1, fontSize: 16 },
  button: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});

createRoot(document.getElementById('root')).render(<TaskList />);
