# Performance Optimization Plan

**Date:** 2026-02-02
**Source:** Google PageSpeed Insights (Mobile)
**Target:** Improve all Core Web Vitals and fix accessibility/SEO issues

## Current State

| Metric | Score | Status |
|--------|-------|--------|
| Performance | 75 | Needs work |
| Accessibility | 90 | Good |
| Best Practices | 100 | Excellent |
| SEO | 83 | Needs work |

### Core Web Vitals

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP | 5.3s | <2.5s | Poor |
| FCP | 2.6s | <1.8s | Needs improvement |
| CLS | 0 | <0.1 | Excellent |
| TBT | 30ms | <200ms | Excellent |

## Root Cause Analysis

1. **LCP 5.3s** - `LandingCanvas` is a 503-line client component that parses DXF files before rendering the hero section
2. **FCP 2.6s** - AuthProvider blocks on Firebase Auth + Firestore call before content renders
3. **Unused JS 181KB** - Firebase Auth iframe (90KB) + legacy polyfills (12KB) loaded on landing page
4. **Unused fonts 100KB** - Inter and Geist Sans loaded but never rendered (only Geist Mono used)
5. **Poor caching** - 4-hour TTL on 378KB of assets
6. **Missing preconnects** - 600ms establishing connections to Firebase/Google APIs

---

## Implementation Plan

### Phase 1: Performance - LCP & FCP Fixes

#### 1.1 Static Landing Canvas with Progressive Enhancement

**Problem:** `LandingCanvas` blocks LCP by parsing DXF client-side before rendering.

**Files to modify:**
- `components/landing-canvas.tsx`
- `app/[locale]/page.tsx`

**Solution:**

1. Create `components/landing-canvas-static.tsx` (Server Component):
   - Render a pre-computed SVG snapshot with hardcoded demo placements
   - No DXF parsing, no client-side JavaScript
   - Same visual output as current interactive version

2. Update `app/[locale]/page.tsx`:
   ```tsx
   import { LandingCanvasStatic } from "@/components/landing-canvas-static"
   import dynamic from "next/dynamic"

   const LandingCanvasInteractive = dynamic(
     () => import("@/components/landing-canvas").then(mod => mod.LandingCanvas),
     { ssr: false, loading: () => null }
   )

   // In component:
   <div className="relative">
     <LandingCanvasStatic />
     <LandingCanvasInteractive className="absolute inset-0" />
   </div>
   ```

3. Add fade transition when interactive version loads

**Expected impact:** LCP 5.3s → <2.5s

#### 1.2 Defer AuthProvider Initialization

**Problem:** AuthProvider blocks render waiting for Firebase Auth + Firestore.

**File to modify:** `components/providers/auth-provider.tsx`

**Solution:**

1. Render children immediately without waiting for auth state
2. Auth state hydrates asynchronously
3. Components that need auth show skeleton/loading state individually

```tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const doc = await getUserDoc(firebaseUser.uid)
        setUserDoc(doc)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Render children immediately - don't block on loading
  return (
    <AuthContext.Provider value={{ user, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Expected impact:** FCP improvement ~500ms

#### 1.3 Remove Unused Fonts

**Problem:** Loading 3 fonts (~150KB) when only Geist Mono is rendered.

**Analysis results:**
- Geist Mono: 419 usages across codebase - KEEP
- Geist Sans: Applied to body but never rendered (all text uses font-mono) - REMOVE
- Inter: Only 1 usage in Kbd component - REMOVE

**Files to modify:**
- `app/[locale]/layout.tsx`
- `app/globals.css`
- `components/ui/kbd.tsx`

**Solution:**

1. Update `app/[locale]/layout.tsx`:
   ```tsx
   // Remove Inter and Geist imports
   import { Geist_Mono } from "next/font/google"

   const geistMono = Geist_Mono({
     variable: "--font-geist-mono",
     subsets: ["latin"],
   })

   // Update html/body:
   <html lang={locale} suppressHydrationWarning>
     <body className={`${geistMono.variable} antialiased`}>
   ```

2. Update `app/globals.css`:
   ```css
   --font-sans: ui-sans-serif, system-ui, sans-serif;
   --font-mono: var(--font-geist-mono);
   ```

3. Update `components/ui/kbd.tsx` to use `font-mono` instead of `font-sans`

**Expected impact:** -100KB initial load

---

### Phase 2: Caching, Preconnects & JavaScript

#### 2.1 Firebase Hosting Cache Headers

**Problem:** All assets have 4-hour TTL, causing 378KB of repeated downloads.

**File to modify:** `firebase.json`

**Solution:**

```json
{
  "hosting": {
    "source": ".",
    "frameworksBackend": {
      "region": "europe-west1"
    },
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(woff|woff2|ttf|otf)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(png|jpg|jpeg|gif|svg|ico|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

Next.js chunk filenames include content hashes, so immutable caching is safe.

**Expected impact:** -378KB on repeat visits

#### 2.2 Add Preconnect Hints

**Problem:** 600ms wasted establishing connections to Firebase/Google APIs.

**File to modify:** `app/[locale]/layout.tsx`

**Solution:**

Add to `<head>` section:
```tsx
<head>
  <link rel="preconnect" href="https://sheetmates.firebaseapp.com" />
  <link rel="preconnect" href="https://apis.google.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
</head>
```

**Expected impact:** -600ms connection time

#### 2.3 Reduce Unused JavaScript

**Problem:** 181KB unused JS including legacy polyfills and Firebase Auth iframe.

**Files to modify:**
- `next.config.ts`
- `lib/firebase/auth.ts` (or create lazy wrapper)

**Solution:**

1. Update `next.config.ts` to target modern browsers:
   ```ts
   const nextConfig = {
     // ... existing config
     experimental: {
       optimizePackageImports: ['@phosphor-icons/react'],
     },
   }
   ```

2. Lazy-load Firebase Auth (only needed on login/signup):
   ```tsx
   // lib/firebase/auth-lazy.ts
   export const getAuth = async () => {
     const { getAuth } = await import('firebase/auth')
     return getAuth(app)
   }
   ```

3. Only import auth on pages that need it (`/login`, `/signup`, protected routes)

**Expected impact:** -50KB+ initial bundle

#### 2.4 QueryProvider Optimization

**Problem:** QueryClient created inside component render.

**File to modify:** `components/providers/query-provider.tsx`

**Solution:**

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create once at module scope
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

### Phase 3: Accessibility Fixes

#### 3.1 Mobile Menu Button - Missing Accessible Name

**Problem:** Screen readers announce "button" with no context.

**File to modify:** `components/navbar.tsx`

**Solution:**

```tsx
<button
  aria-label="Open navigation menu"
  className="flex h-8 w-8 items-center justify-center text-foreground md:hidden"
>
  {/* icon */}
</button>
```

#### 3.2 Low Contrast Text - Stats Section

**Problem:** Primary color text on background doesn't meet WCAG AA (4.5:1 ratio).

**File to modify:** `app/[locale]/page.tsx` (stats section)

**Solution:**

```tsx
// Before
<div className="font-mono text-4xl font-bold text-primary">

// After
<div className="font-mono text-4xl font-bold text-foreground">
```

#### 3.3 Low Contrast Footer Links

**Problem:** Footer links use `text-muted-foreground/60` - fails contrast requirements.

**File to modify:** `components/footer.tsx` or `components/landing-footer-links.tsx`

**Solution:**

```tsx
// Before
className="text-muted-foreground/60"

// After
className="text-muted-foreground"
```

---

### Phase 4: SEO Fixes

#### 4.1 Invalid robots.txt Directive

**Problem:** Line 29 has unknown directive `Content-Signal: search=yes,ai-train=no`.

**File to modify:** `public/robots.txt`

**Solution:**

Replace invalid directive with standard bot user-agents:

```txt
User-agent: *
Allow: /

# Block AI training bots
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

Sitemap: https://sheetmates.com/sitemap.xml
```

#### 4.2 Non-Descriptive Link Text

**Problem:** "Learn more" link lacks context for screen readers and SEO.

**File to modify:** `components/cookie-consent.tsx`

**Solution:**

```tsx
// Before
<a href="/cookies">Learn more</a>

// After
<a href="/cookies">Learn more about our cookie policy</a>

// Or with aria-label for compact display
<a href="/cookies" aria-label="Learn more about our cookie policy">
  Cookie Policy
</a>
```

---

## Expected Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Performance | 75 | 90+ | +15 |
| Accessibility | 90 | 98+ | +8 |
| SEO | 83 | 95+ | +12 |
| Best Practices | 100 | 100 | - |
| LCP | 5.3s | <2.5s | -2.8s |
| FCP | 2.6s | <1.8s | -0.8s |

## Implementation Order

Recommended order based on impact and dependencies:

1. **Phase 1.3** - Remove unused fonts (quick win, no dependencies)
2. **Phase 2.1** - Add cache headers to firebase.json (quick win)
3. **Phase 2.2** - Add preconnect hints (quick win)
4. **Phase 3** - All accessibility fixes (quick wins)
5. **Phase 4** - All SEO fixes (quick wins)
6. **Phase 1.1** - Static landing canvas (largest impact, most work)
7. **Phase 1.2** - Defer AuthProvider (medium complexity)
8. **Phase 2.3** - Lazy-load Firebase Auth (medium complexity)
9. **Phase 2.4** - QueryProvider optimization (small impact)

## Verification

After implementation, verify improvements:

1. Run PageSpeed Insights again on mobile
2. Check Core Web Vitals in Chrome DevTools
3. Test with Lighthouse in incognito mode
4. Verify accessibility with axe DevTools extension
5. Validate robots.txt at https://www.google.com/webmasters/tools/robots-testing-tool

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `app/[locale]/layout.tsx` | Remove fonts, add preconnects |
| `app/[locale]/page.tsx` | Import static canvas, fix contrast |
| `app/globals.css` | Fix font-sans variable |
| `components/landing-canvas-static.tsx` | NEW: Server-rendered static canvas |
| `components/landing-canvas.tsx` | Make lazy-loadable |
| `components/providers/auth-provider.tsx` | Don't block on loading |
| `components/providers/query-provider.tsx` | Move QueryClient to module scope |
| `components/navbar.tsx` | Add aria-label to mobile menu |
| `components/footer.tsx` | Fix link contrast |
| `components/cookie-consent.tsx` | Descriptive link text |
| `components/ui/kbd.tsx` | Use font-mono |
| `firebase.json` | Add cache headers |
| `public/robots.txt` | Fix invalid directive |
| `next.config.ts` | Optimize imports |
