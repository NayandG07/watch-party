# Premium Private Synchronized Watch-Party Platform
## Complete Frontend Design & UX Specification

This document serves as the absolute, production-ready frontend design and layout blueprint for the platform. It is written for frontend engineers and design system developers to implement the entire experience using **React, TypeScript, TailwindCSS, shadcn/ui, and React Router** without needing to make any secondary creative or structural design decisions.

---

## SECTION 1: THE COLOR SYSTEM & DESIGN TOKENS

To deliver a cinematic, high-end experience, the platform utilizes two distinct color spaces. The primary focus is on **Cinematic Carbon** (Dark Mode), which matches the environment of a darkened room and makes screen artwork pop. The secondary theme is **Gallery Alabaster** (Light Mode), which provides an elegant, gallery-like reading experience with warm, physical slate and paper-like elements.

### 1.1 Cinematic Carbon (Primary Dark Theme)
The dark theme mimics a high-end physical theater—matte black finishes, warm-toned gray boundaries, amber-copper accent lights, and high-contrast, glowing display interfaces.

| Token Name | Tailwind Class / CSS Value | Hex Value | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `color-bg-base` | `bg-neutral-950` | `#0A0A0A` | Absolute canvas base background. |
| `color-bg-surface` | `bg-neutral-900` | `#171717` | Card backgrounds, panel overlays, modal containers. |
| `color-bg-elevated`| `bg-neutral-800` | `#262626` | Dropdowns, hovering tooltips, nested containers. |
| `color-border-dim` | `border-neutral-900` | `#171717` | Subtle divider lines, table row borders. |
| `color-border-med` | `border-neutral-800` | `#262626` | Card edges, standard structural bounds. |
| `color-border-high`| `border-neutral-700` | `#404040` | Focused input borders, hover outlines. |
| `color-text-title` | `text-neutral-50` | `#FAFAFA` | Large display titles, headings, active text. |
| `color-text-body`  | `text-neutral-200` | `#E5E5E5` | Default body copy, paragraphs, reading layout. |
| `color-text-muted` | `text-neutral-400` | `#A3A3A3` | Metadata labels, subtitles, timestamps. |
| `color-text-dim`   | `text-neutral-500` | `#737373` | Disabled labels, placeholder text. |
| `color-brand`      | `text-amber-500` / `bg-amber-500` | `#F59E0B` | Cinematic copper/amber light. High-end. |
| `color-brand-hover`| `bg-amber-600` | `#D97706` | Hover state for solid brand elements. |
| `color-brand-glow` | `shadow-[0_0_15px_rgba(245,158,11,0.15)]` | - | Subtle ambient glow on active/hovered posters. |

### 1.2 Gallery Alabaster (Secondary Light Theme)
An editorial, gallery-inspired layout. It avoids harsh pure whites, preferring warm linen and soft limestone grays, with deep-charcoal typography.

| Token Name | Tailwind Class / CSS Value | Hex Value | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `color-bg-base` | `bg-stone-50` | `#FAF9F6` | Absolute canvas base background. |
| `color-bg-surface` | `bg-white` | `#FFFFFF` | Card backgrounds, active reading boards. |
| `color-bg-elevated`| `bg-stone-100` | `#F5F5F4` | Dropdowns, hover items, nested container surfaces. |
| `color-border-dim` | `border-stone-100` | `#F5F5F4` | Divider lines, subtle row separators. |
| `color-border-med` | `border-stone-200` | `#E7E5E4` | Card outlines, secondary borders. |
| `color-border-high`| `border-stone-300` | `#D6D3D1` | Active input outlines, focus indicators. |
| `color-text-title` | `text-stone-900` | `#1C1917` | High-contrast display headings, bold labels. |
| `color-text-body`  | `text-stone-800` | `#44403C` | Default text copy, descriptive paragraphs. |
| `color-text-muted` | `text-stone-500` | `#78716C` | Metadata labels, description subtitles. |
| `color-text-dim`   | `text-stone-400` | `#A8A29E` | Disabled text, standard form placeholders. |
| `color-brand`      | `text-amber-600` / `bg-amber-600` | `#D97706` | Premium physical copper brand accent. |
| `color-brand-hover`| `bg-amber-700` | `#B45309` | Hover states. |
| `color-brand-glow` | `shadow-[0_0_12px_rgba(217,119,6,0.1)]` | - | Ambient physical shadow pairing. |

### 1.3 Core Semantic Colors (Universal)
These semantic tokens remain cohesive across both dark and light themes, map directly to user actions, and utilize subtle status accents.

- **Success**: Base `#10B981` (`emerald-500` / Dark) \| `#059669` (`emerald-600` / Light). Used for successful file uploads, invitation acceptance, and active room sync states.
- **Warning/Pending**: Base `#F59E0B` (`amber-500` / Dark) \| `#D97706` (`amber-600` / Light). Used for pending invitations, storage warning thresholds.
- **Destructive/Error**: Base `#EF4444` (`red-500` / Dark) \| `#DC2626` (`red-600` / Light). Used for critical error states, storage connection failures, leaving a room, or deleting.
- **Sync Active Indicator**: `#3B82F6` (`blue-500` / Dark) \| `#2563EB` (`blue-600` / Light). Represents healthy, real-time synchronization between members.

---

## SECTION 2: TYPOGRAPHY, SPACING, AND LAYOUT GRID

To achieve a balanced editorial look, we pair a high-character geometric heading face with an ultra-legible reading face and a mechanical mono font for timeline data.

### 2.1 Font Selection & Tokens
1. **Display Font (Headings, titles, hero elements)**: `Outfit` (Sans-serif, geometric, rounded geometric counters, tracking tight, reminiscent of Apple TV UI).
2. **Body & UI Font (Labels, lists, copy)**: `Inter` (Sans-serif, highly neutral, legible at small scales).
3. **Data & Monospace Font (Timestamps, metrics, logs, bitrates)**: `JetBrains Mono` or `Fira Code` (Equal glyph widths, clear numbers).

```css
/* Typography Classes */
.font-display {
  font-family: 'Outfit', -apple-system, sans-serif;
  letter-spacing: -0.02em;
}
.font-body {
  font-family: 'Inter', -apple-system, sans-serif;
  letter-spacing: -0.01em;
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.015em;
}
```

#### Size Scale
- `fs-xs`: `11px` / `0.6875rem` (Monospace labels, playback stats, tiny duration tags).
- `fs-sm`: `13px` / `0.8125rem` (Default button text, text fields, menu item names, user lists).
- `fs-base`: `15px` / `0.9375rem` (Subheadings, default chat text, movie description text).
- `fs-md`: `18px` / `1.125rem` (Section headers, dialog titles, library card titles).
- `fs-lg`: `22px` / `1.375rem` (Collection titles, modal main headings, detail headers).
- `fs-xl`: `32px` / `2rem` (Movie Detail hero titles, authentication welcomes).
- `fs-display`: `48px` \| `64px` / `3rem` \| `4rem` (Splash landing screen headings, watch room empty state titles).

### 2.2 Spacing Scale (8px Grid-based)
All margins, paddings, and layouts conform strictly to the 8px baseline grid to create strong vertical alignment.
- `space-1` = `4px` (Border to label clearance, micro-dot dividers).
- `space-2` = `8px` (Icon to text gap, grid item padding, chip inner clearance).
- `space-3` = `12px` (Internal card contents gap, default list item padding).
- `space-4` = `16px` (Standard page element padding, input internal padding, button margins).
- `space-6` = `24px` (Inner panel margins, horizontal spacing of bento components).
- `space-8` = `32px` (Section divider clearances, outer container gutters).
- `space-12` = `48px` (Hero offsets, page top spacing, screen margins).
- `space-16` = `64px` (Major layout blocks vertical split, splash screen elements).

### 2.3 Container Widths & Layout Margins
To accommodate multiple viewport types, container widths are locked with tight bounding constraints.

- **Desktop (Base Viewport: 1440px)**
  - Gutter padding: `40px` (`px-10` in Tailwind)
  - Sidebar layout: Width of navigation rail is fixed at `240px`.
  - Grid configuration: 6-column grid for standard posters, 4-column for large collections.
  - Max container width: `1536px` (`max-w-7xl` or `max-w-screen-2xl`).

- **Tablet (Base Viewport: 768px - 1024px)**
  - Gutter padding: `24px` (`px-6` in Tailwind)
  - Navigation: Collapses into a thin iconic sidebar `64px` wide.
  - Grid configuration: 3-column grid for standard movie posters.

- **Mobile (Base Viewport: 360px - 480px)**
  - Gutter padding: `16px` (`px-4` in Tailwind)
  - Navigation: Shifts to a floating bottom navigation tab bar, `56px` height.
  - Grid configuration: 2-column poster grid with tight margins.

- **Large TVs (Base Viewport: 1920px - 3840px / 4K)**
  - Gutter padding: `64px` (`px-16`)
  - Typography: Scales up by a factor of `1.2x` via root em modification.
  - Layout: Wide, panning horizontal carousels with focus-based visual expansion.

### 2.4 Corner Radius (Restrained & Cinematic)
- `radius-xs` = `2px` (Strict UI elements: Checkbox, inner focus ring boundaries).
- `radius-sm` = `4px` (Interface components: Input fields, small action buttons, badges).
- `radius-md` = `8px` (Medium containers: Primary page buttons, search bars, context menus, tooltips).
- `radius-lg` = `12px` (Cards & Art: Standard movie posters, collections, chat overlays).
- `radius-xl` = `16px` (Large wrappers: Complete modal screens, dialog boxes, system notifications).
- `radius-full` = `9999px` (Avatars, circle action sliders).

---

## SECTION 3: COMPONENT INVENTORY & INTERACTIVE SYSTEM

This inventory outlines the specific markup structures, custom modifiers, and interaction definitions for all basic building blocks.

### 3.1 Button Variants (Highly Interactive)
Buttons define direct user transitions. They utilize active tracking transitions and physical scale-down animations when clicked.

- **Primary Button (The Cinematic Trigger)**:
  - *Dark*: Solid `#FAFAFA` background, `#0A0A0A` text, display font, semi-bold. Transitions on hover with a `scale-102` layout and subtle amber shadows (`color-brand-glow`).
  - *Light*: Solid `#1C1917` background, `#FAF9F6` text, display font, semi-bold.
  - *Animation*: On click: physical shrink `scale-98`. Duration `150ms`.

- **Secondary Action Button**:
  - *Dark*: Neutral border `#262626`, background `rgba(23,23,23,0.4)` (transparent backdrop blur), text `#FAFAFA`. Hover: border `#404040`, background `rgba(38,38,38,0.6)`.
  - *Light*: Neutral border `#E7E5E4`, background `rgba(255,255,255,0.4)`, text `#1C1917`. Hover: border `#D6D3D1`, background `rgba(245,245,244,0.6)`.

- **Minimal Icon Button**:
  - Transparent circular base, default color is muted. On hover, background fills with 10% opacity white (dark mode) or 10% opacity slate (light mode), shifting icon to title text color. Ideal for player controls.

### 3.2 Form Inputs & Interactive Controls
- **Text Fields**:
  - Framed in a single `radius-md` box.
  - Border is neutral-800 (Dark) \| stone-200 (Light). Placeholder is muted text.
  - *Focus State*: Border shifts to `color-brand` (Amber), accompanied by a 1px ring of brand tint, with zero default browser outline. Placeholder shifts -4px up if utilizing dynamic float fields.

- **Checkbox Control**:
  - Small, sharp square (`radius-sm`).
  - Unchecked: Neutral border, black void fill.
  - Checked: Fills completely with `color-brand`. Inserts a white vector checkmark. Uses standard transition `duration-150`.

- **Context & Dropdown Menus (The "Apple-like" Floating Sheets)**:
  - Float with `backdrop-blur-md`, base bg: `rgba(23,23,23,0.8)` (Dark) \| `rgba(255,255,255,0.9)` (Light).
  - Borders: `#262626` \| `#E7E5E4`.
  - Shadow: Elegant deep offset `shadow-2xl` with a subtle dark halo.
  - Menu Items: Padding `py-2 px-3`. Hovering over a menu item triggers a subtle highlight slide transition behind the text.

### 3.3 Dialogs, Tooltips, and Badge Systems
- **Dialog Overlays**:
  - Base backdrop is highly cinematic: dark transparent screen `rgba(0,0,0,0.6)` with a custom blur factor of `backdrop-blur-sm` (4px).
  - Modal enters from center with a slight upward translate `translate-y-4` to `translate-y-0` and scale-95 to scale-100 transition.
- **Badge Indicators**:
  - Low-key pill capsules (`px-2 py-0.5`, display font, uppercase, heavy tracking).
  - Variant *Active Sync*: Light blue fill, crisp blue font.
  - Variant *Storage Limit*: Light red fill, deep crimson text.
  - Variant *Level 2 Creator*: Light amber fill, rich golden amber text.

---

## SECTION 4: REUSABLE LAYOUT PATTERNS & THE "CINEMATIC RATIO"

```
+-----------------------------------------------------------+
|                                                           |
|    [=== WATCH PLATFORM CINEMATIC POSTER RATIO: 2:3 ===]   |
|                                                           |
|    +-----------------------+   Hover Behavior:            |
|    |                       |   - Translates up 4px        |
|    |                       |   - Applies amber-copper glow|
|    |                       |   - Reveals quick action overlay:|
|    |       IMAGE AREA      |     [Play Now] [Share] [...] |
|    |                       |                              |
|    |       2:3 Aspect      |   Metadata is positioned     |
|    |         Ratio         |   directly below the poster  |
|    |                       |   without padding clutter    |
|    |                       |                              |
|    +-----------------------+                              |
|    Movie Title (Outfit, Medium, Title Color)             |
|    1080p · 2h 14m · Shared by Ryan (Mono, Muted Color)    |
+-----------------------------------------------------------+
```

### 4.1 Poster Card Layout Pattern
All movie cards across library grids and horizontal rows conform to a strict **2:3 Cinematic Ratio**.
- **Container Structure**:
  ```tsx
  <div className="group relative flex flex-col gap-2">
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border-med bg-bg-surface transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand group-hover:shadow-brand-glow">
      {/* Artwork overlay and quick action triggers */}
    </div>
    <div className="flex flex-col gap-0.5">
      {/* Dynamic textual layout */}
    </div>
  </div>
  ```

### 4.2 Bento Library Overview Pattern
Used on the Home Screen. Rather than standard Netflix horizontal banners, we arrange content in balanced visual clusters to highlight key assets.

- **Grid Sizing**: 4 Columns (Grid layout `md:grid-cols-4 gap-6`).
- **Feature Area (Column Span 2, Row Span 2)**: Displays the primary "Quick Resume" movie. Utilizes a massive 16:9 cinematic backdrop with an inline active playback scrub bar.
- **Sidebar Bento Block (Column Span 1)**: Displays "Shared Activity History"—recent watch sessions and metadata cards showing who watched what, with minimal typography.
- **Top Shared List (Column Span 1)**: Lists "Pending watch invitations" and connection parameters for direct friends.

---

## SECTION 5: PRIVACY BY DESIGN & THE SYNC EXPERIENCE

The watch-party platform operates on a strict **Zero-Telemetry, Maximum-Trust** philosophy. It rejects modern invasive social features in favor of distraction-free, high-fidelity synchronization.

### 5.1 Privacy Policy & UI Guidelines
1. **No Real-Time Social Stalking**: No active status indicators (e.g., green "online" dots), no "Ryan is currently browsing" prompts, and no profile timelines displaying historical logs.
2. **Implicit Invisible Presence**: When in the main Lobby or Library, users are completely invisible. They only become visible when they explicitly join an active **Watch Room**.
3. **Library Isolation**: Your personal connected Backblaze storage bucket is completely private. Other friends can only browse movies that are explicitly cataloged inside a shared **Collection** or added to a collaborative playlist.

### 5.2 The Unified Sync Engine Interaction Model
The Synchronization Engine uses a **Single Master Timeline** paradigm. Unlike typical stream sharing, which degrades resolution, everyone streams direct high-quality video files from Backblaze B2, synchronized by precise timestamp socket events.

```
+-----------------------------------------------------------------+
|                       THE TIMELINE SYNC ENGINE                  |
|                                                                 |
|  Room Status: SYNCED (3 Members Active)                        |
|  [===========================o-----------------------] 42:15    |
|                              |                                  |
|                              v Buffer Alert Trigger             |
|                    +------------------------------------+       |
|                    | Member "Sarah" is buffering...     |       |
|                    | She will jump to current timestamp |       |
|                    | when loaded. (No pauses for others)|       |
|                    +------------------------------------+       |
+-----------------------------------------------------------------+
```

- **No Pause-Locking**: If Sarah encounters network buffering, the video player does *not* freeze for the rest of the room. The other 3 members continue watching. The moment Sarah's buffer resolves, her player executes a seek directly to the updated room timestamp broadcasted by the server.
- **Buffer UI Representation**:
  - The watch player controls display a small status line in the corner: `Sarah buffering (94% cached)...`.
  - Sarah sees a central spinning canvas element with the current active timeline timestamp still counting up underneath.
- **Latency Adjustment**: Any member whose client timestamp drifts by more than `1.5 seconds` from the master coordinator is silently re-seeked to the exact synchronized coordinate using an sub-second fade transition.

---

## SECTION 6: DETAILED PAGE ARCHITECTURE (SPLASH TO ADMIN)

Here we provide the exact layouts, wireframes, component lists, and accessibility parameters for every individual view in the application.

---

### PAGE 1: SPLASH PAGE
- **Purpose**: Welcoming returning members, explaining platform parameters, displaying high-end typography, and prompting for invitation codes.
- **Layout**: Complete full-screen immersive design. Utilizes **Aurora** background colors in a subtle, extremely dark, low-opacity gradient that slowly pans in the background.

#### Wireframe
```
+-----------------------------------------------------------------+
|                      [ P R I V A T E ]                          |
|                                                                 |
|                    THE WATCH-PARTY PLATFORM                     |
|                                                                 |
|             Cinematic. Private. Synchronized.                   |
|                                                                 |
|         [ Enter Private Invitation Code ]                      |
|         +---------------------------------------+               |
|         | _                                     |               |
|         +---------------------------------------+               |
|                                                                 |
|         [ Access Platform ]   [ View Design Manifesto ]         |
|                                                                 |
|  Built for trusted friends. Zero tracking. direct streaming.     |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `FullScreenWrapper`: Fixed height, `overflow-hidden`, dark-base theme.
  - `AmbientAuroraBackground`: Configured on a separate layered absolute div with 40% opacity.
  - `HeroGroup`: Displays platform title in large 64px display font.
  - `InvitationForm`: Form text input and matching absolute button.
  - `SecondaryNav`: Quick link anchor items for system manifestos.
- **Spacing**:
  - Title to input gap: `space-8` (32px).
  - Main button container margin-top: `space-6` (24px).
  - Bottom info line clearance: `space-12` (48px) from screen edge.
- **Visual Hierarchy**:
  - Giant white display title dominates the page, followed by a secondary line in muted amber text. Input is a clean borderless box with custom light underline.
- **Interactions**:
  - Entering an invitation code triggers a character-by-character zoom sound (if audio enabled) or subtle letter-spacing animation.
- **Empty & Loading States**:
  - Inputting incorrect code triggers a subtle horizontal shake animation.
- **Responsive Adaptations**:
  - *Mobile*: Sidebar content shifts above center. Title typography drops to `32px`.
  - *Large TV*: Centers typography with a wide spatial grid, utilizing a `1.5x` size multiplier on the invitation container.
- **Accessibility**:
  - The input field must have an explicit `aria-label="Invitation Code"`. High contrast focus outline on the input field must be visually apparent via a custom amber shadow ring.
- **Animations**:
  - On entrance: Elegant fade-in with a staggered upward translation of 15px for text elements using `motion` transitions over `0.6s`.

---

### PAGE 2: LOGIN PAGE
- **Purpose**: Simple, highly secure credential authentication for verified members.
- **Layout**: Split horizontal grid or centered clean canvas card. We prefer a centered card to keep the focus tight and eliminate distracting visual clutter.

#### Wireframe
```
+-----------------------------------------------------------------+
|                                                                 |
|                      +-------------------+                      |
|                      |   WELCOME BACK    |                      |
|                      |                   |                      |
|                      |  Email Address    |                      |
|                      |  [_____________]  |                      |
|                      |                   |                      |
|                      |  Password         |                      |
|                      |  [_____________]  |                      |
|                      |                   |                      |
|                      |  [ Sign In ]      |                      |
|                      |                   |                      |
|                      |  Forgot password? |                      |
|                      +-------------------+                      |
|                                                                 |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `AuthContainer`: Centered 400px width card with standard `radius-xl` corners.
  - `HeaderGroup`: "WELCOME BACK" header, subtitle in body font.
  - `FormContainer`: Email input, Password input with a toggleable eye icon.
  - `SubmitButton`: Solid primary layout.
  - `FooterNav`: Action links.
- **Spacing**:
  - Horizontal card paddings: `space-8` (32px).
  - Vertical gap between input elements: `space-4` (16px).
- **Interactions**:
  - Real-time inline field validation occurs when typing. The input box border shifts to error state (crimson) only after the user leaves the input (onBlur) if incorrect email format is entered.
- **Accessibility**:
  - Forms must integrate complete keyboard focus tracking. TabIndex is configured sequentially (1: Email, 2: Password, 3: Login Button). Supports screen-reader descriptive error announcements.

---

### PAGE 3: REGISTER PAGE
- **Purpose**: Account generation for newly invited users with verification codes.
- **Layout**: Centered clean card matching the login interface for visual consistency.

#### Wireframe
```
+-----------------------------------------------------------------+
|                                                                 |
|                      +-------------------+                      |
|                      |  CREATE ACCOUNT   |                      |
|                      |                   |                      |
|                      |  Invite Code      |                      |
|                      |  [ XYZ-987-123 ]  | (Prefilled, Locked)  |
|                      |                   |                      |
|                      |  Username         |                      |
|                      |  [_____________]  |                      |
|                      |                   |                      |
|                      |  Password         |                      |
|                      |  [_____________]  |                      |
|                      |                   |                      |
|                      |  [ Create ]       |                      |
|                      +-------------------+                      |
|                                                                 |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `AuthContainer` -> `RegistrationForm` -> `FormFields` -> `SubmitAction`.
- **Interactions**:
  - Inputting a weak password dynamically reveals a 4-segment strength bar below the password field. The strength indicator transitions color smoothly from neutral-800 to red to amber to success emerald based on character complexity.

---

### PAGE 4: ACCEPT INVITATION PAGE
- **Purpose**: Welcoming a new friend who clicked an external share link, showing who invited them, and offering a quick click-to-accept workflow.
- **Layout**: Premium horizontal card. The left pane shows the inviter’s avatar and personalized message, while the right pane holds the sign-up form.

#### Wireframe
```
+-----------------------------------------------------------------+
|                                                                 |
|         +---------------------------------------------+         |
|         |   Ryan invited you to join                  |         |
|         |   "The Screening Room"                      |         |
|         |                                             |         |
|         |   [ Accept and Create Account ]             |         |
|         |   [ No thanks, decline ]                    |         |
|         +---------------------------------------------+         |
|                                                                 |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `SplitLayout` -> `InviterProfileSection` \| `InvitationActionBlock`.
- **Interactions**:
  - Hovering over "Accept" triggers a celebratory ambient backdrop glow that softly expands behind the profile picture, using a custom scale transition.

---

### PAGE 5: FORGOT PASSWORD PAGE
- **Purpose**: Allowing members to securely request credential recovery hooks.
- **Layout**: Centered card following the auth design template.

#### Wireframe
```
+-----------------------------------------------------------------+
|                                                                 |
|                      +-------------------+                      |
|                      |  RECOVER ACCESS   |                      |
|                      |                   |                      |
|                      |  Email Address    |                      |
|                      |  [_____________]  |                      |
|                      |                   |                      |
|                      |  [ Send Link ]    |                      |
|                      |                   |                      |
|                      |  < Return to Login|                      |
|                      +-------------------+                      |
|                                                                 |
+-----------------------------------------------------------------+
```

- **Interactions**:
  - Clicking "Send Link" transforms the card using a elegant 3D flip animation (`perspective-1000 rotate-y-180`) into a secondary success state displaying an envelope icon with a checkmark.

---

### PAGE 6: HOME SCREEN
- **Purpose**: The central dashboard for browsing recent additions, resuming in-progress movies, viewing shared collections, and accepting pending rooms.
- **Layout**: Custom bento grid at the top, followed by premium, wide, edge-to-edge horizontal scrolling rows.

#### Wireframe
```
+-----------------------------------------------------------------+
| [Logo] Library  Collections  Friends  Uploads    [Ryan's Avatar] |
|-----------------------------------------------------------------|
|  QUICK RESUME                                                   |
|  +---------------------------------------+  +----------------+  |
|  |           DUNE: PART TWO              |  | CURRENTLY ROOM |  |
|  |  [Resume - 1h 42m] [Watch Alone]      |  | Sarah's Room   |  |
|  |  ===================o                 |  | [Join Room]    |  |
|  +---------------------------------------+  +----------------+  |
|                                                                 |
|  RECENTLY ADDED                                                 |
|  +---------+   +---------+   +---------+   +---------+          |
|  | Poster  |   | Poster  |   | Poster  |   | Poster  |          |
|  | 2:3     |   | 2:3     |   | 2:3     |   | 2:3     |          |
|  +---------+   +---------+   +---------+   +---------+          |
|                                                                 |
|  RECENTLY SHARED COLLECTIONS                                    |
|  [Sci-Fi Classics]   [Studio Ghibli Coziness]  [Action Nights]  |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `MainNavigationRail`: Top global header (sticky, changes opacity on scroll).
  - `BentoSection`: Includes the `QuickResumeHero` (span-2) and `ActiveLobbyRooms` (span-1).
  - `PosterRow`: Standard horizonal list wrapper with native smooth snap-scroll (`snap-x snap-mandatory`).
  - `FooterBlock`: Minimal platform info.
- **Spacing**:
  - Top header height: `64px`.
  - Margin between Bento block and the first poster row: `space-12` (48px).
  - Gaps between posters: `space-4` (16px).
- **Interactions**:
  - Hovering over "Dune: Part Two" plays a silent loop video preview inside the banner background after a `500ms` hover delay.
- **Empty States**:
  - If no movies exist in libraries, the Bento area displays an elegant illustrative outline of an empty projector with a button: "Upload your first movie".
- **Responsive Adaptations**:
  - *Tablet*: Bento collapses into a stacked list. Swipe actions are enabled on poster rows.
  - *Large TV*: Full horizontal navigation, focus highlights expand cards by 1.1x with golden border lighting.

---

### PAGE 7: LIBRARY SCREEN
- **Purpose**: The primary exploratory view to search, sort, filter, and inspect files.
- **Layout**: Sidebar control panel on the left (collapsible), massive grid of 2:3 posters on the right.

#### Wireframe
```
+-----------------------------------------------------------------+
| [Logo] Library  Collections  Friends  Uploads    [Ryan's Avatar] |
|-----------------------------------------------------------------|
|  LIBRARY                                 [ Grid / List ] [Sort] |
|  +-------------+  +-------------------------------------------+ |
|  | FILTERS     |  | +---------+   +---------+   +---------+   | |
|  |             |  | | Poster  |   | Poster  |   | Poster  |   | |
|  | Genre       |  | | 2:3     |   | 2:3     |   | 2:3     |   | |
|  | Resolution  |  | +---------+   |         |   |         |   | |
|  | Year        |  |               +---------+   +---------+   | |
|  | Owner       |  | +---------+   +---------+   +---------+   | |
|  |             |  | | Poster  |   | Poster  |   | Poster  |   | |
|  +-------------+  +-------------------------------------------+ |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `LibraryPageLayout` -> `CollapsibleSidebarFilters` \| `PrimaryMediaContainer` -> `ToolbarHeader` \| `PosterGrid`.
- **Interactions**:
  - **Context Menu (Right-Click)**: Right-clicking any poster triggers a custom menu to "Watch Room", "Add to Collection", "Download Metadata", or "Delete File" (if Level 2 owner).
  - **Multi-Selection Mode**: Holding `CMD` or `CTRL` allows selecting multiple posters to batch-add them to a collection. The footer dynamically reveals a floating control bar with batch actions.
- **Empty State**:
  - "No movies match your selected filters." Shows a clean text label with a single button to "Clear all filters".
- **Responsive Adaptations**:
  - *Mobile*: Left filter panel slides up from the bottom as an overlay sheet, triggered by a floating "Filter" action button. Grid changes to 2 columns.

---

### PAGE 8: COLLECTIONS PAGE
- **Purpose**: View curated collections created by owners or shared friends.
- **Layout**: Header with high-end cinematic banner backdrop, curated description, and a grid layout containing the movies.

#### Wireframe
```
+-----------------------------------------------------------------+
| [Back to Library]                                               |
|  +-----------------------------------------------------------+  |
|  |  STUDIO GHIBLI CLASSICS (Curated by Sarah)               |  |
|  |  "Beautiful animated gems from the historic studio."      |  |
|  |  12 Movies · 24h Total · 4 Shared Friends                 |  |
|  +-----------------------------------------------------------+  |
|                                                                 |
|  +---------+   +---------+   +---------+   +---------+          |
|  | Poster  |   | Poster  |   | Poster  |   | Poster  |          |
|  +---------+   +---------+   +---------+   +---------+          |
+-----------------------------------------------------------------+
```

- **Interactions**:
  - Drag-and-drop sorting: If you are the owner, dragging a poster allows re-arranging the custom sequence of the collection. Items transition using `motion` layout tags.

---

### PAGE 9: MOVIE DETAILS PAGE
- **Purpose**: Present high-end metadata, select subtitle/audio parameters, share permissions, and launch Watch Rooms.
- **Layout**: Immersive horizontal split. The left features a massive 2:3 vertical poster card, while the right displays a large cinematic horizontal backdrop with typography overlays and action panels.

#### Wireframe
```
+-----------------------------------------------------------------+
| [Back to Library]                                               |
|                                                                 |
|  +---------+   DUNE: PART TWO (2024)                            |
|  |         |   Sci-Fi · Action · 2h 46m · 4K UHD                |
|  | Poster  |                                                    |
|  | 2:3     |   Paul Atreides unites with the Fremen to seek     |
|  | Aspect  |   revenge against the conspirators...              |
|  | Ratio   |                                                    |
|  |         |   [ Host Watch Room ]  [ Watch Alone ]  [ Share ]  |
|  +---------+                                                    |
|                Audio: English (Atmos 5.1), Japanese             |
|                Subtitles: English, Spanish, Japanese            |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `CinematicBackdropOverlay`: Generates a dark overlay matching the artwork color profile.
  - `PosterFrame`: Enclosed with a custom 1px thick copper border.
  - `MetadataPanel`: Title, tags, genre chips, and description blocks.
  - `ActionRow`: Unified control buttons.
  - `StreamConfigAccordion`: Settings for audio, quality, and subtitle files.
- **Interactions**:
  - Hovering over the "Host Watch Room" button displays a tiny circular avatar stack indicating which active friends are currently available to join.
- **Accessibility**:
  - Screen readers are provided with full summary descriptions of the movie metadata structure. Keyboard focus moves cleanly through core actions.

---

### PAGE 10: WATCH ROOM (THE FLAGSHIP EXPERIENCE)
- **Purpose**: The core synchronized playback environment. It balances high-end video playback with non-intrusive interactive widgets.
- **Layout**: Full-screen canvas. Controls and chat are absolute overlays that automatically fade out completely during playback to let the movie take center stage.

#### Wireframe (Active Controls Overlay)
```
+-----------------------------------------------------------------+
| [Leave Room]     DUNE: PART TWO · ROOM LOBBY (4 Active)     [Settings] |
|                                                                 |
|                                                                 |
|                                                      +--------+ |
|                                                      | Chat   | |
|                       [ PLAYING ]                    |        | |
|                                                      | Sarah: | |
|                                                      | Cool!  | |
|                                                      |        | |
|                                                      | [____] | |
|                                                      +--------+ |
| [Play] [Jump Timestamp]                                         |
| ===o==========================================================  |
| 42:15 / 2:46:00    [HD] [Subtitles: Eng] [Audio: Atmos] [Mute]  |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `VideoPlayerContainer`: The HTML5 player rendering direct Backblaze stream arrays.
  - `OverlayControllerWrapper`: Fullscreen layout matching absolute positions.
  - `TopActionBar`: Leave button, title metadata, settings panels.
  - `FloatingChatSidebar`: Compact glassmorphism panel on the right (collapsible).
  - `BottomPlaybackControls`: Progress bar, seek controls, audio/subtitle popovers.
  - `ActiveParticipantDock`: Floating avatar strip at the top.
- **Spacing**:
  - Chat Sidebar width: `320px` (or completely collapsible).
  - Bottom control bar container: Positioned `24px` from bottom edge, with `16px` padding inside.
- **The "Immersive" Invisible Mode**:
  - **Behavior**: If the mouse remains stationary for `3.5 seconds`, all overlays (Top action bar, bottom controls, chat sidebar, and cursor) fade out completely to opacity 0 using a smooth `500ms` transition.
  - **Wake Event**: Any mouse movement or keypress immediately brings back all controls with high opacity 1.
- **Sync Visual Indicators**:
  - If a user pauses, a central overlay card fades in showing: `"Sarah paused the room"`.
  - When resumed: A subtle icon scale-out overlay pops up at the screen center for `800ms`.
- **Responsive Adaptations**:
  - *Mobile / Portrait*: The player locks strictly to landscape layout. The chat overlay changes to a transparent, bottom-third scroll sheet with tiny icons to preserve screen real estate.
  - *Large TV*: Fullscreen video, controls accessible only via keyboard/remote tracking. Displays massive typography for readability at distance.

---

### PAGE 11: FRIENDS PAGE
- **Purpose**: Minimal list of trusted companions with whom you share libraries. No tracking.
- **Layout**: Balanced, high-end editorial listing of cards.

#### Wireframe
```
+-----------------------------------------------------------------+
|  FRIENDS                                         [ Add Friend ] |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  | [Avatar]  Sarah Jenkins (Owner of Ghibli Collection)      |  |
|  |           Sharing: 3 Collections · 14 Movies              |  |
|  |           [ Manage Access ] [ Invite to Room ] [ Remove ] |  |
|  +-----------------------------------------------------------+  |
|  +-----------------------------------------------------------+  |
|  | [Avatar]  David Miller                                    |  |
|  |           Sharing: 1 Library                              |  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

- **Interactions**:
  - Clicking "Manage Access" slides open an elegant right-hand sheet displaying exact collection-by-collection sharing toggles.

---

### PAGE 12: INVITATIONS INBOX
- **Purpose**: Manage incoming and outgoing watch invitations.
- **Layout**: Centered dual-tab pane (1: Received, 2: Sent).

#### Wireframe
```
+-----------------------------------------------------------------+
|  INVITATIONS                                                    |
|  [ Received (2) ]   [ Sent History ]                            |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  | Sarah Jenkins invited you to watch DUNE: PART TWO         |  |
|  | Tonight at 8:00 PM · Scheduled Room                       |  |
|  | [ Accept Room ]   [ Decline ]                             |  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

- **Animations**:
  - Accepting an invitation plays a beautiful ribbon unfold animation, seamlessly shifting the item into the "Active Quick Resume" row of the Home Screen.

---

### PAGE 13: UPLOAD MANAGER
- **Purpose**: High-end desktop-grade manager for uploading video files, processing subtitles, and viewing encoding tasks.
- **Layout**: Two-column layout. The left features a massive drag-and-drop zone, while the right displays the active processing queue.

#### Wireframe
```
+-----------------------------------------------------------------+
|  UPLOAD MANAGER                                                 |
|  +-------------------------+  +-------------------------------+ |
|  |                         |  | ACTIVE QUEUE (2 Files)        | |
|  |   DRAG & DROP VIDEO     |  | Dune_Part_2_2160p.mkv         | |
|  |   OR CLICK TO BROWSE    |  | [===========82%] Encoding...  | |
|  |                         |  |                               | |
|  |                         |  | Interstellar_1080p.mp4        | |
|  |                         |  | [== 24% ] Thumbnail Gen...    | |
|  +-------------------------+  +-------------------------------+ |
+-----------------------------------------------------------------+
```

- **Component Hierarchy**:
  - `DropZoneContainer`: High-end dotted active state.
  - `QueueWrapper`: Stack of file process components.
  - `ProgressBar`: Uses the success (emerald) color for completion states.
  - `LogConsolePanel`: Small monospace text console that reveals real-time command outputs from transcoding.
- **Interactions**:
  - Dropping a video file triggers a fluid wave transition across the drop container, transforming it into a live upload tile.
- **Error States**:
  - Network disconnection pauses the queue gracefully. Tiles display: `"Upload paused - Retrying in 10s"`, accompanied by an amber alert state.

---

### PAGE 14: STORAGE SETTINGS
- **Purpose**: Link Backblaze B2, inspect buckets, and view bandwidth parameters.
- **Layout**: Clean dashboard panels structured like high-end developer dashboards, but with a refined cinematic look.

#### Wireframe
```
+-----------------------------------------------------------------+
|  STORAGE CONFIGURATION                                          |
|                                                                 |
|  Backblaze B2 Bucket Connection: CONNECTED (Active)             |
|  Bucket Name: cinema-bucket-01                                  |
|                                                                 |
|  STORAGE CAP %                                                  |
|  [=========================================---------] 820GB/1TB |
|                                                                 |
|  [ Test Connection ]  [ Rotate API Credentials ]                |
+-----------------------------------------------------------------+
```

- **Interactions**:
  - Clicking "Test Connection" shows a spinning loaders widget, followed by an elegant checkmark badge that scales up into view.

---

### PAGE 15: ACCOUNT & PLAYBACK SETTINGS
- **Purpose**: Configure profile information, system preferences, and playback defaults.
- **Layout**: Left-hand structural tabs with right-hand parameter option cards.

#### Wireframe
```
+-----------------------------------------------------------------+
|  ACCOUNT SETTINGS                                               |
|  +--------------+  +------------------------------------------+ |
|  | Profile      |  | DEFAULT PLAYBACK PREFERENCES             | |
|  | Playback     |  |                                          | |
|  | Appearance   |  | Stream Quality:   [ 1080p (Default)   v ]| |
|  | Privacy      |  | Audio Language:   [ English           v ]| |
|  | Notifications|  | Subtitles:        [ Always Enabled    v ]| |
|  +--------------+  +------------------------------------------+ |
+-----------------------------------------------------------------+
```

- **Accessibility**:
  - High contrast indicators let keyboard users quickly jump between the vertical settings tabs using simple up/down arrow keys.

---

### PAGE 16: ADMIN DASHBOARD
- **Purpose**: Level 2 Owners inspect system metrics and manage access credentials.
- **Layout**: Compact telemetry cards styled purely with beautiful typography and clean lines—no unnecessary glowing charts.

#### Wireframe
```
+-----------------------------------------------------------------+
|  ADMIN DASHBOARD                                                |
|                                                                 |
|  ACTIVE USERS: 4    TOTAL MOVIES: 142    STORAGE BANDWIDTH: 4.2TB|
|                                                                 |
|  +----------------------------------+  +----------------------+ |
|  | COMPANIONS LIST                  |  | SYSTEM HEALTH LOGS   | |
|  | Sarah Jenkins [Host Allowed]     |  | [12:14] Socket Sync  | |
|  | David Miller  [Watch Only]       |  | [12:02] B2 Hook Up   | |
|  +----------------------------------+  +----------------------+ |
+-----------------------------------------------------------------+
```

---

## SECTION 7: DETAILED COMPONENT INTERACTION TOKENS

These micro-interaction specifications ensure a highly polished tactile feel across all pages.

### 7.1 Hover Transitions
- **Movie Posters**:
  - `duration-300 ease-out`
  - Scale expands from `scale-100` to `scale-102`.
  - Border transitions smoothly from neutral-800 to color-brand (amber).
  - Ambient shadow activates (`shadow-[0_4px_20px_rgba(245,158,11,0.15)]`).
- **Interactive Buttons**:
  - `duration-150 ease-in-out`
  - Dark-mode primary button background shifts to 90% opacity white, text remains deep charcoal.

### 7.2 Focus Rings
- All interactive input elements (Text fields, Checkboxes, Buttons) must utilize a unified focus visual ring.
  - CSS style: `focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950`.
  - Ensures a crisp 2px offset space that is clearly visible for keyboard navigation.

### 7.3 Loading Skeletons
- Standard rectangular cards must load with a slow pulsing animation (`animate-pulse`).
- Background color for skeletons: neutral-900 (Dark) \| stone-100 (Light).
- Edge shape: Uses matching card corners (`radius-lg`).

---

## SECTION 8: FIGMA ARTBOARD & GRID RECOMMENDATIONS

To ensure visual consistency during implementation, use these precise specifications for design layouts.

1. **Artboard Sizing**:
   - Desktop layout: `1440px` width by `900px` height.
   - Tablet layout: `768px` width by `1024px` height.
   - Mobile layout: `375px` width by `812px` height.
   - Large TV layout: `1920px` width by `1080px` height.
2. **Layout Grid Configuration (Desktop)**:
   - Type: Columns.
   - Count: `12 Columns`.
   - Width: `Auto`.
   - Gutter: `24px`.
   - Margin: `40px` (or `64px` for edge-to-edge screens).
3. **Typography Layers**:
   - Ensure all typography components use explicit vertical heights that are multiples of 4px.

---

## SECTION 9: STEP-BY-STEP DEVELOPMENT IMPLEMENTATION ROADMAP

Follow this structured development path to build the platform successfully:

### PHASE 1: CORE TOKENS & DESIGN SYSTEM INGESTION
- [ ] Configure Tailwind CSS base tokens inside the global stylesheet.
- [ ] Implement Google Fonts hook to load `Outfit`, `Inter`, and `JetBrains Mono` asynchronously.
- [ ] Build the Core Theme provider supporting both Cinematic Carbon (Dark) and Gallery Alabaster (Light).
- [ ] Implement reusable basic interactive elements: Buttons, Inputs, Checkboxes, Dialogs, and Tooltips.

### PHASE 2: GLOBAL NAVIGATION & LAYOUT TEMPLATES
- [ ] Build the main responsive layouts, including sidebars, top headers, and mobile navigation sheets.
- [ ] Implement the beautiful snap-scroll poster rows.
- [ ] Construct the dynamic Bento box structures on the Home page.

### PHASE 3: WATCH ROOM PLAYER & OVERLAY ENGINE
- [ ] Implement the core HTML5 video player element connected to simulated high-fidelity streams.
- [ ] Build the automated overlay controller (auto-fading cursor and controls after 3.5 seconds of inactivity).
- [ ] Implement the sliding side panels for Chat, Subtitles, and Settings.
- [ ] Create the synchronization buffer state layouts (Sarah buffering, Master coordinate jumping indicator).

### PHASE 4: EXPLORATORY MEDIA VIEWS
- [ ] Build the Library grid containing responsive 2:3 cinematic poster card containers.
- [ ] Build Collapsible Filters, Search, and Multi-Selection modes.
- [ ] Create the Collections grid and layout with support for custom drag-and-drop sorting.

### PHASE 5: ACCOUNT & BACKBONE SETTINGS
- [ ] Connect the dynamic multi-step Upload Manager with custom encoding status bars.
- [ ] Build Account settings dashboards, Friends list sheets, and Admin metrics telemetry panels.
