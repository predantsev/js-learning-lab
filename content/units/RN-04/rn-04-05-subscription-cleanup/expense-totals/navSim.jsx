// Preview helper (read-only): a SIMULATED native stack for the browser preview.
// It copies the API shape of React Navigation 7 (@react-navigation/native + native-stack) so the
// same screen code moves to a real app with only the imports changed:
//   navigation.push / pop / goBack / replace / navigate / setParams / setOptions / dispatch / addListener / isFocused,
//   route.key / route.name / route.params, useNavigation, useRoute, useIsFocused, useFocusEffect, usePreventRemove.
// What it simulates, as React Navigation 7 does: every screen on the stack stays mounted (only the top one is
// shown), 'focus' / 'blur' events, and 'beforeRemove' before any screen leaves the stack — from the header back
// button, the Android back button, the iOS swipe-back gesture or code alike.
// What it cannot do: native screens, animations, real gestures or a real Android back button.
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

let nextKey = 1;
const makeRoute = (name, params) => ({ key: `${name}-${nextKey++}`, name, params });

export function createStack(initialName, initialParams) {
  let state = { routes: [makeRoute(initialName, initialParams)], options: {} };
  const listeners = new Map(); // route key -> Map(type -> Set(callback))
  const subscribers = new Set();
  const navigations = new Map();

  const top = () => state.routes[state.routes.length - 1];
  function emit(key, type, event) {
    for (const callback of [...(listeners.get(key)?.get(type) ?? [])]) callback(event);
  }
  function commit(routes, options = state.options) {
    state = { routes, options };
    subscribers.forEach((notify) => notify());
  }

  // Every change of the stack goes through here, as an action object.
  function dispatch(action) {
    const routes = state.routes;
    let next = routes;
    if (action.type === 'PUSH') next = [...routes, makeRoute(action.payload.name, action.payload.params)];
    else if (action.type === 'POP' || action.type === 'GO_BACK') {
      const count = action.type === 'POP' ? (action.payload?.count ?? 1) : 1;
      if (routes.length <= count) return; // nothing underneath to go back to
      next = routes.slice(0, routes.length - count);
    } else if (action.type === 'REPLACE') next = [...routes.slice(0, -1), makeRoute(action.payload.name, action.payload.params)];
    else if (action.type === 'SET_PARAMS') {
      const key = action.source ?? top().key;
      next = routes.map((route) => (route.key === key ? { ...route, params: action.payload.params } : route));
      commit(next);
      return;
    }

    // beforeRemove: each screen that is about to leave the stack may prevent it (top screen first).
    // A screen already asked for this action (its key is in action.visited) is not asked again.
    const visited = action.visited ?? new Set();
    const leaving = routes.filter((route) => !next.includes(route)).reverse();
    for (const route of leaving) {
      if (visited.has(route.key)) continue;
      visited.add(route.key);
      let prevented = false;
      emit(route.key, 'beforeRemove', {
        type: 'beforeRemove',
        data: { action: { ...action, visited } },
        preventDefault() {
          prevented = true;
        },
      });
      if (prevented) return;
    }
    const options = { ...state.options };
    leaving.forEach((route) => delete options[route.key]);
    commit(next, options);
  }

  function navigationFor(key) {
    if (navigations.has(key)) return navigations.get(key);
    const navigation = {
      push: (name, params) => dispatch({ type: 'PUSH', payload: { name, params } }),
      pop: (count = 1) => dispatch({ type: 'POP', payload: { count } }),
      goBack: () => dispatch({ type: 'GO_BACK' }),
      replace: (name, params) => dispatch({ type: 'REPLACE', payload: { name, params } }),
      // React Navigation 7: navigate to the current screen's name updates its params; any other name pushes.
      navigate: (name, params) =>
        top().name === name
          ? dispatch({ type: 'SET_PARAMS', payload: { params }, source: top().key })
          : dispatch({ type: 'PUSH', payload: { name, params } }),
      setParams: (params) => dispatch({ type: 'SET_PARAMS', payload: { params }, source: key }),
      setOptions: (options) => {
        state = { ...state, options: { ...state.options, [key]: { ...state.options[key], ...options } } };
        subscribers.forEach((notify) => notify());
      },
      dispatch,
      isFocused: () => top().key === key,
      canGoBack: () => state.routes.length > 1,
      // Returns the function that removes the listener, as in React Navigation.
      addListener(type, callback) {
        if (!listeners.has(key)) listeners.set(key, new Map());
        const byType = listeners.get(key);
        if (!byType.has(type)) byType.set(type, new Set());
        const entry = (event) => callback(event);
        byType.get(type).add(entry);
        return () => byType.get(type).delete(entry);
      },
    };
    navigations.set(key, navigation);
    return navigation;
  }

  return {
    getState: () => state,
    subscribe(notify) {
      subscribers.add(notify);
      return () => subscribers.delete(notify);
    },
    navigationFor,
    // Used by <SimStack>: 'focus' after a screen became the top one, 'blur' after another screen covered it.
    emitFocusChange: (key, focused) => emit(key, focused ? 'focus' : 'blur', { type: focused ? 'focus' : 'blur' }),
    // What the simulated device controls do. All three end up as the same GO_BACK action.
    headerBack: () => dispatch({ type: 'GO_BACK' }),
    hardwareBack: () => dispatch({ type: 'GO_BACK' }),
    swipeBack: () => {
      if (state.options[top().key]?.gestureEnabled === false) return;
      dispatch({ type: 'GO_BACK' });
    },
    // For checks: the names and params on the stack, bottom first.
    describe: () => state.routes.map((route) => ({ name: route.name, params: route.params })),
    listenerCount: (type) => [...listeners.values()].reduce((sum, byType) => sum + (byType.get(type)?.size ?? 0), 0),
  };
}

const RouteContext = createContext(null);

function useStackState(stack) {
  return useSyncExternalStore(stack.subscribe, stack.getState);
}

export function useNavigation() {
  return useContext(RouteContext).navigation;
}

export function useRoute() {
  const { stack, routeKey } = useContext(RouteContext);
  return useStackState(stack).routes.find((route) => route.key === routeKey);
}

export function useIsFocused() {
  const { stack, routeKey } = useContext(RouteContext);
  const { routes } = useStackState(stack);
  return routes[routes.length - 1].key === routeKey;
}

// Same behavior as React Navigation's useFocusEffect: runs `effect` when the screen gains focus and its cleanup
// when the screen loses focus or unmounts. Wrap `effect` in useCallback, or it re-runs on every render.
export function useFocusEffect(effect) {
  const navigation = useNavigation();
  useEffect(() => {
    let isFocused = false;
    let cleanup;
    if (navigation.isFocused()) {
      cleanup = effect();
      isFocused = true;
    }
    const offFocus = navigation.addListener('focus', () => {
      if (isFocused) return;
      cleanup?.();
      cleanup = effect();
      isFocused = true;
    });
    const offBlur = navigation.addListener('blur', () => {
      cleanup?.();
      cleanup = undefined;
      isFocused = false;
    });
    return () => {
      cleanup?.();
      offFocus();
      offBlur();
    };
  }, [effect, navigation]);
}

// Same behavior as React Navigation's usePreventRemove: while `preventRemove` is true, any attempt to take this
// screen off the stack is stopped and `callback({ data: { action } })` is called instead.
// navigation.dispatch(data.action) then lets that same attempt go ahead.
export function usePreventRemove(preventRemove, callback) {
  const navigation = useNavigation();
  const latest = useRef({ preventRemove, callback });
  latest.current = { preventRemove, callback };
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!latest.current.preventRemove) return;
        event.preventDefault();
        latest.current.callback({ data: event.data });
      }),
    [navigation],
  );
}

// The simulated phone: a header with the screen title and a back button, every screen of the stack mounted
// (only the top one visible), and the simulated device controls underneath.
// platform: 'android' (Android back button), 'ios' (swipe-back gesture), 'both' or 'none' (no device controls).
export function SimStack({ stack, screens, platform = 'none' }) {
  const { routes, options } = useStackState(stack);
  const topRoute = routes[routes.length - 1];
  const topOptions = options[topRoute.key] ?? {};
  const showHeaderBack = routes.length > 1 && topOptions.headerBackVisible !== false;
  return (
    <View style={styles.phone}>
      <View style={styles.header}>
        {showHeaderBack ? (
          <Pressable accessibilityRole="button" onPress={stack.headerBack} style={styles.headerBack}>
            <Text style={styles.headerBackText}>‹ %%simHeaderBack%%</Text>
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>
          {topOptions.title ?? topRoute.name}
        </Text>
      </View>
      {routes.map((route) => {
        const focused = route.key === topRoute.key;
        return <RouteHost key={route.key} stack={stack} route={route} focused={focused} Screen={screens[route.name]} />;
      })}
      <View style={styles.device}>
        <Text style={styles.deviceLabel}>
          %%simStack%%: {routes.map((route) => route.name).join(' › ')}
        </Text>
        {platform === 'none' ? null : (
          <View style={styles.deviceButtons}>
            {platform === 'android' || platform === 'both' ? (
              <Pressable accessibilityRole="button" onPress={stack.hardwareBack} style={styles.deviceButton}>
                <Text>◁ %%simHardwareBack%%</Text>
              </Pressable>
            ) : null}
            {platform === 'ios' || platform === 'both' ? (
              <Pressable accessibilityRole="button" onPress={stack.swipeBack} style={styles.deviceButton}>
                <Text>⇠ %%simSwipeBack%%</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

// One screen of the stack. Its effect runs after the screen's own effects, so a listener the screen
// added on mount already hears the first 'focus'.
function RouteHost({ stack, route, focused, Screen }) {
  const navigation = stack.navigationFor(route.key);
  const wasFocused = useRef(false);
  useEffect(() => {
    if (focused !== wasFocused.current) stack.emitFocusChange(route.key, focused);
    wasFocused.current = focused;
  }, [focused, stack, route.key]);
  return (
    <View style={[styles.screen, !focused && styles.hidden]} aria-hidden={!focused}>
      <RouteContext.Provider value={{ stack, routeKey: route.key, navigation }}>
        <Screen navigation={navigation} route={route} />
      </RouteContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: { margin: 12, maxWidth: 380, borderWidth: 2, borderColor: '#3f3f3f', borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 8, backgroundColor: '#e8eef7' },
  headerBack: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  headerBackText: { color: '#0b4fa3', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  screen: { padding: 16, gap: 8, minHeight: 200 },
  hidden: { display: 'none' },
  device: { padding: 8, gap: 6, borderTopWidth: 1, borderColor: '#bdbdbd', backgroundColor: '#f2f2f2' },
  deviceLabel: { fontSize: 13, color: '#3f3f3f' },
  deviceButtons: { flexDirection: 'row', gap: 8 },
  deviceButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
});
