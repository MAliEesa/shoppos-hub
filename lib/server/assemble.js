import fs from 'fs';
import path from 'path';

// Builds a feature's page (for example the POS) from the small files in /features.
// The order of every file comes from that feature's manifest.json.

const ROOT = path.join(process.cwd(), 'features');
const cache = new Map();

function read(feature, rel) {
  return fs.readFileSync(path.join(ROOT, feature, rel), 'utf8');
}

// <!-- @include views/x.html -->  is replaced by the content of that file
function resolveIncludes(feature, text, trail = []) {
  return text.replace(/^[ \t]*<!-- @include (\S+) -->[ \t]*$/gm, (m, rel) => {
    if (trail.includes(rel)) throw new Error(`include loop at ${rel}`);
    return resolveIncludes(feature, read(feature, rel), [...trail, rel]);
  });
}

function build(feature) {
  const m = JSON.parse(read(feature, 'manifest.json'));
  return {
    shell: read(feature, m.shell),
    css: m.styles.map((f) => `/* ===== ${f} ===== */\n${read(feature, f)}`).join('\n'),
    view: resolveIncludes(feature, read(feature, m.view)),
    js: m.scripts.map((f) => `// ===== ${f} =====\n${read(feature, f)}`).join('\n'),
  };
}

// The only shop-specific values the page receives.
function shopData(shop) {
  return {
    id: shop.id,
    name: shop.name,
    firebaseConfig: shop.firebaseConfig,
    vapidKey: shop.vapidKey || '',
  };
}

export function renderFeaturePage(feature, shop) {
  const useCache = process.env.NODE_ENV === 'production';
  let t = useCache ? cache.get(feature) : null;
  if (!t) {
    t = build(feature);
    if (useCache) cache.set(feature, t);
  }

  const data = JSON.stringify(shopData(shop)).replace(/</g, '\\u003c');

  return [
    t.shell,
    '<style>',
    t.css,
    '</style>',
    '</head>',
    '<body>',
    t.view,
    `<script>window.__SHOP__ = ${data};</script>`,
    '<script>',
    t.js,
    '</script>',
    '</body>',
    '</html>',
  ].join('\n');
}