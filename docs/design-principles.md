# Shortlist Design Principles

Guiding design infrastructure for Shortlist. Distilled from [Emil Kowalski’s skills](https://github.com/emilkowalski/skills) (Vercel / Linear craft sensibility) and adapted to this repo’s stack: Next.js App Router, Tailwind v4, Radix / shadcn, `@loople/tokens`, and Sonner.

**Upstream source:** [emilkowalski/skills](https://github.com/emilkowalski/skills) · [skills.sh](https://skills.sh/emilkowalski/skills)  
**When in doubt:** prefer taste, restraint, and invisible correctness over novelty.

---

## 1. North star

### Taste is trained, not innate

Good taste is the ability to recognize what elevates. Study why the best interfaces feel right. Reverse-engineer motion. Inspect interactions. Don’t stop at “it works.”

### Unseen details compound

Most details users never consciously notice — and that is the goal. When something behaves exactly as expected, they move on without a second thought. Aggregate invisible correctness is what people call “polish.”

> “All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune.” — Paul Graham

### Beauty is leverage

People choose tools on overall experience, not feature checklists. Good defaults and purposeful motion are product differentiators. Use them deliberately; never decorate for its own sake.

### Personality of Shortlist

Shortlist is a **professional pipeline tool** for creative studios: crisp, trustworthy, calm. Motion should feel **fast and decisive**, not playful or bouncy. Reserve delight for rare moments (first digest success, onboarding completion) — never for daily chrome.

---

## 2. Stack & ownership (do not reinvent)

| Concern | Source of truth |
| --- | --- |
| Color, type, radius, shadow, control density | **AlignUI only** — `app/globals.css` `@theme` |
| Controls | `components/alignui/*` (Button, Input patterns, Badge, Stepper, StatusBadge) |
| Feature screens | `components/shortlist/*` styled with AlignUI utilities (`text-label-sm`, `text-paragraph-xs`, `bg-bg-white-0`, `ring-stroke-soft-200`, …) |
| Toasts | Sonner, colored with AlignUI semantic tokens |

**Rules**

- Do not introduce a second palette, type scale, or button. No `@loople/tokens` in product UI.
- Emil principles still gate motion (§3): frequency, purpose, `transform`/`opacity`, ≤300ms, `fine-hover`, reduced-motion.

---

## 3. Motion decision framework

Answer in order. Stopping early is a success.

### 3.1 Should this animate at all?

| Frequency | Decision |
| --- | --- |
| 100+ times/day (keyboard shortcuts, command palette) | **No animation. Ever.** |
| Tens of times/day (hover, list nav) | Near-imperceptible or none |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare / first-time (onboarding, celebration) | Delight budget lives here |

**Never animate keyboard-initiated actions.** Animation makes high-frequency actions feel slow and disconnected.

### 3.2 What is the purpose?

Name one before writing code:

- **Feedback** — interface heard the user (press scale)
- **Spatial consistency** — enter/exit same path (toast, sheet)
- **State indication** — make a change legible
- **Preventing a jarring change** — content would otherwise teleport
- **Explanation** — marketing / onboarding only
- **Delight** — rare / first-time only

If the purpose is “it looks cool” on a frequent surface → don’t animate.

### 3.3 Tool — cheapest that works

| Need | Tool |
| --- | --- |
| Hover, press, color, class-driven toggle | CSS transition |
| Mount entry without JS state | CSS `@starting-style` |
| Predetermined motion while page is busy | CSS animation (off main thread) |
| Programmatic CSS performance | WAAPI (`element.animate()`) |
| Springs, layout/exit, gesture-driven values | Motion (`motion.dev` / Framer Motion) |

Do not install a motion library for a fade.

### 3.4 Properties

- Animate **`transform` and `opacity` only** (GPU-friendly). Avoid `width` / `height` / `margin` / `padding` / `top` / `left` except accordion height when there is no transform equivalent.
- **`clip-path`** is the sanctioned fourth property (reveals, tab color wipes, hold-to-confirm).
- **Never `scale(0)`.** Enter from `scale(0.9–0.97)` + `opacity: 0`.
- Popovers / menus / tooltips: **`transform-origin` at the trigger**. Modals stay centered.
- Prefer **percentage `translate()`** (`translateY(100%)`) over hardcoded pixels.
- In Motion: prefer full `transform: "translateX(…)"` over `x` / `y` shorthands under load (hardware acceleration).
- Never drive child transforms from a CSS variable on a busy parent — set `transform` on the element.

### 3.5 Easing & duration

**Easing**

| Situation | Easing |
| --- | --- |
| Entering or exiting | ease-out |
| Moving / morphing on screen | ease-in-out |
| Hover / color | ease |
| Constant motion (marquee, progress) | linear |
| Default | ease-out |

**Never `ease-in` on UI** — it delays the moment the user is watching.

Prefer strong custom curves (or Loople motion tokens) over weak built-ins:

```css
/* Emil reference curves — prefer mapping onto @loople/tokens when adding CSS vars */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**Duration (UI under 300ms)**

| Element | Duration |
| --- | --- |
| Button press | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing / explanatory | May be longer |

### 3.6 Shortlist motion tokens (`@loople/tokens`)

Use these instead of inventing new numbers:

| Token | Value | Use |
| --- | --- | --- |
| `motion.duration.fast` | 150ms | Hover, press, small toggles |
| `motion.duration.base` | 200ms | Popovers, menus, default state change |
| `motion.duration.slow` | 300ms | Sheets, dialogs, page enter (ceiling for frequent UI) |
| `motion.easing.emphasized` | `[0.16, 1, 0.3, 1]` | Strong ease-out for UI |
| `motion.easing.standard` | `[0.2, 0, 0, 1]` | Standard transitions |
| `motion.easing.inOut` | `[0.42, 0, 0.58, 1]` | Symmetric loops |
| `motion.press.scale` | `0.99` | Pressables (subtle; Emil’s generic default is ~0.97 — stay with token for brand cohesion) |
| `motion.staggerMs` | `40` | Sibling stagger (keep 30–80ms) |

### 3.7 Springs

Use springs for drag/momentum, interruptible gestures, and “alive” elements — not for routine fades.

- Default UI: critically damped / low bounce (`bounce: 0`).
- Slight bounce (`0.1–0.3`) only when a flick/throw preceded it.
- Hand off release velocity into the spring so drag → settle has no seam.
- Rubber-band past boundaries; never hard-stop.

### 3.8 Interruption & exit

- Prefer **CSS transitions** over keyframes for rapidly triggered UI (toasts, toggles) — transitions retarget; keyframes restart from zero.
- Exit the way it entered (symmetric paths).
- Asymmetric timing when the user is deciding: deliberate press can be slow; release is always snappy (~200ms ease-out).
- Never lock input during a transition. Gesture-driven UI must be grab-and-reverse mid-flight (springs).

### 3.9 Stagger

Stagger list/card entrances by 30–80ms (`motion.staggerMs`). Never block interaction while stagger plays.

---

## 4. Component craft

### Buttons & pressables

- Instant feedback on **pointer-down / `:active`**, not only on click.
- Scale subtly (`motion.press.scale` or ~0.97).
- Gate hover styles: `@media (hover: hover) and (pointer: fine)`.

### Popovers, menus, tooltips

- Origin-aware scale from trigger.
- Tooltips: delay first open; subsequent adjacent tooltips open instantly (skip delay + animation).

### Surfaces & depth

- Prefer soft elevation / translucent materials over harsh solid borders where hierarchy needs depth.
- Bigger surfaces → stronger blur + deeper shadow; never stack light glass on light glass.
- Dim + scrim for blocking modals; translucency without scrim for parallel panels.

### Lists entering/exiting

Opacity and height must feel cohesive — tune by feel; review next day and in slow motion.

### Cohesion

Easing, duration, naming, and visual design must share one personality. Shortlist = crisp professional dashboard, not playful marketing chrome.

---

## 5. Accessibility & reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Keep opacity/color comprehension aids; drop positional/transform motion */
}

@media (prefers-reduced-transparency: reduce) {
  /* Raise surface opacity; drop backdrop-filter */
}

@media (prefers-contrast: more) {
  /* Near-solid backgrounds + clear borders */
}
```

- Reduced motion ≠ zero feedback. Prefer short cross-fades over slides/springs.
- Avoid full-viewport looping backgrounds and near-0.2Hz oscillations.
- Keyboard focus rings always visible; Radix for complex widgets.

---

## 6. Mobile-native web (required for Shortlist)

Shortlist onboarding and digest flows will be used on phones. Ship these platform fixes with UI work:

| Problem | Fix |
| --- | --- |
| Sticky hover after tap | `@media (hover: hover) and (pointer: fine)` |
| Gray/blue tap flash | `-webkit-tap-highlight-color: transparent` + real `:active` feedback |
| Wrong full-height layout | `100dvh` (app shell) / `100svh` (heroes) — not `100vh` |
| Input zooms page | Inputs ≥ **16px** on coarse pointers — **do not** disable zoom |
| Laggy tap | Feedback on pointer-down + `touch-action: manipulation` |
| Pull-to-refresh hijacks | `overscroll-behavior` where appropriate |
| Notch / home indicator | `viewport-fit=cover` + `env(safe-area-inset-*)` |
| Long-press selects controls | `user-select: none` on buttons/controls only |
| Carousel fights scroll | Correct `touch-action` on gesture surface |

**Hard rule:** never `user-scalable=no` / `maximum-scale=1` as a “zoom fix.” Fix input font size instead. Inputs use `text-body-reading` (16px) by default and `md:text-body` (14px) from the `md` breakpoint up.

Test on **real hardware**. Chrome device toolbar does not catch sticky hover, tap delay, rubber-banding, or safe areas.

---

## 7. Apple-derived fluid interface principles

Use when building sheets, drawers, drag, or swipe:

1. **Kill latency** — respond on pointer-down; audit artificial delays.
2. **1:1 direct manipulation** — content sticks to finger; respect grab offset; `setPointerCapture`.
3. **Interruptibility** — animate from the live presentation value; never wait for a scripted animation to finish.
4. **Behavior over animation** — springs for anything the user can grab.
5. **Velocity handoff** — release velocity becomes spring initial velocity.
6. **Momentum projection** — flick lands where the gesture is *going*, not where it stopped.
7. **Spatial consistency** — same path in and out; origin at source.
8. **Rubber-banding** — progressive resistance at edges.
9. **Materials encode hierarchy** — translucency + depth without stealing focus.

Apple’s eight foundations (purpose, agency, responsibility, familiarity, flexibility, simplicity, craft, delight) apply to product decisions as much as pixels. Delight is the result of the other seven — not confetti.

---

## 8. Performance

| Problem | Solution |
| --- | --- |
| Stuttering animation | Animate `transform` / `opacity`, not layout props |
| Long lists | Virtualize (Virtuoso) before pagination hacks |
| Blur cost | Keep animated `blur()` under ~20px |
| Motion `x`/`y` drops frames | Full `transform` string |
| `transition: all` | List exact properties |
| React re-render every frame | Write to `ref` / style, not React state |
| 1px jump at motion start | `will-change: transform` only when observed |

CSS animations stay smooth under load; rAF-based JS motion can drop frames while the page is busy. Prefer CSS for predetermined motion.

---

## 9. Break the UI (worst-case data)

Demo data is chosen to look good. Before calling a screen done, stress it:

- Long names, long emails/URLs, one-letter names, missing optionals
- Counts of `0`, `1` (pluralization), and large numbers with separators
- Empty lists, single-item lists, huge lists
- Non-Latin text, emoji, extreme timestamps
- 320px width, 200% zoom, dark mode

Common CSS fixes: `min-width: 0` on text columns, `flex-shrink: 0` on avatars/actions, `overflow-wrap: anywhere` on emails/URLs, truncate vs wrap as an explicit design choice.

Report breaks before fixing when auditing. Prefer plausible / schema-backed values over nonsense strings.

---

## 10. Library picks (aligned with Emil + this repo)

Prefer already-installed packages. Do not hand-roll these:

| Task | Library (Shortlist) |
| --- | --- |
| Primitives (tooltip, progress, collapsible, radio, slot…) | `radix-ui` + `components/ui` |
| Toasts | **Sonner** (owned wrapper in `components/ui/sonner.tsx`) |
| Class strings / variants | `clsx`, `cva`, `tailwind-merge` |
| Theme | `next-themes` |
| General motion (if needed) | Motion / Framer Motion — CSS first |
| Virtualization (when needed) | Virtuoso |
| Drag and drop (when needed) | dnd kit |
| Command palette / charts / drawers / OTP | Add only when a screen needs them (do not pre-install) |

### Sonner rules (this project)

- One `<Toaster />` in root layout — never per-page or conditional.
- Call `toast()` from client handlers; server actions return results, client toasts.
- Persistent product status → `StatusBanner`; load failures → `ErrorState`; transient confirmations → Sonner.
- Theme from `next-themes`; colors already mapped to Loople status tokens in `components/ui/sonner.tsx`.

---

## 11. Typography

- Tracking is **size-specific**: tighten large display (`letter-spacing` slightly negative); body near `0`.
- Leading: tight on large headings, looser on body.
- Hierarchy from **weight + size + leading**, not size alone.
- Prefer system / Geist already in layout; don’t introduce random display fonts.
- Scale spacing with text (`rem`/`em`) so larger text sizes don’t break layout.

---

## 12. Review checklist

When reviewing UI / motion, use a **Before | After | Why** table. Block on:

| Never | Instead |
| --- | --- |
| `transition: all` | Exact properties |
| `scale(0)` entrance | `scale(0.95)` + `opacity: 0` |
| `ease-in` on UI | ease-out / token curve |
| Animation on keyboard / 100+/day actions | No animation |
| UI duration > 300ms without reason | 150–250ms (or token) |
| Center origin on trigger-anchored popover | Origin at trigger |
| Keyframes on toasts / rapid toggles | CSS transitions |
| Animating layout props | `transform` / `opacity` |
| Ungated `:hover` motion | Hover media query |
| Missing reduced-motion path | Gentler variant |
| Everything appears at once | 30–80ms stagger |
| `maximum-scale=1` to stop input zoom | 16px inputs |
| Hand-rolled toast / focus trap | Sonner / Radix |

**Feel-check:** slow-mo 2–5× or DevTools Animations panel; frame-by-frame for multi-property sync; gestures on a real phone; re-review the next day.

---

## 13. How agents should use this doc

1. **Before adding motion** — run §3 gates; prefer no animation when frequency is high.
2. **Before adding a dependency** — check §10 and `package.json`; extend tokens, don’t fork.
3. **Before shipping a screen** — §6 mobile checklist + §9 worst-case data.
4. **When reviewing UI** — §12 table format; fix high-severity motion/a11y first.
5. **Prototype multiple variants** when exploring a new interaction — interactive demos beat static mockups; keep a switcher, then delete losers.

### Skill map (upstream)

| Need | Emil skill |
| --- | --- |
| Core philosophy + component polish | `emil-design-eng` |
| Build a new animation | `animate` |
| Critique motion in a diff | `review-animations` |
| Audit / prioritize motion debt | `improve-animations` |
| Find where motion helps (and doesn’t) | `find-animation-opportunities` |
| Fix jank | `animation-performance` |
| Describe motion precisely to an agent | `animation-vocabulary` |
| Sheets / springs / materials | `apple-design` |
| Phone feel | `mobile-native` |
| Stress-test data | `break-ui` |
| Choose a library | `pick-ui-library` |
| Toast work | `ask-sonner` |
| Explore variants | `prototype` |

Install locally if useful: `npx skills@latest add emilkowalski/skills`

---

## 14. Changelog

| Date | Note |
| --- | --- |
| 2026-10-24 | Initial principles doc from [emilkowalski/skills](https://github.com/emilkowalski/skills), mapped to Shortlist / Loople tokens. |
| 2026-10-24 | Restructure: URL routes, `components/shortlist`, slim UI kit, owned Toaster, viewport zoom fix. |
