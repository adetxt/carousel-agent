#!/usr/bin/env node
// Render every slide element in an HTML file to its own PNG (or MP4 for slides with
// data-duration) using a locally installed Chrome/Chromium/Edge over the DevTools protocol.
// No npm deps; Node >= 22. Video slides also need ffmpeg.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, accessSync, constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node render.mjs <carousel.html> [options]

Options:
  --out <dir>          Output directory (default: ./carousel-out)
  --selector <css>     Slide selector (default: .slide)
  --scale <n>          Device pixel ratio, e.g. 2 for retina (default: 1)
  --prefix <name>      File name prefix (default: slide)
  --fps <n>            Frame rate for video slides (default: 30)
  -h, --help           Show this help

Slides with data-duration="<seconds>" render to MP4 instead of PNG.
Set CHROME_PATH / FFMPEG_PATH to use specific binaries.`;

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', default: 'carousel-out' },
    selector: { type: 'string', default: '.slide' },
    scale: { type: 'string', default: '1' },
    prefix: { type: 'string', default: 'slide' },
    fps: { type: 'string', default: '30' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (opts.help || positionals.length !== 1) {
  console.log(USAGE);
  process.exit(opts.help ? 0 : 1);
}

const input = resolve(positionals[0]);
if (!existsSync(input)) fail(`Input not found: ${input}`);
const scale = Number(opts.scale);
if (!(scale > 0)) fail(`--scale must be a positive number, got "${opts.scale}"`);
const fps = Number(opts.fps);
if (!(fps > 0)) fail(`--fps must be a positive number, got "${opts.fps}"`);

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function isExecutable(file) {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findBrowser() {
  if (process.env.CHROME_PATH) {
    if (!isExecutable(process.env.CHROME_PATH)) throw new Error(`CHROME_PATH is not executable: ${process.env.CHROME_PATH}`);
    return process.env.CHROME_PATH;
  }
  const candidates = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ],
    win32: [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]
      .filter(Boolean)
      .flatMap((base) => [
        join(base, 'Google/Chrome/Application/chrome.exe'),
        join(base, 'Microsoft/Edge/Application/msedge.exe'),
      ]),
  }[process.platform] ?? [];
  const found = [...candidates, ...onPath('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge')]
    .find(isExecutable);
  if (!found) throw new Error('No Chrome/Chromium/Edge found. Install one or set CHROME_PATH.');
  return found;
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH) {
    if (!isExecutable(process.env.FFMPEG_PATH)) throw new Error(`FFMPEG_PATH is not executable: ${process.env.FFMPEG_PATH}`);
    return process.env.FFMPEG_PATH;
  }
  const found = onPath('ffmpeg', 'ffmpeg.exe').find(isExecutable);
  if (!found) throw new Error('Video slides need ffmpeg. Install it (e.g. brew install ffmpeg / apt install ffmpeg) or set FFMPEG_PATH.');
  return found;
}

function onPath(...names) {
  return names.flatMap((name) => (process.env.PATH ?? '').split(delimiter).map((dir) => join(dir, name)));
}

function launch(binary, profileDir) {
  const proc = spawn(binary, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    '--allow-file-access-from-files',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  return new Promise((resolvePort, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error(`Browser did not start in 30s:\n${stderr}`)), 30_000);
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolvePort({ proc, port: Number(match[1]) });
      }
    });
    proc.on('error', reject);
    proc.on('exit', (code) => reject(new Error(`Browser exited (${code}) before starting:\n${stderr}`)));
  });
}

async function connect(port) {
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = pages.find((t) => t.type === 'page');
  if (!page) throw new Error('No page target in browser');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, err) => {
    ws.onopen = ok;
    ws.onerror = () => err(new Error('DevTools WebSocket failed to open'));
  });

  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id !== undefined) {
      const { ok, err } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? err(new Error(`${msg.error.message} ${msg.error.data ?? ''}`)) : ok(msg.result);
    } else {
      listeners.get(msg.method)?.(msg.params);
    }
  };

  return {
    send(method, params = {}) {
      const id = ++nextId;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((ok, err) => pending.set(id, { ok, err }));
    },
    once(method) {
      return new Promise((ok) => listeners.set(method, (params) => {
        listeners.delete(method);
        ok(params);
      }));
    },
    close: () => ws.close(),
  };
}

// Injected before any page script. Page time (requestAnimationFrame, performance.now, Date.now,
// CSS/Web Animations) only moves when the renderer seeks, so every frame lands on an exact
// timestamp regardless of how slow capture is. setTimeout/setInterval stay on real time.
const CLOCK = `(() => {
  let now = 0;
  const epoch = Date.now();
  let frameCallbacks = new Map();
  let nextId = 1;
  const firstSeen = new WeakMap();
  performance.now = () => now;
  Date.now = () => epoch + now;
  window.requestAnimationFrame = (cb) => { frameCallbacks.set(nextId, cb); return nextId++; };
  window.cancelAnimationFrame = (id) => { frameCallbacks.delete(id); };
  window.__carouselClock = {
    seek(ms) {
      now = ms;
      const due = frameCallbacks;
      frameCallbacks = new Map();
      for (const cb of due.values()) cb(now);
      for (const anim of document.getAnimations()) {
        if (!firstSeen.has(anim)) firstSeen.set(anim, now);
        anim.pause();
        anim.currentTime = now - firstSeen.get(anim);
      }
    },
  };
})()`;

// Measures slides at time 0 after fonts and images settle; also flags content that overflows
// its slide and images that failed to load (e.g. a wrong logo path).
const measure = (selector) => `(async () => {
  await document.fonts.ready;
  const broken = [];
  await Promise.all([...document.images].map((img) => img.decode().catch(() => broken.push(img.src))));
  window.__carouselClock.seek(0);
  const slides = [...document.querySelectorAll(${JSON.stringify(selector)})].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height,
      overflow: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
      duration: el.dataset.duration ?? null,
    };
  });
  return { slides, broken };
})()`;

async function evaluate(cdp, expression) {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

// Pipes PNG frames into ffmpeg as H.264 MP4 (yuv420p, even dimensions) for social-platform playback.
async function recordVideo(ffmpeg, file, frameCount, renderFrame) {
  const proc = spawn(ffmpeg, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart',
    file,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  proc.stderr.on('data', (chunk) => { stderr += chunk; });
  const exited = new Promise((done) => proc.on('close', done));
  proc.stdin.on('error', () => {}); // EPIPE if ffmpeg dies early; its exit code is reported below

  for (let n = 0; n < frameCount && proc.exitCode === null; n++) {
    if (!proc.stdin.write(await renderFrame(n))) {
      await Promise.race([new Promise((drained) => proc.stdin.once('drain', drained)), exited]);
    }
  }
  proc.stdin.end();
  const code = await exited;
  if (code !== 0) throw new Error(`ffmpeg failed (${code}) for ${file}:\n${stderr}`);
}

async function render() {
  const profileDir = mkdtempSync(join(tmpdir(), 'html-carousel-'));
  let browser;
  let cdp;
  try {
    browser = await launch(findBrowser(), profileDir);
    cdp = await connect(browser.port);
    await cdp.send('Page.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK });

    const setViewport = (width, height) => cdp.send('Emulation.setDeviceMetricsOverride', {
      width: Math.ceil(width), height: Math.ceil(height), deviceScaleFactor: scale, mobile: false,
    });
    // Each load restarts page time at 0, so every video slide's animation starts from its beginning.
    const load = async () => {
      const loaded = cdp.once('Page.loadEventFired');
      const { errorText } = await cdp.send('Page.navigate', { url: pathToFileURL(input).href });
      if (errorText) throw new Error(`Failed to load ${input}: ${errorText}`);
      await loaded;
      return evaluate(cdp, measure(opts.selector));
    };
    const capture = async ({ x, y, width, height }) => {
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true, clip: { x, y, width, height, scale: 1 },
      });
      return Buffer.from(data, 'base64');
    };

    await setViewport(1080, 1350);
    let { slides } = await load();
    if (slides.length === 0) throw new Error(`No elements match selector "${opts.selector}" in ${input}`);

    // Match the viewport to the slide so vw/vh units and media queries resolve against slide size.
    await setViewport(Math.max(...slides.map((s) => s.width)), slides[0].height);
    const measured = await evaluate(cdp, measure(opts.selector));
    slides = measured.slides;
    for (const src of new Set(measured.broken)) console.warn(`WARNING: image failed to load: ${src}`);
    for (const [i, { duration }] of slides.entries()) {
      if (duration !== null && !(Number(duration) > 0)) {
        throw new Error(`Slide ${i + 1}: data-duration must be a positive number of seconds, got "${duration}"`);
      }
    }
    const ffmpeg = slides.some((s) => s.duration !== null) ? findFfmpeg() : null;

    const outDir = resolve(opts.out);
    mkdirSync(outDir, { recursive: true });
    const digits = Math.max(2, String(slides.length).length);
    for (const [i, slide] of slides.entries()) {
      const name = join(outDir, `${opts.prefix}-${String(i + 1).padStart(digits, '0')}`);
      const size = `${Math.round(slide.width * scale)}x${Math.round(slide.height * scale)}`;
      const warning = slide.overflow ? '  WARNING: content overflows slide' : '';
      if (slide.duration === null) {
        writeFileSync(`${name}.png`, await capture(slide));
        console.log(`${name}.png ${size}${warning}`);
        continue;
      }
      const seconds = Number(slide.duration);
      const frame = (await load()).slides[i];
      // Frame n shows time (n + 1) / fps: like a real browser, the first painted frame follows the
      // first animation tick, which libraries such as GSAP need to apply their initial state.
      await recordVideo(ffmpeg, `${name}.mp4`, Math.round(seconds * fps), async (n) => {
        await evaluate(cdp, `window.__carouselClock.seek(${((n + 1) * 1000) / fps})`);
        return capture(frame);
      });
      console.log(`${name}.mp4 ${size} ${seconds}s@${fps}fps${warning}`);
    }
  } finally {
    const proc = browser?.proc;
    if (proc && proc.exitCode === null) {
      // Graceful close lets Chrome's helper processes flush the profile before it is deleted.
      const exited = new Promise((done) => proc.once('exit', done));
      cdp?.send('Browser.close').catch(() => {});
      const timedOut = await Promise.race([
        exited.then(() => false),
        new Promise((done) => setTimeout(done, 5000, true).unref()),
      ]);
      if (timedOut) {
        proc.kill();
        await exited;
      }
    }
    cdp?.close();
    try {
      rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (err) {
      console.warn(`WARNING: could not remove temporary browser profile: ${err.message}`);
    }
  }
}

render().catch((err) => fail(err.message));
