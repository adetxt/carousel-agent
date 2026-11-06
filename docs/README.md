# Landing page

Plain HTML, CSS, and JavaScript. No build step or npm installation. The flex
showcase loads its seven PNGs and two MP4s from the existing public R2 gateway.
Local WebP and MP4 fallbacks are bundled. Editorial images, video posters,
hero images, and icons are local. No third-party scripts or fonts.

## Preview

From the repository root:

```bash
python3 -m http.server 8080 --directory docs
```

Open <http://localhost:8080>. You can also open `docs/index.html` directly.
Copy buttons select the text for manual copying if clipboard access is unavailable.

## GitHub Pages

1. Commit and push the landing page and `.github/workflows/pages.yml` to `main`.
2. In the repository's **Settings → Pages → Build and deployment**, choose
   **GitHub Actions** as the source.
3. Open **Actions → Deploy landing page → Run workflow** if the first push ran
   before Pages was enabled. Future changes under `docs/` deploy automatically.

The expected project URL is <https://adetxt.github.io/carousel-agent/>.
The Actions deployment reports the actual published URL. The workflow uploads
only `docs/`, excluding the renderer, local carousels, and other project files.
Asset URLs are relative, so the site also works under another project subpath.

Alternatively, omit the Actions workflow and choose **Deploy from a branch**,
branch `main`, folder `/docs` in Pages settings.

## Content and media

- `index.html`: page content, Threads flex showcase, and Instagram editorial.
  Native scrolling and video controls work without JavaScript.
- `style.css`: layout, responsive styles, keyboard focus, and reduced motion.
- `social.css`: angled phone frames and slide spreads, hero entrance, and
  scroll-reveal animations. Phones sit upright on narrow screens.
- `script.js`: independent carousels, video lifecycle, media fallback, local
  like/save toggles, mouse dragging, scroll reveals, and copy buttons.
- `assets/`: 720 × 900 WebP derivatives, MP4 fallbacks, and local SVG icons.
- `assets/flex-media.json`: public source URLs, hashes, and local fallback paths.
- `DESIGN.md`: visual direction and constraints.

The editorial uses fictional OFF / SCRIPT branding and Unsplash photographs;
see the [original credits](../examples/seamless-editorial/CREDITS.md).
Threads showcases `carousels/2026-11-01-carousel-agent-flex/`: nine slides,
with MP4s at positions 4 and 5. Videos play once when active and at least 35%
of their track is visible, and pause when offscreen or the tab is hidden.
Reduced motion disables automatic video playback and page animations; native
video controls still allow intentional playback. Browser autoplay restrictions
may also require the visitor to press Play.

Drag either carousel with a mouse, swipe on touchscreens, or scroll horizontally
with a trackpad. Mouse dragging follows the pointer and snaps to a slide on
release. Native video control bars remain available for playback and scrubbing.
Arrow keys, pagination dots, and previous/next buttons are alternate controls.

The mockups are previews, not embedded live posts. Like/save buttons only update
local page state; they do not send anything to Instagram or Threads.
Each phone sits in front of a decorative spread of the existing local exports.
The device frame is CSS; swiping, keyboard navigation, and native video controls
remain inside the phone. No extra image assets or dependencies are required.
Threads and Instagram icons are from [Simple Icons](https://simpleicons.org/)
([CC0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md)).

To regenerate optimized slide assets, use `cwebp -q 84 -resize 720 0 INPUT.png
-o OUTPUT.webp` on the matching images in `examples/` or the dated flex carousel.
