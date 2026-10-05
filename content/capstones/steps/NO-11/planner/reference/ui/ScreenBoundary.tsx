// An error boundary around the screen of the current route: an error thrown while a screen renders
// (or in its effects) shows a message and a "Try again" button instead of an empty page, and the
// heading and the rest of the layout stay. It does not see errors in event handlers or promises:
// those are caught where they happen (the data hook turns a failed load into an error state).
// The layout gives it key={path}: another address starts a fresh boundary without the old error.
// With onRetry (the lazy summary route) "Try again" calls it instead: the route starts a new load;
// `extra` is shown under the button (that route offers a page reload there).
import { Component } from "react";
import type { ReactNode } from "react";

type Props = { children: ReactNode; onRetry?: () => void; extra?: ReactNode };
type State = { error: Error | null };

export class ScreenBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error: error };
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div role="alert">
          <p>
            %%screenErrorMessage%% ({this.state.error.message})
          </p>
          <button type="button" onClick={() => (this.props.onRetry === undefined ? this.setState({ error: null }) : this.props.onRetry())}>
            %%tryAgainLabel%%
          </button>
          {this.props.extra}
        </div>
      );
    }
    return this.props.children;
  }
}
