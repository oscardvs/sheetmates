"use client";

/**
 * Global Error Boundary for Next.js App Router
 *
 * This component handles errors at the root level (outside of layouts).
 * It must render its own <html> and <body> tags since it replaces the entire page.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error for monitoring (in production, send to error tracking service)
  if (typeof window !== "undefined") {
    console.error("Global error caught:", error);
  }

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#ededed",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "500px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: "#888",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            We encountered an unexpected error. Our team has been notified and
            is working to fix it.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#666",
                marginBottom: "1.5rem",
                fontFamily: "monospace",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#3b82f6")
              }
            >
              Try again
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              style={{
                backgroundColor: "transparent",
                color: "#ededed",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #333",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "#666")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = "#333")
              }
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
