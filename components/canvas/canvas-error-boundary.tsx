"use client";

import ErrorBoundary from "@/components/error-boundary";

interface CanvasErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized error boundary for canvas/nesting components.
 * Provides context-specific error messaging for canvas-related failures.
 */
export function CanvasErrorBoundary({ children }: CanvasErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div
          role="alert"
          className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center bg-muted/50 rounded-lg border border-destructive/20"
        >
          <svg
            className="w-12 h-12 text-destructive mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          <h3 className="text-lg font-semibold mb-2">Canvas Error</h3>

          <p className="text-muted-foreground mb-4 max-w-sm">
            The nesting canvas encountered an error. This might be due to an
            invalid DXF file or a rendering issue.
          </p>

          {process.env.NODE_ENV === "development" && (
            <details className="mb-4 w-full max-w-md">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Error details
              </summary>
              <pre className="text-xs text-left bg-muted p-3 rounded-md mt-2 overflow-auto max-h-32">
                {error.message}
                {"\n\n"}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log canvas-specific errors
        console.error("Canvas error:", {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });

        // In production, send to error tracking
        // e.g., Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default CanvasErrorBoundary;
