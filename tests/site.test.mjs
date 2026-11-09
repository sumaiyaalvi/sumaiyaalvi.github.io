import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { test } from 'node:test';

// SITE_DIR lets the tests run against a build rendered somewhere other than docs/.
const siteDir = resolve(process.env.SITE_DIR ?? 'docs');

const htmlFiles = readdirSync(siteDir, { recursive: true })
  .map((file) => join(siteDir, file))
  .filter((file) => file.endsWith('.html'));

test('every top-level page and project was rendered', () => {
  const expected = [
    'index.html',
    'about.html',
    'interests.html',
    'projects.html',
    'resume.html',
    'projects/beats-by-dre/index.html',
    'projects/coyotes/index.html',
    'projects/diamonds/index.html',
    'projects/housing/index.html',
    'projects/screentime/index.html',
    'projects/vegan/index.html',
  ];
  for (const page of expected) {
    assert.ok(existsSync(join(siteDir, page)), `missing ${page}`);
  }
});

test('the R-generated screentime page contains its interactive widgets', () => {
  const html = readFileSync(join(siteDir, 'projects/screentime/index.html'), 'utf8');
  assert.match(html, /htmlwidget/);
});

test('local links and assets resolve to files in the build', () => {
  const broken = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
      const path = decodeURIComponent(url.split(/[?#]/)[0]);
      if (!path) continue;
      const target = path.startsWith('/') ? join(siteDir, path) : resolve(dirname(file), path);
      const found =
        existsSync(target) &&
        (!statSync(target).isDirectory() || existsSync(join(target, 'index.html')));
      if (!found) broken.push(`${relative(siteDir, file)} -> ${url}`);
    }
  }
  assert.deepEqual(broken, []);
});
