import { Component } from "react";
import { Fallback } from "./Fallback";

// TODO: when a child throws while rendering, show <Fallback onReset={…} />;
// onReset clears the error so the children render again.
export class ErrorBoundary extends Component {
  render() {
    return this.props.children;
  }
}
