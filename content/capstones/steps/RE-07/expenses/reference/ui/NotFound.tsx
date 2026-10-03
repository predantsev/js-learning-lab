// The screen for an address that names no expense: an unknown id or an unknown path.
import { Link } from "./router.tsx";
import { useHeadingFocus } from "./focus.ts";

export function NotFound() {
  const headingRef = useHeadingFocus("%%notFoundTitle%%");
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%notFoundTitle%%
      </h2>
      <Link to="/expenses">%%backToListLabel%%</Link>
    </section>
  );
}
