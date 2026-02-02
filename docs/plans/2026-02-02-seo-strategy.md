# SheetMates SEO Strategy & Implementation Plan
**Created:** 2026-02-02
**Status:** Draft - Ready for Implementation
**Target:** Get indexed → Drive early traffic → Outrank competitors

---

## Executive Summary

SheetMates is a new site (soft launch) competing in the laser cutting/sheet metal fabrication space against established players (Fractory, Xometry, Hubs). This strategy focuses on:

1. **Technical Foundation** - Get indexed by Google (Priority A)
2. **Long-Tail Keywords** - Drive early maker traffic (Priority B)
3. **Competitive Positioning** - Outrank competitors over time (Priority C)

**Target Audience:** Makers/hobbyists (validation phase) → Hardware startups → SME manufacturers
**Timeline:** 12 months to meaningful organic traffic
**Domain:** sheetmates.com (live on Firebase)

---

## Part 1: Technical Foundation

### Current State
- ❌ No sitemap.xml
- ❌ No robots.txt
- ❌ No metadata in layout/pages
- ❌ No Open Graph images
- ❌ No structured data (Schema.org)

### Implementation Checklist

**1. Dynamic Sitemap (`/app/sitemap.ts`)**
```typescript
// Auto-discover all routes
// Include locale variants (en, fr, cs)
// Dynamic content: Fetch active sheets from Firestore
// Priority: Homepage (1.0), Materials (0.8), Guides (0.7), Sheets (0.6)
// Changefreq: Homepage (daily), Materials (weekly), Guides (monthly)
```

**2. Robots.txt (`/app/robots.ts`)**
```typescript
// Allow: /, /guides, /materials, /sheets, /faq, /vs
// Disallow: /admin, /queue, /checkout, /api, /upload
// Sitemap: https://sheetmates.com/sitemap.xml
```

**3. Metadata Architecture**
- Root layout: Global defaults (title template, OG image, description)
- Page-level: Keyword-optimized titles/descriptions
- Dynamic pages: `generateMetadata()` for sheets, materials
- Multilingual: next-intl integration for localized meta tags

**4. Open Graph Assets**
- Homepage: Brand + value prop visual
- Upload page: "Upload Your Design" CTA image
- Sheets page: Nesting visualization
- Dynamic OG images: Use @vercel/og for sheet listings

**5. JSON-LD Structured Data**
- Organization schema (every page)
- Product schema (sheet listings)
- BreadcrumbList (navigation structure)
- FAQ schema (FAQ pages)
- Article schema (guide pages)

---

## Part 2: Keyword Research & Strategy

### The 3-Tier Approach

**Tier 1: Long-Tail Problem Keywords (Month 1-3)**
Target maker-specific problems competitors ignore:

| Keyword | Monthly Searches | Difficulty | Target Page |
|---------|------------------|------------|-------------|
| laser cut steel parts small quantity | 200-500 | Low | /materials/steel |
| dxf file laser cutting Belgium | 100-300 | Very Low | /guides/dxf-laser-cutting-complete-guide |
| cheap laser cutting for prototypes | 300-800 | Medium | / (homepage) |
| leftover sheet metal for sale | 400-600 | Low | /about/buffer-sheets (unique content) |
| how to prepare dxf for laser cutting | 500-1000 | Low | /guides/dxf-preparation |
| kerf compensation laser cutting | 300-500 | Low | /guides/kerf-offset-explained |
| minimum hole size laser cutting | 200-400 | Low | /guides/minimum-hole-size |
| laser cutting thickness limits | 200-400 | Low | /guides/material-thickness-chart |

**Tier 2: Material + Thickness (Month 3-6)**
Transactional keywords with high buying intent:

- "3mm aluminum laser cutting"
- "1.5mm stainless steel sheet cutting"
- "5mm steel plate laser cut service"
- "thin copper sheet laser cutting"
- "[material] laser cutting Belgium"
- "affordable [material] laser cutting"

**Structure:** `/materials/[material]/[thickness]` dynamic pages

**Tier 3: Competitive Head-to-Head (Month 6-12)**
Once authority is established:

- "Fractory alternative Belgium"
- "cheaper than Xometry laser cutting"
- "Hubs vs SheetMates comparison"
- "best laser cutting service Europe"
- "laser cutting service review"

### Keyword Research Tools

**Free (Start Here):**
1. Google Autocomplete - Type "laser cutting" + variations
2. "People Also Ask" boxes - Question keywords
3. Reddit/Forums - r/metalworking, r/lasercutting
4. Competitor page titles - View source on Fractory/Xometry

**Paid (If Budget):**
- Ahrefs for exact volumes + competitor analysis
- SEMrush for keyword gap analysis
- Answer The Public for question clustering

**Deliverable:** Keyword spreadsheet with 170+ keywords:
- 50 Tier 1 (immediate targets)
- 100 Tier 2 (material/thickness matrix)
- 20 Tier 3 (competitor battles)

---

## Part 3: Content Strategy

### Hub 1: "DXF Laser Cutting Guide" (Maker Education)

**Pillar Page:** `/guides/dxf-laser-cutting-complete-guide`
- 3000+ words, comprehensive tutorial
- Targets: "how to prepare dxf for laser cutting" (500+ searches/mo)
- Sections: File prep, kerf compensation, material selection, DFM rules
- Interactive: DXF validator widget, kerf calculator
- Downloads: Checklist PDF, sample DXF files

**Spoke Pages (Internal Links to Pillar):**
1. `/guides/dxf-kerf-offset-explained` - "what is kerf in laser cutting"
2. `/guides/minimum-hole-size-laser-cutting` - "laser cutting hole diameter rules"
3. `/guides/dxf-file-cleanup-tips` - "clean dxf file for laser cutting"
4. `/guides/material-thickness-chart` - "laser cutting thickness limits"
5. `/guides/heat-warp-prevention` - "prevent warping laser cutting"

**Internal Linking Strategy:**
- Pillar links to all spokes
- Spokes link back to pillar
- Cross-link related spokes
- Material pages link to relevant guides

### Hub 2: "Material Selector" (Transactional)

**Pillar Page:** `/materials` (optimize existing)
- Overview of all materials
- Interactive material selector
- Price comparison table
- Availability (real-time from Firestore)

**Material Detail Pages:**
- `/materials/steel-laser-cutting`
- `/materials/aluminum-laser-cutting`
- `/materials/stainless-steel-laser-cutting`
- `/materials/copper-laser-cutting`

**Each Material Page Includes:**
- Available thicknesses (from Firestore sheets)
- Price calculator widget (interactive)
- DFM constraints (min hole size, max thickness)
- Example projects gallery
- Technical specs (kerf width, edge quality)
- CTA: "Upload DXF for Instant Quote"

**Thickness Sub-Pages (Dynamic):**
- `/materials/steel/3mm` - "3mm steel laser cutting"
- `/materials/aluminum/1.5mm` - "1.5mm aluminum sheet cutting"

Generate from Firestore sheet data automatically.

### Hub 3: "vs Competitors" (Positioning - Month 6+)

**Comparison Pages:**
- `/vs/fractory` - "SheetMates vs Fractory"
- `/vs/xometry` - "SheetMates vs Xometry"
- `/vs/hubs` - "SheetMates vs Hubs"

**Content Structure:**
- Honest comparison table (pricing, turnaround, features)
- Where they're better (acknowledge strengths)
- Where you're better (buffer sheet model, EU-local, price transparency)
- Use case recommendations: "Use X if... Use SheetMates if..."
- User testimonials
- CTA: "Try both and compare"

### Quick Win: FAQ Pages

**Structure:** `/faq/[category]/[slug]`

**Technical FAQs:**
- "Can I laser cut aluminum?" → `/faq/materials/can-you-laser-cut-aluminum`
- "What file format for laser cutting?" → `/faq/files/laser-cutting-file-formats`
- "How thick can laser cut steel?" → `/faq/materials/maximum-steel-thickness`
- "What is kerf in laser cutting?" → `/faq/technical/what-is-kerf`
- "How much does laser cutting cost?" → `/faq/pricing/laser-cutting-cost`

**Each FAQ:**
- 300-500 words (sufficient to rank)
- Schema.org FAQ markup (rich snippet eligible)
- Internal links to relevant guides/materials
- CTA at bottom

### Content Calendar (First 90 Days)

**Month 1: Foundation**
- Week 1: DXF Guide Pillar (3000 words)
- Week 2: Kerf Offset Guide + Hole Size Guide (spoke pages)
- Week 3: Steel Material Page (transactional)
- Week 4: Aluminum Material Page (transactional)

**Month 2: Expansion**
- Week 5: DXF Cleanup Guide (spoke)
- Week 6: Material Thickness Chart (spoke)
- Week 7: Stainless Steel Material Page
- Week 8: 5 Technical FAQ Pages

**Month 3: Depth**
- Week 9: Copper Material Page
- Week 10: "Buffer Sheet Model Explained" (unique angle)
- Week 11: First case study (customer project)
- Week 12: Heat Warp Prevention Guide (spoke)

**Ongoing:** 1 new page per week minimum

### On-Page SEO Checklist (Every Page)

```
✅ Keyword in title (front-loaded, <60 chars)
✅ Keyword in URL slug (clean, short)
✅ Keyword in H1 (natural, not stuffed)
✅ Keyword in first 100 words
✅ 2-3 keyword variants in H2s
✅ Alt text on images (descriptive + keyword)
✅ Internal links (3+ to related pages)
✅ External link (1-2 to authority sources: Wikipedia, engineering sites)
✅ Meta description (150 chars, includes keyword, CTA)
✅ Open Graph tags (title, description, image)
✅ Schema.org markup (appropriate type)
✅ Mobile-responsive
✅ Fast load time (<3s LCP)
```

---

## Part 4: Technical Implementation

### File Structure

```
app/
├── sitemap.ts              # NEW: Dynamic sitemap generation
├── robots.ts               # NEW: Robots.txt config
├── opengraph-image.tsx     # NEW: OG image generator
├── [locale]/
│   ├── layout.tsx          # EDIT: Add metadata
│   ├── guides/
│   │   ├── page.tsx        # NEW: Guides hub
│   │   └── [slug]/
│   │       └── page.tsx    # NEW: Individual guides (MDX)
│   ├── materials/
│   │   ├── page.tsx        # EDIT: Optimize existing
│   │   ├── [material]/
│   │   │   └── page.tsx    # NEW: Material detail
│   │   └── [material]/[thickness]/
│   │       └── page.tsx    # NEW: Thickness pages (dynamic)
│   ├── vs/
│   │   └── [competitor]/
│   │       └── page.tsx    # NEW: Comparison pages
│   ├── faq/
│   │   └── [category]/
│   │       └── [slug]/
│   │           └── page.tsx # NEW: FAQ pages
│   └── tools/
│       ├── kerf-calculator/
│       │   └── page.tsx    # NEW: Interactive tool
│       └── dxf-validator/
│           └── page.tsx    # NEW: Interactive tool

lib/
├── seo/
│   ├── metadata.ts         # NEW: Metadata generators
│   ├── schema.ts           # NEW: JSON-LD builders
│   └── keywords.ts         # NEW: Keyword data store

components/
├── seo/
│   ├── breadcrumbs.tsx     # NEW: Schema.org breadcrumbs
│   └── faq-schema.tsx      # NEW: FAQ structured data

content/                    # NEW: MDX content
├── en/
│   ├── guides/
│   │   ├── dxf-laser-cutting-complete-guide.mdx
│   │   ├── dxf-kerf-offset-explained.mdx
│   │   └── ...
│   └── faq/
│       └── ...
├── fr/
└── cs/
```

### Implementation Phases

**Phase 1: Indexing Infrastructure (Day 1-2)**
1. Create `app/sitemap.ts`
2. Create `app/robots.ts`
3. Update `app/[locale]/layout.tsx` - Add global metadata
4. Create `app/opengraph-image.tsx`
5. Create `lib/seo/metadata.ts` helper
6. Create `lib/seo/schema.ts` helper

**Phase 2: Page-Level SEO (Day 3-5)**
1. Homepage metadata optimization
2. Upload page metadata
3. Sheets browse page metadata
4. Login/signup metadata (noindex)

**Phase 3: Dynamic Content Routes (Week 2)**
1. Materials hub structure
2. Material detail pages (Firestore integration)
3. Thickness pages (dynamic from sheet data)
4. Product schema for sheets

**Phase 4: Content Infrastructure (Week 3)**
1. MDX setup (next-mdx-remote or contentlayer)
2. Guides route structure
3. FAQ route structure
4. Internal linking system

**Phase 5: Interactive Tools (Week 4)**
1. Kerf calculator widget
2. DXF validator (client-side DXF parsing)
3. Material cost estimator

### Key Technical Decisions

**Metadata Approach:**
- Use Next.js 16 `generateMetadata()` for dynamic pages
- Create reusable generators in `lib/seo/metadata.ts`
- Support all 3 locales (en, fr, cs) with next-intl
- OpenGraph images: Dynamic generation with @vercel/og

**Sitemap Strategy:**
- Static routes: Hardcoded in sitemap.ts
- Dynamic routes: Fetch from Firestore (active sheets)
- Locale variants: Generate for each language
- Update frequency: Build-time (ISR for sheets)

**Structured Data:**
```typescript
// Every page: Organization schema
{
  "@type": "Organization",
  "name": "SheetMates",
  "url": "https://sheetmates.com",
  "logo": "https://sheetmates.com/logo.png",
  "description": "Community-driven laser cutting platform",
  "address": { "@type": "PostalAddress", "addressCountry": "BE" }
}

// Sheet listings: Product schema
{
  "@type": "Product",
  "name": "3mm Steel Sheet - 3000x1500mm",
  "offers": {
    "@type": "Offer",
    "price": "45.00",
    "priceCurrency": "EUR",
    "availability": "InStock"
  }
}

// Guide pages: Article schema
{
  "@type": "Article",
  "headline": "Complete Guide to DXF Laser Cutting",
  "author": { "@type": "Organization", "name": "SheetMates" },
  "datePublished": "2026-02-02"
}

// FAQ pages: FAQPage schema
{
  "@type": "FAQPage",
  "mainEntity": [...]
}
```

**Content Management:**
- Use MDX for guides/FAQ
- Store in `/content/[locale]/guides/` directory
- Frontmatter: title, description, keywords, publishDate, category
- Render with next-mdx-remote or contentlayer

### Performance Considerations

**Image Optimization:**
- All images through Next.js `<Image>` component
- WebP format with AVIF fallback
- Lazy loading below fold
- OG images: Cached at edge

**Core Web Vitals Targets:**
- LCP: <2.5s (Hero canvas optimization needed)
- CLS: <0.1 (Reserve space for dynamic content)
- FID/INP: <100ms (Code splitting, minimize JS bundle)

**Mobile-First:**
- Touch-friendly interactive elements
- Fast mobile load times
- Responsive canvas/nesting visualizations

---

## Part 5: Competitive Strategy

### Competitor Analysis

**Fractory:**
- **Strengths:** Domain authority ~50-60, established 2016, lots of backlinks
- **Weaknesses:** Generic content, no local focus, corporate tone
- **Opportunity:** Out-content them on maker-specific topics

**Xometry:**
- **Strengths:** Massive budget, paid ads dominate
- **Weaknesses:** Enterprise focus, high minimums, quote friction
- **Opportunity:** Target "affordable alternative" keywords

**Hubs:**
- **Strengths:** Content-heavy blog, educational resources
- **Weaknesses:** Global shipping delays, no EU-specific content
- **Opportunity:** EU-local angle, GDPR compliance, no customs

**Protolabs:**
- **Strengths:** Industrial reputation, technical docs
- **Weaknesses:** High prices, no maker focus
- **Opportunity:** Price-conscious maker segment

### Competitive Advantages (Play to These)

1. **Buffer Sheet Model** - Unique, no one else explains this
2. **EU-Local** - Belgium-based, GDPR-native, fast shipping
3. **Community-Driven** - Maker-first narrative
4. **Price Transparency** - Real-time pricing vs "request quote"
5. **Technical Depth** - DFM checks, kerf compensation, nesting viz

### How to Beat Them

**Phase 1: Flank Attacks (Month 1-6)**
Avoid direct competition, target their weak spots:

**Local + Specific:**
- "laser cutting service Belgium"
- "laser cutting Brussels"
- "EU laser cutting no customs"
- "Belgian sheet metal fabrication"

**Problem + Emotion:**
- "affordable laser cutting for makers"
- "small quantity laser cutting no minimum"
- "laser cutting for prototypes under €50"
- "cheap laser cutting Europe"

**Technical + Educational:**
- "kerf compensation calculator laser cutting"
- "dxf file requirements laser cutting"
- "material thickness guide laser cutting"
- "prepare dxf for laser cutting tutorial"

**Phase 2: Content Superiority (Month 6-12)**

**10x Better Content:**
- Fractory's "DXF Guidelines": 800 words
- **Your version:** 3000 words + interactive examples + video + downloadable checklist + kerf calculator

**Interactive Tools (Link Magnets):**
1. **Kerf Compensation Calculator** - `/tools/kerf-calculator`
   - Targets: "kerf compensation calculator" (200+ searches/mo)
   - Generates backlinks (people reference tools)
   - Email capture for results

2. **Material Cost Estimator** - `/tools/material-cost-estimator`
   - Compare prices: Fractory vs Xometry vs SheetMates
   - Draws comparison traffic

3. **DXF File Validator** - `/tools/dxf-validator`
   - Upload DXF, get instant DFM feedback
   - Captures emails ("check my file" use case)

**Phase 3: Head-to-Head (Month 12+)**

**Comparison Pages:**
```markdown
# SheetMates vs Fractory: Buffer Sheets vs Full Service (2026)

## Quick Comparison

| Feature | SheetMates | Fractory |
|---------|------------|----------|
| Pricing | Buffer sheet rates | Standard rates |
| Minimum Order | None | €50 |
| Lead Time | 3-5 days | 5-7 days |
| Target Customer | Makers, prototypes | Industrial, production |
| Location | Belgium (EU) | Finland (EU) |

## When to use Fractory
- Large batch orders (100+ parts)
- Complex assemblies with consulting
- Need surface finishing options
- Established production runs

## When to use SheetMates
- Small quantity prototypes (1-20 parts)
- Price-conscious makers
- Quick turnaround needed
- Simple laser cutting only

## Price Comparison Example
[Interactive calculator comparing both]

## Our Recommendation
Try both! We believe in transparency. Use Fractory for [X], use SheetMates for [Y].
```

**Differentiation Keywords:**
- "Fractory alternative for small orders"
- "cheaper than Fractory prototypes"
- "Fractory vs local Belgian laser cutting"
- "best Fractory alternative Europe"

### Backlink Strategy

**Month 1-3: Easy Links (DA 20-40)**
1. **Social Profiles:**
   - LinkedIn company page
   - Twitter/X account
   - Reddit r/lasercutting presence (helpful, not spammy)

2. **Maker Communities:**
   - Hackaday.io project page
   - Instructables profile
   - Thingiverse (if applicable)

3. **Local Directories:**
   - Google Business Profile (critical!)
   - Belgian business directories
   - EU maker/fabrication directories
   - Chamber of Commerce listing

**Month 3-6: Content-Driven Links (DA 40-60)**
1. **Guest Posts:**
   - Hackaday: "How We Built a Community Fabrication Platform"
   - Make: Magazine: "The Economics of Buffer Sheet Manufacturing"
   - Engineering blogs: "DFM Tips for Laser Cutting"

2. **Case Studies:**
   - Document first customer projects
   - Reach out: "Can we feature your project?"
   - They share → backlinks + social proof

3. **Tool Launches:**
   - Product Hunt: "Free Kerf Compensation Calculator"
   - Hacker News: "Show HN: Free DXF Validator for Laser Cutting"
   - Designer News, Reddit r/engineering

**Month 6-12: Competitive Intelligence (DA 60+)**
1. **Competitor Backlink Analysis:**
   - Use Ahrefs to see Fractory's links
   - Target same sources: "We're a new alternative"

2. **Broken Link Building:**
   - Find dead links to old laser cutting resources
   - Reach out: "This link is broken, our guide is better"

3. **Resource Page Links:**
   - Engineering school resource pages
   - Maker community tool lists
   - "Laser cutting resources" compilations
   - University fabrication labs

---

## Tracking & Metrics

### Setup (Week 1)

**1. Google Search Console**
- Verify sheetmates.com
- Submit sitemap
- Monitor indexing status (Coverage report)
- Track keyword impressions/clicks

**2. Google Analytics 4**
- Track organic traffic (Acquisition → Traffic Acquisition → Organic Search)
- Set up conversions:
  - DXF upload
  - Quote request
  - Account creation
- Track landing pages (which keywords bring traffic)

**3. Rank Tracking**
- Google Search Console (built-in, delayed)
- Manual checks: Incognito search for target keywords
- Serprobot.com (free rank checker)
- Ahrefs Rank Tracker (if budget)

### Success Metrics

**90-Day Goals (Month 3):**
- ✅ 100+ pages indexed
- ✅ 50+ keywords ranking (any position)
- ✅ 10+ keywords in top 50
- ✅ 3+ keywords in top 20
- ✅ 100+ organic visitors/month
- ✅ 5+ organic conversions (quote requests)

**6-Month Goals:**
- ✅ 200+ pages indexed
- ✅ 100+ keywords ranking
- ✅ 20+ keywords in top 20
- ✅ 5+ keywords in top 10
- ✅ 500+ organic visitors/month
- ✅ 25+ organic conversions

**12-Month Goals:**
- ✅ 300+ pages indexed
- ✅ 200+ keywords ranking
- ✅ 50+ keywords in top 20
- ✅ 20+ keywords in top 10
- ✅ 2000+ organic visitors/month
- ✅ 100+ organic conversions
- ✅ Ranking for 1+ competitor keywords

### Monthly Review Questions

1. **Which keywords moved up?** (Double down on that content type)
2. **Which pages get traffic but no conversions?** (Fix CTAs, add calculators)
3. **Which competitors rank above us?** (What do they have that we don't?)
4. **What questions are people asking?** (New content ideas from PAA boxes)
5. **Which pages aren't indexed?** (Technical issues? Quality issues?)
6. **What's our best-performing content?** (Create more like it)

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Google Search Console
- [ ] Set up Google Analytics 4
- [ ] Create sitemap.ts
- [ ] Create robots.ts
- [ ] Add global metadata to layout.tsx
- [ ] Create opengraph-image.tsx
- [ ] Submit sitemap to GSC

### Week 2: Page-Level SEO
- [ ] Optimize homepage metadata
- [ ] Optimize upload page metadata
- [ ] Optimize sheets browse metadata
- [ ] Add noindex to admin/queue/checkout
- [ ] Create lib/seo/metadata.ts helper
- [ ] Create lib/seo/schema.ts helper

### Week 3: Content Infrastructure
- [ ] Set up MDX (next-mdx-remote or contentlayer)
- [ ] Create /guides route structure
- [ ] Create /faq route structure
- [ ] Build internal linking component

### Week 4: First Content
- [ ] Write DXF Guide Pillar (3000 words)
- [ ] Write Kerf Offset Guide (spoke)
- [ ] Write Hole Size Guide (spoke)
- [ ] Create Steel Material Page

### Month 2: Expansion
- [ ] Aluminum Material Page
- [ ] Stainless Steel Material Page
- [ ] 2 more DXF spoke pages
- [ ] 5 Technical FAQ pages
- [ ] Build kerf calculator widget

### Month 3: Scaling
- [ ] Copper Material Page
- [ ] Buffer Sheet Explainer
- [ ] First case study
- [ ] DXF validator tool
- [ ] 5 more FAQ pages

### Month 4-6: Depth & Tools
- [ ] Material cost estimator
- [ ] Thickness pages (dynamic)
- [ ] Guest post pitches
- [ ] Tool launches (Product Hunt, HN)
- [ ] Weekly content cadence

### Month 6-12: Competitive Push
- [ ] Comparison pages (vs Fractory, Xometry, Hubs)
- [ ] Competitive keyword targeting
- [ ] Backlink outreach campaign
- [ ] Resource page link building
- [ ] Scale to 2 posts/week

---

## Budget Considerations

### Free Tools (Start Here)
- Google Search Console
- Google Analytics 4
- Google Keyword Planner
- Serprobot (rank tracking)
- Ubersuggest (limited free searches)

### Paid Tools (If Budget Allows)
- **Ahrefs** (~€99/mo): Best for competitor analysis, backlink research
- **SEMrush** (~€119/mo): Alternative to Ahrefs
- **Contentlayer** (Free): MDX content management
- **Vercel Pro** (~€20/mo): Better analytics, image optimization

### Content Creation
- **DIY:** Write content yourself (time investment)
- **Freelance:** €0.05-0.15/word for quality writers
- **AI-assisted:** Use Claude/GPT for drafts, heavily edit for quality

**Recommendation:** Start free, invest in Ahrefs at Month 3 once you have traction to analyze.

---

## Risks & Mitigations

### Risk 1: Google Sandbox (3-6 month delay)
**Mitigation:**
- Publish consistently (shows commitment)
- Build backlinks early (speeds up trust)
- Focus on long-tail (easier to rank while sandboxed)

### Risk 2: Competitors Notice & Respond
**Mitigation:**
- Move fast on unique content (buffer sheet angle)
- Build interactive tools (hard to copy)
- Establish maker community (moat)

### Risk 3: Algorithm Updates
**Mitigation:**
- Focus on helpful content (EEAT principles)
- Avoid keyword stuffing
- Natural link building (no PBNs or spam)

### Risk 4: No Traffic Despite Good Rankings
**Mitigation:**
- Target keywords with actual search volume
- Optimize for featured snippets (position 0)
- Improve CTR with better titles/descriptions

---

## Next Steps

**Immediate (This Week):**
1. Set up Google Search Console + Google Analytics
2. Implement sitemap.ts and robots.ts
3. Add global metadata to layout.tsx
4. Submit sitemap to GSC

**Short-Term (Next 2 Weeks):**
1. Build keyword research spreadsheet
2. Set up MDX infrastructure
3. Write first pillar content (DXF Guide)
4. Optimize existing pages (homepage, upload, materials)

**Medium-Term (Next 3 Months):**
1. Publish 1 new page/week minimum
2. Build interactive tools (kerf calculator, DXF validator)
3. Launch backlink outreach campaign
4. Monitor rankings and iterate

**Ready to implement?** Start with Phase 1 (Technical Foundation) - we can build sitemap.ts, robots.ts, and metadata helpers first.
