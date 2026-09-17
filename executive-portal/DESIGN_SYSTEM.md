# Executive Portal Visual Design System

## Direction

The Executive Panel should feel like a professional operations console: dark, precise, compact, confident, and easy to scan.

The visual reference is the supplied Supabase dashboard screenshot: dense information layout, dark surfaces, thin borders, restrained glow, clear hierarchy, and strong use of whitespace. The Executive Panel adds more of the fest's green brand color while keeping the interface mature rather than flashy.

## Core rules

- Use sharp rectangular geometry. No rounded cards, pills, buttons, inputs, modals, or navigation containers.
- Prefer 0px border radius throughout the application.
- Use rich black for the application background and major chrome.
- Use rich gray for panels, borders, secondary controls, and data surfaces.
- Use rich green as the primary accent for active navigation, primary actions, success states, focus states, and key data points.
- Keep green purposeful: it should guide attention, not flood the interface.
- Use thin 1px borders and subtle architectural shadows instead of large floating cards.
- Prefer dense, readable tables and information blocks over oversized marketing-style cards.
- Use monospace typography for small metadata, statuses, IDs, timestamps, and operational labels where it improves scanning.
- Use restrained motion: quick hover/focus transitions, no decorative animations.
- The design must remain usable on laptop, tablet, and mobile screens.

## Palette

### Black

- App background: `#070909`
- Sidebar/background chrome: `#0B0D0D`
- Panel: `#101313`
- Raised surface: `#151918`

### Gray

- Surface: `#1B201E`
- Border: `#2A322F`
- Strong border: `#3B4541`
- Muted text: `#7C8782`
- Secondary text: `#A6B0AB`
- Primary text: `#F7FAF8`

### Green

- Deep green: `#062B1D`
- Dark green: `#0A3D2B`
- Primary green: `#12724C`
- Action green: `#15915D`
- Highlight green: `#1BBD78`
- Soft green text: `#67D9A6`

### Status

- Success: `#29C27F`
- Warning: `#D6A63A`
- Danger: `#D95D5D`
- Info: `#67A8C9`

## Component language

Buttons should be compact and rectangular.

Panels should be rectangular blocks separated by borders.

Tables should be the primary data presentation for registrations, payments, staff, and assignments.

Badges should be rectangular and small, using color only when the status needs immediate attention.

Modals should use a solid panel with a strong border and minimal shadow.

Navigation should use a clear active state with a green edge, background, or text treatment.

## Page composition

Every major page should follow this visual hierarchy:

1. Page title and short context
2. Primary actions
3. Key metrics or filters
4. Main data surface
5. Secondary information / activity / notes

The dashboard may use compact metric blocks, but the design should always prioritize operational information over decoration.

## Accessibility

- Maintain strong text/background contrast.
- Do not communicate status using color alone.
- Provide visible keyboard focus states.
- Keep interactive targets large enough for touch use.
- Avoid relying on hover for essential information.
