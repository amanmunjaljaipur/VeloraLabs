"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  blockType?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates a single broken block so the rest of the page still renders.
 * Future-proof: new component types can fail independently without blanking the page.
 */
export class BlockErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageBuilder] Block render failed:", this.props.blockType, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="container-verlin py-8" role="alert">
          <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-6 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            This section could not be displayed
            {this.props.blockType ? ` (${this.props.blockType})` : ""}. Try editing or removing it in
            the design studio.
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
