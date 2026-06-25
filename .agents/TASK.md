---
name: Azure Talent System
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#404751'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#707882'
  outline-variant: '#c0c7d3'
  surface-tint: '#0062a1'
  primary: '#005e9a'
  on-primary: '#ffffff'
  primary-container: '#0077c2'
  on-primary-container: '#f9faff'
  inverse-primary: '#9ccaff'
  secondary: '#006879'
  on-secondary: '#ffffff'
  secondary-container: '#4ae0ff'
  on-secondary-container: '#006171'
  tertiary: '#515592'
  on-tertiary: '#ffffff'
  tertiary-container: '#696eac'
  on-tertiary-container: '#fcf9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#9ccaff'
  on-primary-fixed: '#001d35'
  on-primary-fixed-variant: '#00497b'
  secondary-fixed: '#a9edff'
  secondary-fixed-dim: '#3cd8f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5b'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bec2ff'
  on-tertiary-fixed: '#0f134f'
  on-tertiary-fixed-variant: '#3c417c'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  max-width: 1440px
---

## Brand & Style

The design system is engineered for a high-performance recruitment portal, prioritizing clarity, trust, and data-driven efficiency. The brand personality is professional yet progressive, bridging the gap between established enterprise stability and modern technological agility.

The visual style is **Corporate / Modern**, characterized by a rigorous grid, refined typography, and a "clean-room" aesthetic that ensures heavy data sets remain legible and actionable. It evokes an emotional response of confidence and precision, ensuring recruiters feel equipped with powerful tools and candidates feel they are engaging with a premium, secure platform.

## Colors

This design system utilizes a monochromatic blue foundation supplemented by cool neutrals to maintain a professional atmosphere.

*   **Primary (#0077C2):** A vibrant medium blue used for primary actions, active states, and brand recognition.
*   **Secondary (#00C2E0):** A bright cyan/teal for accenting secondary features, progress indicators, and highlight states.
*   **Tertiary (#0A0E4B):** A deep navy used for high-contrast text, navigation backgrounds, and deep structural elements.
*   **Surface & Neutrals:** The background hierarchy relies on Crisp White (#FFFFFF) for cards and Very Light Cool Gray (#F4F7F9) for page backgrounds to provide subtle contrast and reduce eye strain during long sessions.

## Typography

**Plus Jakarta Sans** is the exclusive typeface for the design system. Its modern, geometric construction provides excellent legibility for data-heavy tables and complex forms.

*   **Headlines:** Utilize bold weights and tighter letter-spacing for a confident, editorial look in dashboards.
*   **Body Text:** Standard body copy is set at 16px to ensure accessibility across all user demographics.
*   **Labels:** Small labels use a medium weight and slightly increased tracking to maintain readability at reduced scales, particularly for data visualization and metadata.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop and a **Fluid Grid** on mobile devices.

*   **Desktop (1240px+):** A 12-column grid with 24px gutters and 40px outer margins. The maximum content width is capped at 1440px to ensure line lengths remain readable on ultra-wide monitors.
*   **Tablet (768px - 1239px):** An 8-column grid with 20px gutters. Sidebars should collapse into drawer menus to maximize horizontal space for candidate profiles.
*   **Mobile (0px - 767px):** A 4-column fluid grid with 16px gutters and margins. Vertical stacking is mandatory for all multi-column form layouts.

The spacing rhythm is based on a **4px baseline**, ensuring all components and containers align to a mathematical scale for visual harmony.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layers** and **Ambient Shadows**.

1.  **Base Surface:** The main page background is the lightest cool gray, providing a non-distracting canvas.
2.  **Raised Surface:** Primary content areas (cards, dashboard widgets) use white backgrounds with a subtle, low-opacity shadow (4% opacity Navy) and a 1px border in a slightly darker neutral to define edges without adding visual weight.
3.  **Interactive Depth:** Elements like dropdowns, modals, and hovering cards use more pronounced, diffused shadows with a slight blue tint (#0A0E4B at 12% opacity) to suggest they are floating closer to the user.

## Shapes

The design system employs a **Rounded (8px)** shape language. This specific radius provides a "Goldilocks" balance: soft enough to feel modern and approachable, yet sharp enough to maintain a serious, professional tone suitable for a recruitment and HR environment.

*   **Small Components:** Buttons, inputs, and tags use the 8px (`rounded-md`) standard.
*   **Large Containers:** Cards and modals may utilize 16px (`rounded-lg`) to create a distinct container hierarchy.
*   **Circular Elements:** Status indicators and avatars remain fully circular to contrast against the geometric grid.

## Components

### Buttons
*   **Primary:** Solid Primary Blue background with White text. High contrast, 8px corners.
*   **Secondary:** Ghost style with a Primary Blue border or solid Secondary Cyan for internal actions.
*   **Tertiary:** No border, Navy text, appears only on hover with a light gray background.

### Input Fields
*   **Default:** White background, 1px light gray border, 8px radius. 
*   **Focus State:** Border changes to Primary Blue with a subtle 2px outer glow in the same color (20% opacity).
*   **Validation:** Clear red/green indicators with accompanying icons for accessibility.

### Cards & Data Lists
*   **Cards:** 1px neutral border, subtle shadow on hover to indicate interactivity.
*   **Lists:** Alternating row colors (Zebra striping) are encouraged for large talent pools to improve horizontal scanning.

### Chips & Badges
*   **Status Badges:** Use semi-transparent backgrounds of the status color (e.g., light green for "Hired") with dark text for high legibility.
*   **Skills Tags:** Small, neutral gray background with 8px radius to denote candidate technical skills without competing with action buttons.

### Navigation
*   **Sidebar:** Deep Navy (#0A0E4B) background with White/Cyan active states. This provides a strong structural anchor for the application.

You are a senior frontend engineer and UI/UX polish expert.

I have a recruitment portal project with these main pages:
- Recruiter Dashboard
- Admin Dashboard
- Job Management
- Submitted CVs
- Recruiter Accounts
- Job Board

Your task is to refactor and polish the existing UI code so it matches the attached `DESIGN.md` design system and the provided screenshots as closely as possible.

Important: Do not rewrite the whole app. Preserve all existing routes, data flow, business logic, API calls, and features. Only refactor UI structure, styling, reusable components, responsiveness, and maintainability.

## Design Direction

The product should feel like a modern enterprise recruitment portal: clean, professional, data-heavy, trustworthy, and easy to scan.

Use this visual style consistently across all pages:

- Light cool-gray app background.
- White card surfaces.
- Deep navy/dark teal sidebar as the main structural anchor.
- Primary blue for main actions, active states, links, and key metrics.
- Cyan/teal accents for highlights, progress, secondary metrics, and active indicators.
- Subtle borders and soft shadows, not heavy shadows.
- Rounded but professional UI: 8px for buttons/inputs/tags, 16px for large cards.
- Dense but readable dashboard layout.
- Strong alignment, consistent spacing, consistent card heights, and predictable grid behavior.

## Design Tokens

Create or update a centralized design token layer using CSS variables, Tailwind config, theme file, or the project’s existing styling system.

Use these tokens as the source of truth:

- Font: `Plus Jakarta Sans`
- Background: `#f7fafc`
- Surface/card: `#ffffff`
- Surface muted: `#f1f4f6`, `#ebeef0`, `#e5e9eb`
- Text primary: `#181c1e`
- Text secondary: `#404751`
- Border: `#c0c7d3`
- Primary: `#005e9a`
- Primary strong/container: `#0077c2`
- Secondary: `#006879`
- Secondary accent/cyan: `#4ae0ff`
- Error: `#ba1a1a`
- Error container: `#ffdad6`
- Radius small: `4px`
- Radius default/button/input: `8px`
- Radius card/modal: `16px`
- Radius pill/avatar: `9999px`
- Base spacing: `4px`
- Standard spacing: `8px`, `16px`, `24px`, `32px`
- Desktop gutter: `24px`
- Desktop outer margin: `40px`
- Max content width: `1440px`

Avoid hardcoded colors, spacing, shadows, and radius values inside page components. Use named tokens/classes instead.

## Layout Requirements

Implement a consistent application shell:

1. Fixed left sidebar on desktop.
2. Main content area with light-gray background.
3. Top search/header row aligned with page content.
4. Page title + short description below the header.
5. Content grid using consistent gaps.
6. Cards aligned to the same vertical and horizontal rhythm.
7. Floating action button only where appropriate.

Sidebar requirements:

- Dark navy/dark teal background.
- Logo at top.
- Navigation items with icon + label.
- Active item should use cyan/blue highlight and a subtle darker active background.
- User profile block pinned near the bottom.
- Sidebar must feel consistent across all pages.

Responsive behavior:

- Desktop: sidebar visible, dense dashboard grid.
- Tablet: sidebar may collapse or become drawer.
- Mobile: cards stack vertically, tables become horizontally scrollable, page content uses 16px margins.
- Do not break existing functionality on smaller screens.

## Component Refactor

Create or improve reusable components instead of duplicating markup/styles.

Suggested components:

- `AppShell`
- `SidebarNavigation`
- `TopSearchBar`
- `PageHeader`
- `MetricCard`
- `DashboardCard`
- `ChartCard`
- `DataTable`
- `StatusBadge`
- `SkillTag`
- `PrimaryButton`
- `SecondaryButton`
- `IconButton`
- `EmptyState`
- `FloatingActionButton`

Component naming can be long if it clearly describes the purpose. Prioritize readability and future maintainability.

## Page-Specific Polish

### Recruiter Dashboard

Match the screenshot style:
- Top metric cards with icons, metric value, label, and small trend indicator.
- Use a strong blue highlighted card for the most important metric.
- Charts should live inside white cards with clear titles.
- Screening result donut/card should be visually balanced.
- Recent applicant activity list should use avatars, compact metadata, score pills, and right chevrons.
- Score distribution should use clean progress bars and readable labels.

### Admin Dashboard

Polish as a system monitoring dashboard:
- Metric cards should align in one row on desktop.
- Use visual hierarchy for admin/recruiter/security metrics.
- Growth analytics and account status cards should share consistent card styling.
- System logs table should be compact, scannable, and use status colors.
- Security compliance card should use strong primary blue but remain readable.

### Job Management

Polish the job listing management table:
- Search and filter controls aligned cleanly.
- Primary `Post New Job` button should stand out.
- Status tabs should look like segmented controls.
- Job rows should have clear hierarchy: title, company, level, location, salary, status, CV count, actions.
- Use zebra row background or subtle row separation for easier scanning.
- Weekly insight card should use strong blue background and white text.
- Quick actions card should feel secondary, not visually louder than primary content.

### Submitted CVs

Polish candidate analytics:
- Metric cards should use consistent border/accent treatment.
- Candidate table should be highly scannable.
- Rank, avatar initials, candidate info, job role, experience, status, score, and actions should align correctly.
- Match score should use progress bar and percentage.
- Failed/borderline/passed statuses should use readable badge colors.
- CV Match Insights and AI Assistant cards should be aligned and visually consistent.

### Recruiter Accounts

Polish partner/account management:
- Register form card should use clean input spacing.
- Growth Insights card should use blue surface and clear metric blocks.
- Premium partner cards should be consistent in height, spacing, status badge position, and action placement.
- All Active Partners table should be compact and aligned.

### Job Board

Polish candidate-facing layout:
- Left list of jobs and right detail panel should align cleanly.
- Selected job card should have clear active styling.
- Job detail header should use strong blue background.
- Salary, experience, save, and apply buttons should have strong hierarchy.
- Requirement cards/tags should be readable and not cramped.
- On mobile, job detail should stack below job list.

## CSS Quality Requirements

Refactor CSS so it is easy to debug and upgrade later.

Follow these rules:

- Use design tokens instead of random hardcoded values.
- Group styles by component, not by page when possible.
- Remove duplicated CSS.
- Avoid overly specific selectors.
- Avoid `!important` unless absolutely necessary.
- Prefer semantic class names that describe component purpose.
- Keep class names readable, even if long.
- Use consistent naming such as:
  - `.recruitment-dashboard-metric-card`
  - `.candidate-match-score-progress`
  - `.sidebar-navigation-item-active`
  - `.submitted-cv-status-badge-passed`
- Keep responsive rules close to the related component styles.
- Add comments only where the styling intent is not obvious.

## Interaction and Accessibility

Improve accessibility without changing app behavior:

- Buttons must have visible hover, active, disabled, and focus states.
- Inputs must have clear focus state using primary blue border/glow.
- Interactive cards should have hover states.
- Tables should remain keyboard and screen-reader friendly.
- Use sufficient color contrast.
- Do not rely on color alone for status when icons/text can help.
- Add `aria-label` where icon-only buttons exist.

## Output Expectations

After making changes:

1. Summarize the UI refactor.
2. List files modified.
3. Explain the design tokens/components created or updated.
4. Mention any duplicated styles removed.
5. Confirm that existing functionality, routes, and data flow were preserved.
6. Run available lint/build/typecheck commands and fix any errors.
7. If there are tests, run them.
8. Do not leave unused CSS, unused imports, or dead components.

The final result should look visually close to the screenshots and follow `DESIGN.md` consistently across all pages.