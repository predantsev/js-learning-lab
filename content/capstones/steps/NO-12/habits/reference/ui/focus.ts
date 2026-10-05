// useHeadingFocus(title) — every screen calls it with its own title.
// - It writes "<title> · <project>" into document.title, so the tab and the history show the screen.
// - After a route change (not on the first load of the page) focus moves to the heading of the new
//   screen, so a keyboard or screen-reader user starts reading there instead of at a link that no
//   longer exists. Give the returned ref to a heading with tabIndex={-1}.
import { useEffect, useRef } from "react";
import { useLocation } from "./router.tsx";

export function useHeadingFocus(title: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { path, action } = useLocation();
  useEffect(() => {
    document.title = title + " · %%projectTitle%%";
  }, [title]);
  useEffect(() => {
    if (action !== "initial") {
      headingRef.current?.focus();
    }
  }, [path, action]);
  return headingRef;
}
