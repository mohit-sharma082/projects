# SSD Explorer

A fast, filterable, data-driven explorer for consumer SSD specifications.  
Built as a lightweight tool for researching controllers, NAND types, interfaces, capacities, and real-world characteristics across many drives.

The project focuses on clarity, performance, and usability rather than marketing content. It behaves more like a technical database than a shopping site.

---

## Overview

SSD Explorer aggregates structured SSD data from a Google Sheet and presents it through a modern, minimal interface with powerful filtering.

It is designed to answer questions such as:

- Which SSDs use TLC NAND and a specific controller?
- What options exist within a certain capacity range?
- Which models support a given interface generation?
- How different drives compare at a glance

All filtering happens client-side for speed, while data fetching is cached to minimize external requests.

---

## Features

### Data & Performance

- Server-side data fetch with caching
- Client-side filtering with instant updates
- Persistent cache using React Query
- Minimal network usage after first load
- Efficient rendering for large datasets

### Explorer Interface

- Three-panel layout for fast navigation
- Left panel: Brand selection (alphabet grouped)
- Center panel: Results grid
- Right panel: Technical filters

### Filtering Capabilities

- Brand (multi-select, grouped)
- Capacity ranges
- Interface types
- NAND types
- Text search across model, controller, and notes
- Sorting by relevance, speed, or capacity

### Result Presentation

- Clean card layout
- Key specifications highlighted
- Compact technical badges
- Links to product pages or references

---

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- TanStack React Query v5
- LocalStorage persistence
- Google Sheets as the data backend

No database or paid services are required.

---

## Architecture

Google Sheet
│
▼
Server fetch (cached)
│
▼
Client cache (React Query)
│
▼
Instant filtering & rendering

### Key Principles

- Keep the source of truth simple
- Avoid unnecessary infrastructure
- Optimize for read-heavy workloads
- Prioritize responsiveness and clarity

---

## Project Structure

#### app/

  api/sheets/route.ts — Server endpoint for sheet data
  layout.tsx — Root layout with providers
  page.tsx — Server entry page

#### components/

  SSDExplorerClient.tsx — Main explorer UI
  BrandFiltersPanel.tsx — Left sidebar
  TechnicalFiltersPanel.tsx — Right sidebar
  SSDCard.tsx — Result card
  SearchBar.tsx
  Pagination.tsx
  Providers.tsx — React Query setup

#### lib/

  sheet.ts — Google Sheets parser
  ssd-utils.ts — Data transformation & helpers
  fetcher.ts — Client data fetch helper

---

## Getting Started

### 1. Clone the repository

git clone <repo-url>
cd ssd-explorer

### 2. Install dependencies

Using pnpm:

pnpm install

---

### 3. Configure environment variables

Create a `.env.local` file:

GOOGLE_SHEET_ID=YOUR_SHEET_ID

The sheet must be publicly readable.

---

### 4. Run the development server

pnpm dev

Open:

http://localhost:3000

---

## Data Source

Data is pulled from a Google Sheet using the GViz JSON endpoint.

Advantages:

- Easy editing without redeployment
- Version history via Google Sheets
- No custom admin panel required
- Zero hosting cost for storage

---

## Customization

### Adding New Filters

1. Add fields to the sheet
2. Extend the transformation logic in `ssd-utils.ts`
3. Add UI controls in the appropriate panel
4. Update filtering logic in `SSDExplorerClient.tsx`

---

### Styling

The UI uses semantic Tailwind tokens:

- `bg-card`
- `bg-primary`
- `text-muted-foreground`
- `border`

You can adjust theme values in `tailwind.config.js`.

---

## Design Goals

- Clean, distraction-free interface
- High information density without clutter
- Fast keyboard and mouse interaction
- Scalable filter system
- Professional technical aesthetic

---

## Future Improvements

Potential enhancements include:

- Comparison mode for multiple SSDs
- Shareable filter URLs
- Mobile filter drawer
- Performance tier classification
- Controller and NAND deep linking
- Offline dataset support

---

## License

This project is intended as a personal research tool and demonstration project.  
License terms can be added as needed.

---

## Acknowledgements

SSD Explorer exists thanks to publicly available SSD data and community research efforts.  
If you use or extend this project, consider contributing improvements back.

---
