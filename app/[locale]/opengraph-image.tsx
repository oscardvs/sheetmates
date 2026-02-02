import { ImageResponse } from "next/og";

/**
 * OpenGraph image generator for SheetMates
 * Generates dynamic social share images (1200x630px)
 */

export const runtime = "edge";
export const alt = "SheetMates - Community-Driven Laser Cutting Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b", // zinc-950
          backgroundImage:
            "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      >
        {/* Main content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
            backgroundColor: "rgba(9, 9, 11, 0.95)",
            border: "2px solid #3f3f46",
            borderRadius: "0",
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#fafafa",
              fontFamily: "monospace",
              letterSpacing: "-0.02em",
              marginBottom: "20px",
            }}
          >
            SheetMates
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: "#a1a1aa",
              fontFamily: "monospace",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.4,
              marginBottom: "30px",
            }}
          >
            Community-Driven Laser Cutting Platform
          </div>

          {/* Key features */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#22c55e",
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  color: "#d4d4d8",
                  fontFamily: "monospace",
                }}
              >
                Buffer Sheets
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#22c55e",
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  color: "#d4d4d8",
                  fontFamily: "monospace",
                }}
              >
                Instant Pricing
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#22c55e",
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  color: "#d4d4d8",
                  fontFamily: "monospace",
                }}
              >
                EU Manufacturing
              </span>
            </div>
          </div>
        </div>

        {/* Footer badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "#71717a",
            }}
          />
          <span
            style={{
              fontSize: 16,
              color: "#71717a",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
            }}
          >
            sheetmates.com
          </span>
          <div
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "#71717a",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
