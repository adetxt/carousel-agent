---
name: html-carousel
description: Use when asked to create a carousel, slide set, or multi-image social post (Instagram, LinkedIn, TikTok, X, Threads) as image or video files, to turn HTML/CSS slides into PNGs or MP4s, to animate an infographic or flow diagram slide, or to set up or reuse a branded carousel template or layout.
---

# HTML Carousel

## Overview

Design each carousel slide as an HTML/CSS element, then render every slide to its own PNG — or MP4 for animated slides — with a bundled script that drives a locally installed Chrome. The files are the deliverable; the HTML is the source you iterate on.

Brand and layouts live in a reusable **kit** shared by every carousel in the project, so each new carousel is just content.

Requires Node.js >= 22 and Chrome, Chromium, Edge, or Brave (or set `CHROME_PATH`). Video slides also need `ffmpeg` (or `FFMPEG_PATH`). No `npm install` is needed.

## Project layout

```
carousels/
  kit/                 # reusable: copied once, then edited for the brand
    theme.css          #   brand tokens + layout classes
    chrome.js          #   header, footer, page numbers (BRAND config at top)
    logo.svg           #   brand logo (placeholder until replaced)
  launch.html          # one file per carousel; links kit/theme.css and kit/chrome.js
  launch/              # rendered PNGs
```

`<skill-dir>` below is this skill's directory.

## Workflow

1. **Find the kit.** Look for an existing kit in the project (`carousels/kit/`, or any directory with `theme.css` + `chrome.js`). If one exists, reuse it unchanged unless the user asks for a change. If several exist (one per brand), ask which one.
2. **No kit? Create one.** Copy `<skill-dir>/assets/kit/` to `carousels/kit/` and apply the brand (see Branding).
3. **Write the carousel.** Copy `<skill-dir>/assets/example.html` to `carousels/<name>.html` and replace the slides. One `<section class="slide <layout>"><div class="content">…</div></section>` per image, in order. Write only content; header, footer and page numbers come from the kit.
4. **Render:**
   ```bash
   node <skill-dir>/scripts/render.mjs carousels/<name>.html --out carousels/<name>
   ```
   Output: `slide-01.png`, `slide-02.mp4`, … in slide order at the slide's CSS size. `--scale 2` for crisper text (2160×2700 for 4:5). `--help` for all options.
5. **Look at every output** (open/read the images; for videos, extract a few frames, e.g. `ffmpeg -ss 1.5 -i slide-02.mp4 -frames:v 1 check.png`, including the first and last). Fix any `WARNING:` line (overflow, image failed to load), clipped text, poor contrast, or uneven spacing, then re-render. Repeat until every slide is clean.
6. **Report** the output paths to the user.

## Layouts

Add one class next to `slide`. Content markup per layout:

| Class | Content |
|-------|---------|
| *(none)* | `h2` + `p` / `ul` |
| `cover` | `.kicker` + `h1` + `p` — first slide |
| `stat` | `.number` + `h2` + `p` |
| `flow` | `h2` + `.steps` > `.step` (`.num` + text) alternating with `.connector` — process / flow graphic |
| `quote` | `blockquote` + `cite` |
| `media` | `img.media` + `h2` + `p` |
| `cta` | `h2` + `p` + `span.button` — last slide |

**New or changed layout?** Add a `.slide.<name>` rule to `kit/theme.css` and use the class, so later carousels can reuse it. Never put layout CSS in a carousel's HTML file. A one-off tweak for a single slide may use an inline `style`.

## Video slides

Use for slides where motion explains something: a flow building step by step, a chart growing, an infographic revealing. Keep the rest as images.

- Add `data-duration="<seconds>"` to the slide; it renders to MP4 (H.264, 30fps, same size as the slide). `--fps` changes the frame rate.
- Animate with **GSAP** (load `https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js`), CSS `@keyframes`/transitions, or `requestAnimationFrame`. `setTimeout`/`setInterval` run on real time and will stutter or be missed — don't animate with them.
- One timeline per video slide, scoped to that slide's selectors. It starts at page load (t=0) and must finish before `data-duration`; leave ~1s holding the final state. `example.html` has a working GSAP flow animation.
- Slides without `data-duration` are captured at t=0, so never animate them — they'd show the starting (hidden) state.
- Instagram carousels accept mixed images and videos; LinkedIn document carousels are images only — tell the user if they target LinkedIn.

## Branding

| What | Where |
|------|-------|
| Logo, brand name, handle | `BRAND` at the top of `kit/chrome.js`; copy the user's logo (SVG/PNG) into `kit/` and set `logo` |
| Colors, font, radius, logo height | `:root` tokens in `kit/theme.css` |
| Slide size | `--w` / `--h` in `kit/theme.css` |

If the user wants branding but hasn't given a logo file, colors, or handle, ask before rendering. Never ship the placeholder `logo.svg`, `Brand Name`, or `@handle`. For a dark logo on a dark background (or vice versa), ask for the other variant rather than recoloring it.

## Slide contract

| Rule | Why |
|------|-----|
| Each slide is one element matching `.slide` (change with `--selector`) | One element = one image |
| Fixed `px` size on the slide; `overflow: hidden` | Image size equals slide size; overflow is detected and warned about |
| Sizes in `px`, not `vw`/`%` of body | Layout doesn't depend on the viewport |
| Fonts: system stack, Google Fonts `@import`/`<link>`, or local `@font-face` | Renderer waits for `document.fonts.ready` |
| Content must exist at load; animation only on `data-duration` slides | PNGs are captured right after load + fonts + image decode, at t=0 |

## Common sizes

| Platform | Size (px) | Ratio |
|----------|-----------|-------|
| Instagram / LinkedIn portrait (default) | 1080 × 1350 | 4:5 |
| Instagram / LinkedIn square | 1080 × 1080 | 1:1 |
| TikTok / Stories / Reels | 1080 × 1920 | 9:16 |
| X / landscape | 1200 × 675 | 16:9 |

## Design guidelines

- Slide 1 is the hook (`cover`); last slide is the call to action (`cta`).
- One idea per slide; body text ≥ 36px at 1080px wide so it reads on a phone.
- Keep ~80–100px safe padding; platform UI covers edges.

## Common mistakes

- **Text cut off** — the overflow warning fires; shorten copy or reduce font size, don't remove `overflow: hidden`.
- **`WARNING: image failed to load`** — wrong path. Images in a carousel are relative to its HTML file; `BRAND.logo` is relative to `chrome.js`.
- **Unstyled slides** — the `kit/theme.css` link path is wrong for where the HTML file lives.
- **Header/footer typed into slides** — duplicated by `chrome.js`; configure them in `BRAND` only.
- **"No elements match selector"** — slides don't use `class="slide"`; fix the markup or pass `--selector`.
- **"No Chrome/Chromium/Edge found"** — install one or `export CHROME_PATH=/path/to/chrome`.
- **"Video slides need ffmpeg"** — install ffmpeg or set `FFMPEG_PATH`; or drop `data-duration` to get a PNG.
- **Video slide blank or frozen** — animation driven by `setTimeout`, a timeline that starts after `data-duration`, or selectors matching another slide.
- **Delivering without looking** — always inspect the rendered PNGs before reporting done.
