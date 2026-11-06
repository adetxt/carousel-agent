# Carousel Agent landing page

Purpose: show the skill's actual output, explain the conversational workflow,
and help a visitor install it. This is a static showcase, not a carousel editor.

Direction: a warm paper canvas, ink typography, and cobalt actions. Large,
closely set sans-serif headings balance the editorial artwork. A composition
of actual exported slides makes the product concrete. No invented metrics,
customer claims, or generated artwork.

Structure: introduction and install action; two wide phone-and-slide mockups;
prompt-to-export workflow; installation requirements and FAQ. Threads shows
the nine-slide flex carousel, including its two motion slides; Instagram shows
the four-slide seamless editorial. Native platform details give exports context.
Keep photograph attribution and preview-only labeling visible. Do not invent
engagement counts or imply a live embedded post.

Mockup direction (2026-11-06): the supplied reference places a dark, angled
phone in front of a continuous spread of printed carousel panels. Use actual
local exports for the spread and keep the existing interactive post inside the
phone. CSS owns the device shell, island, side buttons, and home indicator;
there is no raster device asset or new dependency. Each example gets a wide
scene so the four panels have space. The scene's neutral lighting gradient and
contact shadows establish the paper plane and phone elevation. Cobalt stays
the page's action accent; the editorial's lime belongs to its existing artwork.
The phone becomes upright on small screens so swiping and reading stay usable.
Design read: physical presentation of real output; ENERGY 2 / RHYTHM 2 /
MOTION 2 (the existing one-time entrances and scroll reveals). The slide spread
is the repeated motif; the phone is the focal point.
An image-only mockup would lose gallery controls and video; a WebGL device
would add dependencies without improving this fixed composition.

Implementation: plain HTML, CSS, and progressive JavaScript in `docs/`.
Relative asset URLs support a GitHub Pages project subpath and direct file use.
The page works without JavaScript; JavaScript adds gallery controls, video
lifecycle, local reaction toggles, media fallbacks, and copy buttons. Flex media
uses the verified public R2 URLs, with local WebP/MP4 fallbacks. No framework,
remote script or font dependency, or build step.

Motion: the hero's output cards fan into place once; text enters in sequence.
The two platform examples reveal once on scroll, and reaction icons respond to
input. Motion slides play once when active and visible, pause offscreen, and
keep manual controls. Reduced motion disables page animation and video autoplay.
Corners stay mostly square outside the recognizable social-post frames.
Mobile gets a stacked hero and one readable slide at a time. Focus indicators,
keyboard scrolling, meaningful image alternatives, and usable touch controls
are required.

Delivery: publish only `docs/` using GitHub Pages Actions. Verify local asset
paths, script syntax, mobile and desktop rendering if browser access is
available, independent gallery navigation, video playback, and copy fallback.
