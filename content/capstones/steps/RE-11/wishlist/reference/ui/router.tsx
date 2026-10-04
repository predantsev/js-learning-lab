// The course's minimal router from the routes unit, typed, with one change: the history stack is the
// browser tab's own history instead of a stack in memory. The path lives after "#" in the address
// (http://127.0.0.1:4310/#/items/w-02), so a reload asks the static server for index.html only and
// the page finds the path itself. history.pushState adds an entry without a page load; the browser's
// Back and Forward buttons fire the popstate event.
// Like the course router, it guards navigations inside the app (links, navigate, the app's buttons);
// the browser's own Back button is not guarded: popstate arrives when the address has already changed.
import { createContext, useContext, useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

type Move = { kind: "push" | "replace"; path: string; skipGuard: boolean };

export type HistoryState = {
  path: string;
  action: "initial" | "push" | "replace" | "pop";
  pending: Move | null; // a navigation waiting for proceed() or stay()
};

export type AppHistory = {
  getState: () => HistoryState;
  subscribe: (listener: (state: HistoryState) => void) => () => void;
  push: (path: string, options?: { skipGuard?: boolean }) => void;
  replace: (path: string, options?: { skipGuard?: boolean }) => void;
  setGuard: () => () => void;
  proceed: () => void;
  stay: () => void;
};

// The path in the address after "#", or `defaultPath` (written into the address) when there is none.
export function createHashHistory(defaultPath: string): AppHistory {
  if (location.hash.length <= 1) {
    window.history.replaceState(null, "", "#" + defaultPath);
  }
  let state: HistoryState = { path: location.hash.slice(1), action: "initial", pending: null };
  let guard: object | null = null;
  const listeners = new Set<(state: HistoryState) => void>();

  function update(changes: Partial<HistoryState>) {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener(state));
  }
  function apply(move: Move) {
    if (move.kind === "push") {
      window.history.pushState(null, "", "#" + move.path);
    } else {
      window.history.replaceState(null, "", "#" + move.path);
    }
    update({ path: move.path, action: move.kind, pending: null });
  }
  function attempt(move: Move) {
    if (guard !== null && !move.skipGuard) {
      update({ pending: move });
    } else {
      apply(move);
    }
  }
  // Back, Forward, or an address typed by hand: the address has already changed.
  function onPopState() {
    update({ path: location.hash.slice(1) || defaultPath, action: "pop", pending: null });
  }

  return {
    getState: () => state,
    subscribe(listener) {
      if (listeners.size === 0) {
        window.addEventListener("popstate", onPopState);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("popstate", onPopState);
        }
      };
    },
    push: (path, options = {}) => attempt({ kind: "push", path: path, skipGuard: options.skipGuard === true }),
    replace: (path, options = {}) => attempt({ kind: "replace", path: path, skipGuard: options.skipGuard === true }),
    setGuard() {
      const token = {};
      guard = token;
      return () => {
        if (guard === token) {
          guard = null;
        }
      };
    },
    proceed: () => {
      if (state.pending !== null) {
        apply(state.pending);
      }
    },
    stay: () => update({ pending: null }),
  };
}

type RouterValue = { history: AppHistory; state: HistoryState };
const RouterContext = createContext<RouterValue | null>(null);
type Match = { params: Record<string, string>; outlet: ReactNode };
const MatchContext = createContext<Match>({ params: {}, outlet: null });

export function Router({ history, children }: { history: AppHistory; children: ReactNode }) {
  const [state, setState] = useState(history.getState);
  useEffect(() => history.subscribe(setState), [history]);
  return <RouterContext.Provider value={{ history: history, state: state }}>{children}</RouterContext.Provider>;
}

function useRouter(): RouterValue {
  const router = useContext(RouterContext);
  if (router === null) {
    throw new Error("Router hooks and <Link> work only inside <Router>.");
  }
  return router;
}

// { path, action } of the current entry.
export function useLocation(): { path: string; action: HistoryState["action"] } {
  const { state } = useRouter();
  return { path: state.path, action: state.action };
}

// navigate(path), navigate(path, { replace: true }), navigate(path, { skipGuard: true })
export function useNavigate(): (path: string, options?: { replace?: boolean; skipGuard?: boolean }) => void {
  const { history } = useRouter();
  return (path, { replace = false, skipGuard = false } = {}) => (replace ? history.replace(path, { skipGuard: skipGuard }) : history.push(path, { skipGuard: skipGuard }));
}

type LinkProps = { to: string; replace?: boolean; children: ReactNode; className?: string; "aria-label"?: string };

// A real link (<a href="#/items/w-02">): a plain click navigates without a page load,
// Ctrl/Cmd/Shift/Alt-click keeps the browser's own behavior (a new tab or window).
export function Link({ to, replace = false, children, ...rest }: LinkProps) {
  const navigate = useNavigate();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(to, { replace: replace });
  }
  return (
    <a href={"#" + to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

// The params of the matched route, as strings: { id: "w-02" }.
export function useParams(): Record<string, string> {
  return useContext(MatchContext).params;
}

// Where a layout route shows the screen of its matched child route.
export function Outlet() {
  return useContext(MatchContext).outlet;
}

// While `when` is true, every navigation except skipGuard waits: { blocked, proceed, stay }.
export function useBlocker(when: boolean): { blocked: boolean; proceed: () => void; stay: () => void } {
  const { history, state } = useRouter();
  useEffect(() => {
    if (!when) {
      return;
    }
    return history.setGuard();
  }, [history, when]);
  return { blocked: state.pending !== null, proceed: history.proceed, stay: history.stay };
}

export type RouteDef = { path: string; element: ReactNode; children?: RouteDef[] };
type Found = { route: RouteDef; params: Record<string, string>; key: string };

const segmentsOf = (path: string) => path.split("/").filter((segment) => segment !== "");

function matchRoutes(routes: RouteDef[], segments: string[], parentPattern: string[]): Found[] | null {
  for (const route of routes) {
    const own = segmentsOf(route.path);
    const pattern = [...parentPattern, ...own];
    const key = "/" + pattern.join("/");
    if (own[0] === "*") {
      return [{ route: route, params: {}, key: key }];
    }
    if (own.length > segments.length) {
      continue;
    }
    const params: Record<string, string> = {};
    let matches = true;
    own.forEach((segment, i) => {
      if (segment.startsWith(":")) {
        params[segment.slice(1)] = decodeURIComponent(segments[i]);
      } else if (segment !== segments[i]) {
        matches = false;
      }
    });
    if (!matches) {
      continue;
    }
    const rest = segments.slice(own.length);
    if (route.children) {
      const inner = matchRoutes(route.children, rest, pattern);
      if (inner !== null) {
        return [{ route: route, params: params, key: key }, ...inner];
      }
    } else if (rest.length === 0) {
      return [{ route: route, params: params, key: key }];
    }
  }
  return null;
}

// Shows the element of the route that matches the current path. A nested match renders inside its
// parent's <Outlet />. Each route pattern is its own place in the tree: moving to another pattern
// mounts that route's screen anew.
export function Routes({ routes }: { routes: RouteDef[] }) {
  const { path } = useLocation();
  const matches = matchRoutes(routes, segmentsOf(path), []) ?? [];
  const params = Object.assign({}, ...matches.map((match) => match.params));
  let outlet: ReactNode = null;
  for (const match of [...matches].reverse()) {
    outlet = (
      <MatchContext.Provider key={match.key} value={{ params: params, outlet: outlet }}>
        {match.route.element}
      </MatchContext.Provider>
    );
  }
  return outlet;
}
