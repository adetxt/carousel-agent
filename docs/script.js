const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

for (const post of document.querySelectorAll('.social-post')) {
  const track = post.querySelector('.social-track');
  const slides = [...track.children];
  const previous = post.querySelector('.post-prev');
  const next = post.querySelector('.post-next');
  const count = post.querySelector('.post-position');
  const dotGroup = post.querySelector('.post-dots');
  const videos = [...track.querySelectorAll('video')];
  let index = 0;
  let visible = false;

  function stepWidth() {
    return slides[1].offsetLeft - slides[0].offsetLeft;
  }

  function syncPlayback() {
    for (const video of videos) {
      const active = slides[index].contains(video) && visible && !document.hidden;
      if (!active || reducedMotion.matches) {
        video.pause();
      } else if (!video.ended) {
        // Native controls remain available when the browser declines autoplay.
        video.play().catch(() => {});
      }
    }
  }

  function update() {
    const previousIndex = index;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    index = atEnd ? slides.length - 1 : Math.round(track.scrollLeft / stepWidth());
    index = Math.max(0, Math.min(slides.length - 1, index));
    previous.disabled = index === 0;
    next.disabled = atEnd;
    count.textContent = `${index + 1} / ${slides.length}`;
    [...dotGroup.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    if (previousIndex !== index) syncPlayback();
  }

  function go(target, instant = false) {
    const clamped = Math.max(0, Math.min(slides.length - 1, target));
    track.scrollTo({
      left: clamped * stepWidth(),
      behavior: instant || reducedMotion.matches ? 'instant' : 'smooth',
    });
  }

  let drag = null;
  let suppressClick = false;
  track.classList.add('is-swipable');
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    suppressClick = false;
    const video = event.target.closest('video');
    // Leave the native video control bar available for clicking and scrubbing.
    if (video && event.clientY > video.getBoundingClientRect().bottom - 56) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scroll: track.scrollLeft,
      index,
      moved: false,
    };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
      drag.moved = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
      track.focus({ preventScroll: true });
    }
    event.preventDefault();
    track.scrollLeft = drag.scroll - dx;
  });

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const finished = drag;
    drag = null;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (!finished.moved) return;
    suppressClick = true;
    const distance = finished.scroll - track.scrollLeft;
    let target = Math.round(track.scrollLeft / stepWidth());
    if (event.type === 'pointerup' && target === finished.index && Math.abs(distance) > Math.min(60, stepWidth() * 0.18)) {
      target += distance < 0 ? 1 : -1;
    }
    track.classList.remove('is-dragging');
    go(target);
  }

  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);
  track.addEventListener('pointerleave', () => {
    if (drag && !drag.moved) drag = null;
  });
  track.addEventListener('click', (event) => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  }, true);

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'post-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => go(i));
    dotGroup.append(dot);
  });

  for (const media of track.querySelectorAll('[data-fallback]')) {
    media.addEventListener('error', () => {
      if (media.dataset.fallback) {
        media.src = media.dataset.fallback;
        delete media.dataset.fallback;
        if (media.tagName === 'VIDEO') {
          media.load();
          syncPlayback();
        }
      } else if (!media.parentElement.querySelector('.media-error')) {
        const message = document.createElement('p');
        message.className = 'media-error';
        message.textContent = 'This slide could not load. Please reload the page to try again.';
        media.parentElement.append(message);
      }
    });
    if (media.tagName === 'IMG' && media.complete && media.naturalWidth === 0) {
      media.dispatchEvent(new Event('error'));
    }
  }

  previous.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      go(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  new ResizeObserver(() => {
    go(index, true);
    update();
  }).observe(track);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
    syncPlayback();
  }, { threshold: 0.35 }).observe(track);
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);
  post.querySelector('.post-pagination').hidden = false;
  update();
}

for (const button of document.querySelectorAll('.like-button, .save-button')) {
  button.hidden = false;
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-enter');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });
for (const element of document.querySelectorAll('[data-reveal]')) revealObserver.observe(element);
for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy);
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      status.textContent = button.dataset.copy === 'install-command' ? 'Install command copied.' : 'Starter prompt copied.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Automatic copy is unavailable. The text is selected; press Ctrl+C or ⌘C to copy.';
    }
  });
}
