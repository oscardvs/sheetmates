# Content Directory

This directory contains MDX content for guides, FAQs, and other educational content.

## Structure

```
content/
├── en/           # English content
│   ├── guides/   # Long-form guides (pillar + spoke content)
│   └── faq/      # FAQ pages (question-answer format)
├── fr/           # French content
│   ├── guides/
│   └── faq/
└── cs/           # Czech content
    ├── guides/
    └── faq/
```

## Guide Frontmatter

```yaml
---
title: "Complete Guide to DXF Laser Cutting"
description: "Learn how to prepare DXF files for laser cutting with this comprehensive guide"
keywords:
  - dxf laser cutting
  - prepare dxf file
  - laser cutting tutorial
publishDate: "2026-02-02"
category: "Technical"
author: "SheetMates"
---
```

## FAQ Frontmatter

```yaml
---
question: "What file format for laser cutting?"
answer: "DXF (Drawing Exchange Format) is the standard file format for laser cutting..."
category: "files"
keywords:
  - laser cutting file format
  - dxf format
publishDate: "2026-02-02"
---
```

## Adding New Content

1. Create `.mdx` file in appropriate locale/category directory
2. Add frontmatter with required fields
3. Write content using Markdown + React components
4. Route will auto-generate from filename

## File Naming

Use kebab-case for filenames:
- ✓ `dxf-laser-cutting-complete-guide.mdx`
- ✓ `kerf-compensation-explained.mdx`
- ✗ `DXF_Laser_Cutting.mdx`
