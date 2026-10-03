import { Component } from "react";
import type { ReactNode } from "react";

// Not a boundary yet: it only renders its children.
export class CardBoundary extends Component<{ children: ReactNode }> {
  render() {
    return this.props.children;
  }
}
