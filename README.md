# carousel-agent

**Turn a brief into a polished social carousel—without hand-building slides.**

Carousel Agent is an AI-agent skill that creates editable HTML/CSS slides, renders them to PNG or MP4, then visually inspects the output for layout problems. Refine the result in conversation: change a headline, adjust a layout, or carry artwork across slides.

## Install

```bash
npx skills add adetxt/carousel-agent
```

Update an existing installation with `npx skills update carousel-agent` (`-g` for a global install).

**Requirements:** Node.js 22+ and Chrome, Chromium, Edge, or Brave. Animated exports also need ffmpeg. The renderer has no npm dependencies.

## Try it

> Use carousel-agent to make a 6-slide LinkedIn carousel introducing our new developer tool. Write for engineering leads, use a 4:5 portrait format, and end with an invitation to try the demo. Reuse our existing brand kit.

Then refine it naturally:

> Make slide 1 more direct. Let the portrait continue into slide 2. Keep the colors and typography.

The agent creates the files, renders the slides, and checks for clipped text, missing images, and spacing issues. Share a logo, colors, or brand kit for branded content, or ask for a generic design.

## Examples

### Seamless fashion editorial

Four editorial slides with photography and graphic elements that continue across slide boundaries. Each panel exports as a 1080 × 1350 PNG.

[![Four seamless fashion slides with photography and graphic elements continuing across the edges](examples/seamless-editorial/overview.png)](examples/seamless-editorial/preview.html)

[Open the swipeable preview](examples/seamless-editorial/preview.html).

### Product launch carousel

A six-slide product launch example. The “40% faster setup” figure on slide 4 is illustrative copy, not a measured benchmark.

[![Six product launch slides arranged in two rows](examples/carousel-agent-launch/overview.png)](examples/carousel-agent-launch/overview.png)

## What you can make

- Launch posts, explainers, tutorials, and multi-image posts for Instagram, LinkedIn, Threads, TikTok, or X.
- Seamless carousels with photography, shapes, and artwork continuing across slide edges.
- Covers, stat slides, flow diagrams, quotes, media slides, and closing calls to action.
- Static PNGs and animated MP4 slideshows.

See [the skill instructions](SKILL.md) for supported workflows and details.
