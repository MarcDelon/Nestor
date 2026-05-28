# SafeTrip — UI/UX Upgrade & Migration Plan
> **Status:** Draft · **Version:** 1.0 · **Date:** 2026-05-27  
> **Scope:** Full redesign of the SafeTrip Cameroun web platform (Next.js 16 App Router + Express + Supabase)

---

## 0. Executive Summary

SafeTrip's current design uses a consistent "Luxury African Transit" aesthetic with a warm cream palette and Cameroonian flag identity. The foundation is solid. This plan identifies **what to keep, what to evolve, and what to replace** to reach a world-class travel marketplace experience — comparable to Busbud, FlixBus, or Blablacar, but rooted firmly in the Cameroonian context.

**Core goals:**
1. Dramatically improve perceived quality and polish
2. Reduce cognitive load on every page
3. Make the mobile experience feel native, not adapted
4. Introduce micro-interactions that build trust and delight
5. Maintain the Cameroonian cultural identity as a competitive differentiator

---

## 1. Current State Audit

### 1.1 Strengths (keep)
- ✅ Warm cream palette (`#F7F4EE` / `#EDE9DF`) — distinctive, not generic
- ✅ Cameroonian flag stripe accent (green/red/yellow) — strong brand identity
- ✅ Dark forest green sidebar (`#0A2F1D`) — premium feel in dashboards
- ✅ Syne + DM Sans font pairing — characterful without being unreadable
- ✅ Card-based UI with subtle elevation — familiar and scannable
- ✅ Multi-route architecture (Réserver, Agences, Traçabilité, Location) — complete feature coverage

### 1.2 Weaknesses (fix)
- ❌ **Inconsistent spacing system** — padding values are arbitrary (14px, 22px, 24px, 28px, 32px used interchangeably)
- ❌ **No global design token file** — CSS variables defined per-page; no shared spacing/radius scale
- ❌ **Homepage hero lacks visual impact** — no hero image, illustration, or atmospheric background
- ❌ **Typography scale is uneven** — `clamp()` used in some places but fixed sizes elsewhere; headings lack hierarchy at glance
- ❌ **Button system is fragmented** — 4+ different button styles across pages with no component abstraction
- ❌ **Zero page transition animations** — pages snap hard between routes; no loading skeleton/shimmer
- ❌ **Form UX is generic** — standard HTML inputs with minimal feedback; no inline validation, no focus rings with brand color
- ❌ **Dashboards feel heavy** — sidebar takes too much space on mid-size screens (1024–1280px); content area cramped
- ❌ **No empty states designed** — "no results" states are plain text; missed opportunity for delight
- ❌ **Accessibility gaps** — missing `aria-label` on many icons; focus styles inconsistent; color contrast unverified at WCAG AA

---

## 2. Design System Upgrade

### 2.1 Spacing Scale (8-point grid)
Replace all arbitrary padding/margin values with a strict 8-point scale:

```css
/* tokens.css (global) */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### 2.2 Color Token Expansion
Current palette is good — expand it with semantic aliases and a proper gray scale:

```css
/* Brand */
--color-forest:       #0A2F1D;   /* primary dark */
--color-emerald:      #00673C;   /* primary action */
--color-emerald-light:#eef8f3;   /* action background */
--color-gold:         #C8941E;   /* accent */
--color-yellow:       #FCD116;   /* Cameroon yellow */
--color-red:          #CE1126;   /* Cameroon red */
--color-green:        #007A5E;   /* Cameroon green */

/* Neutrals */
--color-cream-50:  #FDFCFA;
--color-cream-100: #F7F4EE;
--color-cream-200: #EDE9DF;
--color-cream-300: #E0D9CC;
--color-gray-400:  #A0AEC0;
--color-gray-600:  #718096;
--color-gray-800:  #2D3748;
--color-navy:      #1C2B22;

/* Semantic */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error:   #EF4444;
--color-info:    #3B82F6;
```

### 2.3 Typography Scale
Move to a responsive type scale using `clamp()` consistently:

```css
--text-xs:   clamp(0.65rem, 1vw, 0.72rem);
--text-sm:   clamp(0.78rem, 1.5vw, 0.88rem);
--text-base: clamp(0.88rem, 2vw, 1rem);
--text-lg:   clamp(1rem, 2.5vw, 1.15rem);
--text-xl:   clamp(1.15rem, 3vw, 1.35rem);
--text-2xl:  clamp(1.35rem, 4vw, 1.75rem);
--text-3xl:  clamp(1.75rem, 5vw, 2.25rem);
--text-4xl:  clamp(2.25rem, 6vw, 3rem);
--text-hero: clamp(2.5rem, 8vw, 4.5rem);
```

### 2.4 Border Radius Scale
```css
--radius-sm:  6px;
--radius-md:  12px;
--radius-lg:  18px;
--radius-xl:  24px;
--radius-2xl: 32px;
--radius-full: 9999px;
```

### 2.5 Shadow System
```css
--shadow-xs:  0 1px 3px rgba(7,26,14,0.06);
--shadow-sm:  0 4px 12px rgba(7,26,14,0.06);
--shadow-md:  0 8px 28px rgba(7,26,14,0.08);
--shadow-lg:  0 20px 48px rgba(7,26,14,0.12);
--shadow-xl:  0 32px 80px rgba(7,26,14,0.18);
```

---

## 3. Homepage Redesign

### 3.1 Hero Section
**Current problem:** The hero is text-only on a flat cream background — low visual impact.

**Proposed upgrade:**
- Add a full-bleed hero image/video (aerial footage of Cameroonian landscape or modern coach)
- Use a layered dark gradient overlay for text legibility
- Animate the title entry: split lines with staggered `translateY` + `opacity` reveal
- Add a moving particle/noise texture overlay for depth
- Integrate the search capsule as a floating card over the hero image

```
┌─────────────────────────────────────────────────────┐
│  [Aerial landscape hero image — blur edges]         │
│                                                     │
│  Voyagez en toute sécurité                         │
│  à travers le Cameroun                             │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🏙️ Départ   ➡   🏙️ Arrivée   📅 Date  🔍 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [Stats row: 50K voyageurs · 5 agences · 13 villes]│
└─────────────────────────────────────────────────────┘
```

### 3.2 Agency Marquee
- Replace the current marquee with a horizontal scroll carousel using CSS scroll snap
- Add hover-to-pause behavior
- Each agency logo gets a subtle lift animation on hover

### 3.3 Features Section
- Replace icon + text grid with an asymmetric editorial layout
- Alternate image-left / text-right per feature
- Use large counter animations triggered by Intersection Observer (0 → 50K voyageurs on scroll)

### 3.4 Trust Signals
Add a dedicated testimonials section:
- Card-based reviews with star rating, photo avatar, city
- Auto-scrolling carousel with pause on hover
- 3 language variants (French, English, Cameroonian Pidgin)

---

## 4. Component-Level Improvements

### 4.1 Navigation Bar
**Changes:**
- Add backdrop blur with a subtle gradient (`from rgba(247,244,238,0.95) to rgba(247,244,238,0.85)`)
- Add active link indicator: animated bottom border (2px slide-in from left)
- Add notification bell icon for logged-in users
- Shrink height from 64px → 56px on scroll (CSS transition on height + padding)
- "Location" badge: add `🆕` indicator for first 3 months after launch

### 4.2 Button System (create reusable components)
Define 4 canonical variants:

| Variant   | Background     | Text        | Use case              |
|-----------|----------------|-------------|-----------------------|
| `primary`   | `#0A2F1D`    | `#FCD116`   | Main CTA              |
| `secondary` | `#00673C`    | `#ffffff`   | Secondary action      |
| `outline`   | transparent  | `#00673C`   | Tertiary / ghost      |
| `ghost`     | transparent  | `#718096`   | Destructive / cancel  |

All buttons: `transition: all 0.2s ease`, `border-radius: var(--radius-full)`, scale on active (`transform: scale(0.97)`), focus ring `box-shadow: 0 0 0 3px rgba(0,103,60,0.25)`.

### 4.3 Form Inputs
- Focus state: `border-color: #00673C` + `box-shadow: 0 0 0 3px rgba(0,103,60,0.12)`
- Error state: `border-color: #EF4444` + inline error message below field
- Success state: green checkmark icon inside field on valid input
- Floating label animation: label shrinks and moves up when field has value
- Add `inputmode` attributes for mobile keyboard optimization (numeric, email, tel)

### 4.4 Bus / Journey Cards
- Add a subtle Cameroonian flag stripe on the left edge (3px, gradient)
- Use `will-change: transform` for hover lift
- Add a "seats remaining" indicator: `🔴 2 places` / `🟡 5 places` / `🟢 12 places`
- Price badge: animate from previous price if filter changes (number flip animation)

### 4.5 Loading States
**Add throughout:**
- Skeleton screens (pulsing shimmer) for bus lists, agency grids, search results
- Route-level loading: `loading.tsx` files in each route folder
- Button loading spinner: replace text with spinner + text during form submit
- Global progress bar at top of page on navigation (like NProgress)

```tsx
// app/loading.tsx (global loading)
export default function Loading() {
  return (
    <div className="skeleton-screen">
      {/* Animated skeleton cards */}
    </div>
  );
}
```

### 4.6 Empty States
Design dedicated empty state components for:
- No search results (reserver page)
- No buses matching filters (location page)
- No bookings in dashboard
- No colis found (traçabilité)

Each empty state: illustration/emoji, friendly message in French, a suggested action button.

---

## 5. Page-by-Page Improvements

### 5.1 `/reserver` — Reservation Page
- **Search bar:** Animate the origin/destination swap button with a 180° rotation
- **Journey cards:** Add animated price badges; show "Trending" badge on most-booked routes
- **Filters sidebar:** Upgrade from checkbox list to visual toggles with icons
- **Sort pills:** Already 3-sort capable — add a visual priority ranking strip
- **Mobile:** Bottom sheet for filters instead of slide-in sidebar

### 5.2 `/agences` — Agencies Page
- **Hero:** Add a world-map-style Cameroon illustration showing covered zones
- **Agency cards:** Add "Disponible maintenant" / "Hors ligne" real-time status indicator
- **Search:** Add a live search input to filter agencies by name
- **Request form modal:** Multi-step wizard (Step 1: Type · Step 2: Details · Step 3: Confirm)

### 5.3 `/tracabilite` — Parcel Tracking
- **Progress stepper:** Animate each step completion with a checkmark draw (SVG stroke animation)
- **QR Code input:** Add a "Scan QR Code" button (uses device camera via MediaDevices API)
- **Map preview:** Add a simplified route map showing colis journey with a moving dot
- **Notifications:** "Activer les notifications" toggle to get push alerts on status change

### 5.4 `/location` — Bus Rental
- **Catalog:** Add a horizontal scroll "Quick picks" row above the grid (VIP / Mariage / Pèlerinage)
- **Comparison:** Allow selecting up to 3 buses and clicking "Comparer" to see a side-by-side table
- **Price estimator:** Real-time fare calculator: select dates → see estimated total on-the-fly
- **Gallery:** Each bus card gets a photo gallery (3–5 interior/exterior photos)

### 5.5 Dashboards (Admin / Agency / Client)
- **Admin dashboard:** Add a live analytics chart (daily bookings trend — sparkline)
- **Client dashboard:** Add a timeline/journey history with map snippets
- **Agency dashboard:** Real-time booking notification toasts
- **All dashboards:** Replace table views with card-based views on mobile

---

## 6. Animation Strategy

### 6.1 Principles
- **Purposeful only** — every animation must inform or delight, not distract
- **Fast** — durations: micro (100ms), standard (250ms), emphasis (400ms)
- **Respect `prefers-reduced-motion`** — all animations must have a no-motion fallback

### 6.2 Recommended Library
Install **Motion (formerly Framer Motion)** for React animations:
```bash
npm install motion
```

### 6.3 Key Animations to Implement

| Animation | Element | Duration | Easing |
|-----------|---------|----------|--------|
| Page enter | `<main>` fade+slide up | 300ms | `cubic-bezier(0.16,1,0.3,1)` |
| Card reveal | Journey/bus cards on scroll | 400ms staggered | ease-out |
| Number counter | Stats on homepage | 1200ms | ease-in-out |
| Skeleton shimmer | Loading placeholders | 1500ms loop | linear |
| Modal entrance | All modals | 280ms slide up | spring |
| Sort pill selection | Active pill | 200ms scale | ease |
| Price change | Number flip | 300ms | ease-in-out |
| Progress stepper | SVG stroke draw | 600ms per step | ease-out |
| Hamburger → X | Menu icon morphing | 200ms | ease |

```tsx
// Example: staggered card reveal using Motion
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
>
  <BusCard bus={bus} />
</motion.div>
```

---

## 7. Performance Improvements

### 7.1 Image Optimization
- Replace all `<img>` tags with Next.js `<Image>` component for automatic WebP conversion and lazy loading
- Add blur placeholder for above-fold images
- Use `priority` prop on hero and logo images

```tsx
import Image from "next/image";

<Image
  src="/images/hero-cameroon.jpg"
  alt="Paysage camerounais"
  fill
  priority
  sizes="100vw"
  style={{ objectFit: "cover" }}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 7.2 Font Loading
- Move from `@import` in CSS to Next.js `next/font/google` for zero layout shift
- Add `font-display: swap` for all fonts

```tsx
// app/layout.tsx
import { Syne, DM_Sans } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["700","800","900"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" });
```

### 7.3 Code Splitting
- Move large fallback data arrays (FALLBACK_BUSES, FALLBACK_AGENCIES) to separate JSON files loaded with dynamic import
- Use `React.lazy()` + `Suspense` for the booking modal
- Implement route-based code splitting (already done by Next.js App Router)

### 7.4 Caching Strategy
- Add `revalidate` to API fetch calls in server components
- Implement localStorage caching for agency/bus data with 30-minute TTL
- Use SWR or React Query for data fetching with stale-while-revalidate

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Color Contrast Audit
Required minimum contrast ratios:
- Normal text: 4.5:1
- Large text (18px+ or 14px bold): 3:1
- UI components: 3:1

⚠️ **Check these pairs:**
- `#FCD116` text on `#0A2F1D` background → needs verification
- `#718096` text on `#F7F4EE` background → borderline (3.8:1 — may fail for small text)
- `#a0aec0` labels → likely fails WCAG AA — upgrade to `#718096` minimum

### 8.2 Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Modal focus trap (focus locked inside open modal)
- [ ] `Escape` closes all modals/dropdowns
- [ ] Sort pills and filter tabs work with arrow keys
- [ ] Custom checkboxes have visible focus indicators

### 8.3 ARIA
- [ ] All icon buttons: `aria-label`
- [ ] Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [ ] Progress stepper: `role="progressbar"`, `aria-valuenow`
- [ ] Search combobox: `aria-autocomplete`, `aria-expanded`
- [ ] Live regions: tracking result updates with `aria-live="polite"`
- [ ] Skip navigation link: `<a href="#main-content" className="sr-only focus:not-sr-only">`

---

## 9. Mobile-First Redesign Priorities

### 9.1 Navigation
- Replace all dropdown navs with bottom navigation bar on mobile (`position: fixed; bottom: 0`)
- Bottom bar items: 🏠 Accueil · 🎫 Réserver · 🚌 Location · 📍 Traçabilité · 👤 Profil
- Current page indicator: animated underline dot

### 9.2 Reservation Flow
- Make each step of the reservation a full-screen bottom sheet on mobile
- Progress indicator pinned to top
- Large tap targets: minimum 44×44px for all touchable elements

### 9.3 Forms
- Use `inputmode="numeric"` for phone/capacity fields
- Auto-advance on field completion where appropriate
- Full-screen date picker using native `<input type="date">` (better mobile UX than custom calendar)

### 9.4 Cards
- On < 480px, stack price and CTA below card content (not side by side)
- Swipeable card carousel for featured buses/routes
- Pull-to-refresh on listing pages

---

## 10. New Features to Design (Phase 2)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Map view** | Show routes/agencies on an interactive Leaflet.js map | High |
| **Price alerts** | Client subscribes to route; notified when price drops | Medium |
| **Group booking** | Reserve multiple seats with passenger list | High |
| **Loyalty program UI** | Points balance, tier progress bar (Bronze → Silver → Gold) | Medium |
| **Review system** | Post-trip reviews with photo uploads | Medium |
| **Multi-language** | Full FR/EN toggle (bilingual Cameroon market) | High |
| **Dark mode** | System preference-aware dark theme | Low |
| **PWA / Offline** | Service worker caching for offline timetable access | Medium |
| **Seat map** | Interactive visual seat selection | High |
| **WhatsApp integration** | "Partager mon voyage" WhatsApp button | High |

---

## 11. Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)
> Goal: Establish design system; fix glaring inconsistencies

- [ ] Create `globals-tokens.css` with full token set
- [ ] Migrate all CSS files to use tokens (spacing, colors, radii)
- [ ] Implement `next/font` for Syne + DM Sans (eliminate layout shift)
- [ ] Replace all `<img>` with Next.js `<Image>` component
- [ ] Add `loading.tsx` skeleton screens for all routes
- [ ] Fix all WCAG contrast failures
- [ ] Add `aria-label` to all icon buttons
- [ ] Implement focus ring system

### Phase 2 — Homepage & Navigation (Week 3)
> Goal: Dramatically upgrade first impressions

- [ ] New hero section with background image/video
- [ ] Animated stat counters
- [ ] Agency carousel with scroll snap
- [ ] Testimonials section
- [ ] Bottom navigation bar for mobile
- [ ] Active nav link indicator animation
- [ ] Footer redesign with newsletter signup

### Phase 3 — Core Pages (Week 4–5)
> Goal: Elevate the main user journeys

- [ ] Reservation page: animated cards, new filter UI, seat indicators
- [ ] Location page: quick picks row, photo galleries, price estimator
- [ ] Agency page: live status, multi-step request wizard
- [ ] Tracking page: animated stepper, QR scanner button
- [ ] Install `motion` library; add staggered card reveals everywhere

### Phase 4 — Dashboard & Forms (Week 6)
> Goal: Make power-user flows feel professional

- [ ] Dashboard sidebar: collapse to icon-only mode on 1024px
- [ ] Form inputs: floating labels, inline validation, focus rings
- [ ] Admin dashboard: sparkline analytics chart
- [ ] Client dashboard: journey timeline
- [ ] Empty state illustrations for all list views

### Phase 5 — Phase 2 Features (Month 2–3)
> Goal: Market differentiation

- [ ] Map view (Leaflet.js integration)
- [ ] FR/EN language toggle
- [ ] Loyalty program UI
- [ ] WhatsApp share buttons
- [ ] PWA manifest + service worker
- [ ] Review/rating system

---

## 12. Tools & Libraries Recommended

| Purpose | Recommendation | Alternative |
|---------|---------------|-------------|
| Animation | `motion` (Framer Motion v11) | GSAP |
| Data fetching | SWR | React Query |
| Icons | Lucide React | Heroicons |
| Maps | Leaflet.js + react-leaflet | Mapbox GL |
| Charts | Recharts | Chart.js |
| i18n | next-intl | react-i18next |
| Form validation | React Hook Form + Zod | Formik |
| Date picker | React Day Picker v9 | Flatpickr |
| Image placeholders | plaiceholder | @plaiceholder/next |
| Testing | Playwright (E2E) + Vitest (unit) | Cypress |

---

## 13. Metrics to Track (Before & After)

| Metric | Current (est.) | Target |
|--------|---------------|--------|
| Lighthouse Performance | ~55 | 85+ |
| Lighthouse Accessibility | ~60 | 95+ |
| First Contentful Paint | ~2.8s | < 1.2s |
| Largest Contentful Paint | ~4.2s | < 2.0s |
| Cumulative Layout Shift | ~0.25 | < 0.05 |
| Mobile usability score | ~72 | 95+ |
| Task completion rate (booking) | ~45% | 75%+ |
| Bounce rate | ~68% | < 40% |

---

## 14. Design References & Inspiration

### Direct competitors (study their UX)
- **Busbud** (busbud.com) — clean search, excellent mobile flow
- **FlixBus** (flixbus.fr) — trust signals, real-time seats
- **Blablacar** — community, reviews, multi-step booking

### Design aesthetics to reference
- **African luxury brands** — Vlisco, Nespresso Africa editions — warm texture, gold accents
- **Editorial travel sites** — Condé Nast Traveler, Lonely Planet — generous whitespace, full-bleed imagery
- **Fintech apps** — Wave, OrangeMoney UX — optimized for low-bandwidth, large tap targets

### Color inspiration for dark theme variant
- Background: `#071A0E` (deep forest)
- Surface: `#0A2F1D`
- Border: `rgba(255,255,255,0.08)`
- Text: `rgba(255,255,255,0.88)`
- Accent: `#FCD116` (Cameroon gold)

---

*This document should be reviewed and updated after each sprint. The goal is a living roadmap, not a fixed spec.*

**Next action:** Start Phase 1 — create `globals-tokens.css` and migrate the homepage CSS to use the new token system.
