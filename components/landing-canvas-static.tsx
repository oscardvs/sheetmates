import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { UploadIcon } from "@phosphor-icons/react/dist/ssr";

// Standard sheet: 3000x1500mm
const SHEET_WIDTH = 3000;
const SHEET_HEIGHT = 1500;

/**
 * Static server-rendered version of the landing canvas.
 * Renders the same visual layout without client-side JavaScript.
 * The interactive version is lazy-loaded after hydration.
 */
export async function LandingCanvasStatic() {
  const t = await getTranslations("landing.canvas");
  const tHero = await getTranslations("landing.hero");

  return (
    <section className="relative bg-background">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/50 bg-primary/10 font-mono text-primary"
          >
            {t("badge")}
          </Badge>
          <h1 className="mb-4 font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            <span className="text-muted-foreground">{t("heroDrop")} </span>
            <span className="text-primary">{t("heroDxf")}</span>
            <span className="text-muted-foreground"> {t("heroArrow")} </span>
            <span className="text-primary">{t("heroParts")}</span>
          </h1>
          <p className="mx-auto max-w-2xl font-mono text-sm text-muted-foreground md:text-base">
            {t("heroSubtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Drop Zone placeholder */}
          <div className="flex flex-col gap-4">
            {/* Drop Zone - static visual only */}
            <div className="relative flex min-h-[280px] flex-1 flex-col items-center justify-center gap-4 border-2 border-dashed border-border p-8 lg:min-h-0">
              <UploadIcon className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <p className="font-mono text-xl font-medium text-foreground">
                  {t("dropZone")}
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {t("dropHelper")}
                </p>
              </div>
            </div>

            {/* CTA placeholder - matches interactive version's default state */}
            <div className="flex h-12 w-full items-center justify-center bg-primary font-mono text-primary-foreground">
              {tHero("cta")}
            </div>
          </div>

          {/* Right: Sheet Canvas Preview - static */}
          <div className="relative">
            <div className="mb-2 font-mono text-xs text-muted-foreground">
              {t("sheetPreview")}
            </div>

            <svg
              viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
              className="w-full border border-border bg-card/50"
              style={{ aspectRatio: `${SHEET_WIDTH} / ${SHEET_HEIGHT}` }}
            >
              {/* Grid pattern */}
              <defs>
                <pattern id="smallGrid-static" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    className="stroke-border/30"
                    strokeWidth="0.5"
                  />
                </pattern>
                <pattern id="largeGrid-static" width="500" height="500" patternUnits="userSpaceOnUse">
                  <rect width="500" height="500" fill="url(#smallGrid-static)" />
                  <path
                    d="M 500 0 L 0 0 0 500"
                    fill="none"
                    className="stroke-border/50"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              {/* Sheet background with grid */}
              <rect
                x={0}
                y={0}
                width={SHEET_WIDTH}
                height={SHEET_HEIGHT}
                fill="url(#largeGrid-static)"
              />

              {/* Sheet border */}
              <rect
                x={0}
                y={0}
                width={SHEET_WIDTH}
                height={SHEET_HEIGHT}
                fill="none"
                className="stroke-muted-foreground/50"
                strokeWidth="4"
              />

              {/* Corner dimension labels */}
              <text
                x={SHEET_WIDTH / 2}
                y={40}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontFamily="ui-monospace, monospace"
                fontSize="28"
              >
                3000mm
              </text>
              <text
                x={50}
                y={SHEET_HEIGHT / 2}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontFamily="ui-monospace, monospace"
                fontSize="28"
                transform={`rotate(-90, 50, ${SHEET_HEIGHT / 2})`}
              >
                1500mm
              </text>

              {/* Empty state */}
              <text
                x={SHEET_WIDTH / 2}
                y={SHEET_HEIGHT / 2}
                textAnchor="middle"
                className="fill-muted-foreground/50"
                fontFamily="ui-monospace, monospace"
                fontSize="48"
              >
                {t("emptyPreview")}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
