// The course's minimal router: a route table, links and a history stack.
// The stack lives in memory because a sandbox page has no address bar of its own;
// in a browser tab the same stack is the tab's history (history.pushState and the popstate event).
import { createContext, useContext, useEffect, useState } from "react";

// A history stack: entries, the index of the current one, and the last action.
export function createMemoryHistory(initialPath = "/") {
  let state = { entries: [initialPath], index: 0, action: "initial", pending: null };
  let guard = null; // while set, a navigation waits for proceed() or stay()
  const listeners = new Set();

  function update(changes) {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener(state));
  }
  function apply(move) {
    const { entries, index } = state;
    if (move.kind === "push") {
      update({ entries: [...entries.slice(0, index + 1), move.path], index: index + 1, action: "push", pending: null });
    } else if (move.kind === "replace") {
      update({ entries: entries.map((entry, i) => (i === index ? move.path : entry)), action: "replace", pending: null });
    } else if (move.kind === "back") {
      update({ index: index - 1, action: "back", pending: null });
    } else if (move.kind === "forward") {
      update({ index: index + 1, action: "forward", pending: null });
    }
  }
  function attempt(move) {
    if (move.kind === "back" && state.index === 0) return;
    if (move.kind === "forward" && state.index === state.entries.length - 1) return;
    if (guard !== null && !move.skipGuard) update({ pending: move });
    else apply(move);
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    push: (path, options = {}) => attempt({ kind: "push", path, skipGuard: options.skipGuard }),
    replace: (path, options = {}) => attempt({ kind: "replace", path, skipGuard: options.skipGuard }),
    back: () => attempt({ kind: "back" }),
    forward: () => attempt({ kind: "forward" }),
    setGuard() {
      const token = {};
      guard = token;
      return () => {
        if (guard === token) guard = null;
      };
    },
    proceed: () => state.pending && apply(state.pending),
    stay: () => update({ pending: null }),
  };
}

const RouterContext = createContext(null);
const MatchContext = createContext({ params: {}, outlet: null });

export function Router({ history, children }) {
  const [state, setState] = useState(history.getState);
  useEffect(() => history.subscribe(setState), [history]);
  return <RouterContext.Provider value={{ history, state }}>{children}</RouterContext.Provider>;
}

function useRouter() {
  const router = useContext(RouterContext);
  if (router === null) throw new Error("Router hooks and <Link> work only inside <Router>.");
  return router;
}

// back(), forward(), push(path), replace(path)
export function useHistory() {
  return useRouter().history;
}

// { path, entries, index, action } — the current entry and the whole stack.
export function useLocation() {
  const { state } = useRouter();
  return { path: state.entries[state.index], entries: state.entries, index: state.index, action: state.action };
}

// navigate(path), navigate(path, { replace: true }), navigate(path, { skipGuard: true })
export function useNavigate() {
  const { history } = useRouter();
  return (path, { replace = false, skipGuard = false } = {}) =>
    replace ? history.replace(path, { skipGuard }) : history.push(path, { skipGuard });
}

export function Link({ to, replace = false, children, ...rest }) {
  const navigate = useNavigate();
  function handleClick(event) {
    // Ctrl/Cmd/Shift-click keeps the browser's own behavior (a new tab or window).
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); // no page load: the router swaps the screen itself
    navigate(to, { replace });
  }
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

// The params of the matched route, as strings: { id: "w-02" }.
export function useParams() {
  return useContext(MatchContext).params;
}

// Where a layout route shows the screen of its matched child route.
export function Outlet() {
  return useContext(MatchContext).outlet;
}

// While `when` is true, every navigation except skipGuard waits: { blocked, proceed, stay }.
export function useBlocker(when) {
  const { history, state } = useRouter();
  useEffect(() => {
    if (!when) return;
    return history.setGuard();
  }, [history, when]);
  return { blocked: state.pending !== null, proceed: history.proceed, stay: history.stay };
}

const segmentsOf = (path) => path.split("/").filter((segment) => segment !== "");

function matchRoutes(routes, segments, parentPattern) {
  for (const route of routes) {
    const own = segmentsOf(route.path);
    const pattern = [...parentPattern, ...own];
    const key = "/" + pattern.join("/");
    if (own[0] === "*") return [{ route, params: {}, key }];
    if (own.length > segments.length) continue;
    const params = {};
    let matches = true;
    own.forEach((segment, i) => {
      if (segment.startsWith(":")) params[segment.slice(1)] = decodeURIComponent(segments[i]);
      else if (segment !== segments[i]) matches = false;
    });
    if (!matches) continue;
    const rest = segments.slice(own.length);
    if (route.children) {
      const inner = matchRoutes(route.children, rest, pattern);
      if (inner !== null) return [{ route, params, key }, ...inner];
    } else if (rest.length === 0) {
      return [{ route, params, key }];
    }
  }
  return null;
}

// Shows the element of the route that matches the current path. A nested match renders
// inside its parent's <Outlet />. Each route pattern is its own place in the tree:
// moving to another pattern mounts that route's screen anew.
export function Routes({ routes }) {
  const { path } = useLocation();
  const matches = matchRoutes(routes, segmentsOf(path), []) ?? [];
  const params = Object.assign({}, ...matches.map((match) => match.params));
  let outlet = null;
  for (const match of [...matches].reverse()) {
    outlet = (
      <MatchContext.Provider key={match.key} value={{ params, outlet }}>
        {match.route.element}
      </MatchContext.Provider>
    );
  }
  return outlet;
}
