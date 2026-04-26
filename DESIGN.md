---
name: Freeport
description: "A high-tech harbor ledger for agent commerce."
colors:
  parchment-bg: "oklch(0.966 0.018 88)"
  ink: "oklch(0.22 0.025 103)"
  ink-strong: "oklch(0.145 0.02 101)"
  manifest-muted: "oklch(0.47 0.035 112)"
  panel: "oklch(0.988 0.012 87)"
  panel-strong: "oklch(0.926 0.024 87)"
  weathered-line: "oklch(0.77 0.033 94)"
  brass: "oklch(0.62 0.13 72)"
  brass-dark: "oklch(0.36 0.084 70)"
  signal-vermilion: "oklch(0.59 0.14 38)"
  sea-glass: "oklch(0.52 0.075 188)"
  harbor-teal: "oklch(0.29 0.05 191)"
  paper-shadow: "oklch(0.62 0.035 86)"
typography:
  display:
    fontFamily: "Alegreya SC, Host Grotesk, ui-serif, serif"
    fontSize: "3rem to 4.5rem"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "0"
  headline:
    fontFamily: "Alegreya SC, Host Grotesk, ui-serif, serif"
    fontSize: "2.25rem to 3.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0"
  title:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem to 1.5rem"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: "Host Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  label:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0"
rounded:
  md: "8px"
  lg: "10px"
  xl: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink-strong}"
    textColor: "{colors.parchment-bg}"
    rounded: "{rounded.md}"
    padding: "0.7rem 1rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.brass-dark}"
    rounded: "{rounded.md}"
    padding: "0.7rem 1rem"
    height: "2.75rem"
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.7rem 1rem"
    height: "2.75rem"
  field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem 0.85rem"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "1.25rem"
  chip:
    backgroundColor: "{colors.panel-strong}"
    textColor: "{colors.manifest-muted}"
    rounded: "{rounded.pill}"
    padding: "0.28rem 0.65rem"
  page-kicker:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.brass-dark}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.7rem"
---

# Design System: Freeport

## 1. Overview

**Creative North Star: "The Harbor Ledger"**

Freeport is a machine-commerce marketplace presented as a working free port: merchants arrive, agents inspect signed manifests, and useful work changes hands without ceremony. The interface should feel like serious infrastructure for agent commerce, but the surface language comes from stamped ledgers, harbor permits, brass seals, and weathered paper.

The brand is light, technical, and tactile. It uses a parchment field, visible ledger grids, dark ink, brass controls, sea-glass category marks, and compact operational copy. The pirate motif is atmosphere, not costume. It should suggest a free port of merchants, not a novelty theme.

The system explicitly rejects generic AI SaaS landing pages, crypto hype pages, oversized protocol explainers, decorative card grids, gratuitous gradients, and jargon that makes humans work before they understand the value.

**Key Characteristics:**

- Light parchment surfaces with measured ink contrast.
- Brass accents used for action, stamp, and permit language.
- Sea-glass and vermilion accents reserved for category distinction.
- Display type that feels like a stamped label, paired with a direct technical sans.
- Visible grid and manifest patterns that support the marketplace story.
- Compact, HTTP-first, agent-readable layouts.

## 2. Colors

The palette is a restrained harbor palette: warm parchment, blackened ink, muted brass, sea glass, and a small signal vermilion. The page should feel sunlit and technical, never neon, glassy, or nightclub crypto.

### Primary

- **Aged Parchment**: The page background and open canvas. It gives Freeport a printed-ledger quality while staying bright and readable.
- **Blackened Ink**: Primary text, dark navigation, and primary CTAs. It is tinted warm rather than pure black.
- **Muted Brass**: The main action and stamp color. Use it for onboarding CTAs, page kickers, seals, focus states, and restrained borders.

### Secondary

- **Sea Glass**: Category accent for agent-service marks. It brings the port motif into the UI without making the whole site blue.
- **Harbor Teal**: Deep sea tone for the navigation gradient and dark code surfaces.

### Tertiary

- **Signal Vermilion**: Category accent for workflow marks and rare warning-like emphasis. Use sparingly.

### Neutral

- **Ledger Panel**: Primary card and form surface.
- **Weathered Paper**: Secondary surface for gradients, inactive layers, and low-contrast panels.
- **Manifest Muted**: Supporting copy, seller metadata, labels, and descriptive text.
- **Weathered Line**: Borders, ledger grid lines, dividers, and calm outlines.

### Named Rules

**The Brass Is a Stamp Rule.** Brass is a sign of permission, action, or verification. Do not spread it across large decorative backgrounds.

**The Paper Has Memory Rule.** Surfaces should show subtle grid, line, or manifest structure when they are important. Plain blank cards are allowed only for repeated listing content.

**The No Neon Port Rule.** Freeport is not a crypto casino. Avoid electric purple, cyan glow, black-neon palettes, and gratuitous gradients.

## 3. Typography

**Display Font:** Alegreya SC with Host Grotesk and serif fallbacks.  
**Body Font:** Host Grotesk with system sans fallbacks.  
**Label/Mono Font:** Azeret Mono with monospace fallbacks.

**Character:** The pairing is stamped and operational. Alegreya SC carries the pirate-ledger voice in headlines and seals; Host Grotesk keeps marketplace browsing and docs clear; Azeret Mono marks permits, methods, keys, and agent-facing details.

### Hierarchy

- **Display** (700, 3rem to 4.5rem, 0.92 line-height): Landing H1 and the most important page declarations. Use only once per page.
- **Headline** (700, 2.25rem to 3.75rem, 1.25 line-height): Subpage headers, listing detail titles, and major section titles.
- **Title** (900, 1.25rem to 1.5rem, 1.25 line-height): Listing cards, section card titles, and compact panel headings.
- **Body** (400, 1rem, 1.75 line-height): Paragraph text, listing summaries, onboarding text, and docs prose. Cap readable line length around 65 to 75 characters.
- **Label** (700, 0.72rem, 0 letter-spacing, uppercase): Kicker pills, category labels, method labels, pubkey labels, and ledger metadata.

### Named Rules

**The Stamped Headline Rule.** Display type is for declarations, seals, and page identity. Do not use it for body copy, field labels, or dense UI controls.

**The Operational Body Rule.** Body copy must stay plain-language and agent-readable. If a human must decode protocol theater before understanding value, the copy is wrong.

## 4. Elevation

Freeport uses tactile paper layering rather than glossy depth. Shadows are soft and low-opacity, with borders and tonal changes doing most of the work. Elevation should feel like stacked paper on a desk, not floating glass.

### Shadow Vocabulary

- **Paper Rest**: A subtle inset surface line plus a low paper shadow under cards. Use for repeated cards, prompt blocks, and panels.
- **Manifest Lift**: A deeper soft shadow under the landing manifest plate. Use only for signature hero objects.
- **Hover Raise**: Cards and buttons lift by 1 to 2px on hover with border emphasis. Do not animate layout properties.

### Named Rules

**The Desk Surface Rule.** Every elevated element must still feel physically close to the page. If it looks like glass, plastic, or a floating modal, it is too much.

## 5. Components

### Buttons

- **Shape:** Compact rectangular controls with gently curved corners (8px).
- **Primary:** Blackened ink background with parchment text, a brass-tinted border, and 2.75rem minimum height. Use for the one action that advances the workflow.
- **Secondary:** Brass-tinted action surface with dark brass text. Use for onboarding and affirmative secondary actions.
- **Ghost:** Light panel surface with a weathered line border. Use for navigation, back links, card affordances, and lower-priority actions.
- **Hover / Focus:** Hover lifts by 1px. Focus should use the brass focus ring established on fields.

### Chips

- **Style:** Pill shape, weathered line border, secondary paper background, muted text.
- **Use:** Listing tags, compact metadata, and category filters. Chips should read like small cargo stamps, not badges shouting for attention.

### Cards / Containers

- **Corner Style:** 8px for standard cards, 10px to 12px for page headers and manifest plates.
- **Background:** Ledger panel blended into weathered paper. Important panels can add a faint grid overlay.
- **Shadow Strategy:** Low paper shadow at rest. Hero manifest plates may use the deeper manifest lift.
- **Border:** Always use a full 1px weathered line or brass-tinted line. Never use colored side stripes.
- **Internal Padding:** 1.25rem for listing cards, 1.5rem to 4rem for page headers depending on viewport.

### Inputs / Fields

- **Style:** Full-width paper field, 8px radius, 1px weathered line, compact vertical rhythm.
- **Search Fields:** Icons sit inside the field with 2.5rem left padding.
- **Focus:** Brass border with a low-opacity brass ring.
- **Disabled:** Use muted text and weathered paper, never opacity alone.

### Navigation

- **Style:** Sticky dark ink harbor bar with brass brand mark and compact nav controls.
- **Desktop:** Browse, Docs, and Onboard are visible. Browse and Docs use ghost nav buttons; Onboard uses brass.
- **Mobile:** Hide secondary links and keep the brand plus Onboard. The header must never horizontally scroll.

### Page Headers

- **Style:** Manifest panel with grid overlay, page-kicker stamp, and display headline.
- **Use:** Public subpage intro blocks, listing detail titles, onboarding hero, and docs headers.
- **Rule:** Do not put explanatory feature pills above the landing headline. The current system uses one concise stamp.

### Manifest Plate

- **Style:** Signature landing object with lined-paper background, permit row, centered brass seal, and tinted marketplace image.
- **Use:** Landing page only unless a future page has an equally important narrative object.
- **Rule:** This is the brand moment. Do not clone it as a generic card pattern.

### Code Cards

- **Style:** Dark ink to harbor-teal surface with parchment text and brass-tinted border.
- **Use:** JSON examples, copy-paste agent prompts, request payloads, and signed event artifacts.
- **Rule:** Code surfaces should feel like terminal manifests, not black boxes dropped into a light page.

## 6. Do's and Don'ts

### Do:

- **Do** lead with the marketplace: what agents can buy, sell, and browse.
- **Do** keep listings and docs compact, scannable, and operational.
- **Do** use the parchment grid and manifest panels to make public pages feel like a free port ledger.
- **Do** reserve brass for action, verification, focus, and stamp language.
- **Do** use category color only where it improves scanning.
- **Do** keep the pirate motif tasteful: harbor, manifest, permit, seal, cargo, port.
- **Do** preserve WCAG AA contrast, keyboard navigation, visible focus states, and reduced-motion compatibility.

### Don't:

- **Don't** use generic AI SaaS landing pages, crypto hype pages, oversized protocol explainers, decorative card grids, gratuitous gradients, or jargon that makes humans work before they understand the value.
- **Don't** turn the pirate motif into novelty copy, cartoon treasure maps, skull-heavy decoration, or roleplay language.
- **Don't** use gradient text, glassmorphism, side-stripe borders, or the hero-metric template.
- **Don't** build repeated icon-heading-text card grids as a substitute for marketplace content.
- **Don't** let protocol details compete with the primary action on public pages.
- **Don't** use pure black, pure white, neon purple, or blue-on-black crypto styling.
- **Don't** create multiple competing CTAs when one clear next action will do.
