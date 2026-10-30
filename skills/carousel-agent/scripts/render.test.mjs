import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const exec = promisify(execFile);
const renderer = fileURLToPath(new URL('./render.mjs', import.meta.url));
const theme = new URL('../assets/kit/theme.css', import.meta.url).href;

async function fixture(t, width, height, { override = '', video = false, scale = 1 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'carousel-size-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const html = join(dir, 'slides.html');
  const out = join(dir, 'out');
  writeFileSync(html, `<!doctype html><link rel="stylesheet" href="${theme}">
    <style>:root { --w: ${width}px; --h: ${height}px; }
    .slide:last-child { ${override} }</style>
    <section class="slide"><div class="content">First</div></section>
    <section class="slide" ${video ? 'data-duration="0.1"' : ''}><div class="content">Second</div></section>`);
  return { out, run: () => exec(process.execPath, [renderer, html, '--out', out, '--scale', String(scale)]) };
}

function pngSize(file) {
  const png = readFileSync(file);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

for (const [width, height] of [[1080, 1350], [1080, 1080], [1080, 1920], [1200, 675]]) {
  for (const scale of [1, 2]) {
    test(`${width}x${height} at scale ${scale} gives every PNG the same dimensions`, async (t) => {
      const { out, run } = await fixture(t, width, height, { scale });
      await run();
      for (const slide of ['slide-01.png', 'slide-02.png']) {
        assert.deepEqual(pngSize(join(out, slide)), [width * scale, height * scale]);
      }
    });
  }
}

for (const override of ['width: 900px;', 'height: 1100px;', 'width: 864px; height: 1080px;']) {
  test(`rejects inconsistent dimensions (${override}) before exporting`, async (t) => {
    const { out, run } = await fixture(t, 1080, 1350, { override });
    await assert.rejects(run(), (err) => {
      assert.match(err.stderr, /Slide 2:.*expected 1080x1350/);
      return true;
    });
    assert.equal(existsSync(out), false);
  });
}

test('rejects an odd video canvas before exporting instead of shrinking only the MP4', async (t) => {
  const { out, run } = await fixture(t, 1200, 675, { video: true });
  await assert.rejects(run(), (err) => {
    assert.match(err.stderr, /even.*--scale 2/);
    return true;
  });
  assert.equal(existsSync(out), false);
});

test('mixed PNG and MP4 slides keep the same landscape dimensions at scale 2', async (t) => {
  const { out, run } = await fixture(t, 1200, 675, { video: true, scale: 2 });
  await run();
  const size = pngSize(join(out, 'slide-01.png'));
  const { stdout } = await exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'json', join(out, 'slide-02.mp4')]);
  const { streams: [video] } = JSON.parse(stdout);
  assert.deepEqual([video.width, video.height], size);
  assert.deepEqual(size, [2400, 1350]);
});
