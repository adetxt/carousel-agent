# html-carousel

Agent skill that builds social-media carousels from HTML/CSS and renders each slide to a PNG.

## Install

With the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add adetxt/html-carousel                     # this project
npx skills add adetxt/html-carousel -g                  # all projects
npx skills add adetxt/html-carousel --skill html-carousel -a claude-code
```

Requirements: Node.js >= 22 and Chrome, Chromium, Edge, or Brave (or `CHROME_PATH`); ffmpeg for video slides. No npm dependencies.

## Use

Ask your agent for a carousel, e.g. *"Make a 6-slide LinkedIn carousel about our Q3 launch."*
The agent writes the slides as HTML and renders them:

```bash
node skills/html-carousel/scripts/render.mjs carousel.html --out out --scale 2
# out/slide-01.png, out/slide-02.png, ...
```

## Layout

```
skills/html-carousel/
  SKILL.md              # instructions for the agent
  scripts/render.mjs    # HTML -> one PNG (or MP4 with data-duration) per .slide
  assets/kit/           # reusable brand kit, copied once into the user's project
    theme.css           #   brand tokens + layouts (cover, stat, flow, quote, media, cta)
    chrome.js           #   header, footer, page numbers
    logo.svg            #   placeholder logo
  assets/example.html   # starter carousel that uses the kit
```

In a project, the kit is copied once and every carousel reuses it:

```
carousels/
  kit/                  # edit once for the brand; new layouts go in theme.css
  launch.html           # <link href="kit/theme.css"> ... <script src="kit/chrome.js">
  launch/slide-01.png ...
```
