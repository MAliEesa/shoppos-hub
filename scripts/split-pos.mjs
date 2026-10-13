// One-time tool: splits Shop 2's pos-system.html into the features/pos/ folder.
// Usage (from the hub root):  node scripts/split-pos.mjs "C:\path\to\pos-system.html"
import fs from 'fs';
import path from 'path';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/split-pos.mjs <path to pos-system.html>');
  process.exit(1);
}

const original = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
const lines = original.split('\n');
const OUT = path.join(process.cwd(), 'features', 'pos');

const RULE = /^\s*(\/\/|\/\*)\s*[═\-─=]{5,}\s*$/;

function fail(msg) {
  console.error('\nSTOPPED: ' + msg);
  console.error('Nothing was written. Your original file is untouched.');
  process.exit(1);
}

function findLine(arr, re, from, label) {
  for (let i = from; i < arr.length; i++) if (re.test(arr[i])) return i;
  fail(`could not find the landmark for "${label}"`);
}

// Cut `arr` into consecutive pieces, one per marker, in order.
function splitByMarkers(arr, markers, what) {
  const starts = [];
  let from = 0;
  for (const m of markers) {
    const idx = findLine(arr, m.re, from, `${what}: ${m.file}`);
    let s = idx;
    if (s > 0 && RULE.test(arr[s - 1])) s--;
    starts.push(s);
    from = idx + 1;
  }
  if (starts[0] !== 0) fail(`${what}: text exists before the first piece (line ${starts[0]})`);
  return markers.map((m, i) => ({
    file: m.file,
    text: arr.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : arr.length).join('\n'),
  }));
}

// ── find the big regions ────────────────────────────────────────────
const styleOpen = findLine(lines, /^\s*<style>\s*$/, 0, '<style>');
const styleClose = findLine(lines, /^\s*<\/style>\s*$/, styleOpen, '</style>');
const bodyOpen = findLine(lines, /^\s*<body>\s*$/, styleClose, '<body>');
const scriptOpen = findLine(lines, /^\s*<script>\s*$/, bodyOpen, 'main <script>');
const scriptClose = findLine(lines, /^\s*<\/script>\s*$/, scriptOpen, '</script>');

const headLines = lines.slice(0, styleOpen);
const cssLines = lines.slice(styleOpen + 1, styleClose);
const bodyLines = lines.slice(bodyOpen + 1, scriptOpen);
const jsLines = lines.slice(scriptOpen + 1, scriptClose);

// ── CSS ─────────────────────────────────────────────────────────────
const cssPieces = splitByMarkers(cssLines, [
  { file: 'styles/base.css', re: /^\s*:root \{/ },
  { file: 'styles/landing.css', re: /^\s*\/\* ── LANDING ── \*\/\s*$/ },
  { file: 'styles/layout.css', re: /^\s*\/\* ── SHARED LAYOUT ── \*\/\s*$/ },
  { file: 'styles/employee.css', re: /^\s*EMPLOYEE SCREEN\s*$/ },
  { file: 'styles/admin.css', re: /^\s*ADMIN SCREEN\s*$/ },
  { file: 'styles/products.css', re: /^\s*\/\* ── PRODUCTS TAB ── \*\/\s*$/ },
  { file: 'styles/inventory.css', re: /^\s*\/\* ── INVENTORY TAB ── \*\/\s*$/ },
  { file: 'styles/categories.css', re: /^\s*\/\* ── CATEGORIES TAB ── \*\/\s*$/ },
  { file: 'styles/dashboard.css', re: /^\s*\/\* ── DASHBOARD TAB ── \*\/\s*$/ },
  { file: 'styles/receipt-modal.css', re: /^\s*\/\* ── RECEIPT MODAL ── \*\/\s*$/ },
  { file: 'styles/common.css', re: /^\s*\/\* scrollbar \*\/\s*$/ },
  { file: 'styles/mobile.css', re: /^\s*\/\* ── MOBILE ── \*\/\s*$/ },
], 'CSS');

// ── HTML (views) ────────────────────────────────────────────────────
const divDepth = (s) => (s.match(/<div\b/g) || []).length - (s.match(/<\/div>/g) || []).length;

function blockEnd(arr, from) {
  let i = from;
  while (i < arr.length && !/<div\b/.test(arr[i])) i++;
  let depth = 0;
  for (; i < arr.length; i++) {
    depth += divDepth(arr[i]);
    if (depth === 0) return i;
  }
  fail('an HTML block never closed (unbalanced <div>)');
}

// Replace each block (comment line + its <div>...</div>) with an include marker.
function extractBlocks(arr, specs, what) {
  const ranges = [];
  let from = 0;
  for (const sp of specs) {
    let idx = findLine(arr, sp.re, from, `${what}: ${sp.file}`);
    let start = idx;
    if (sp.takeComment && start > 0 && /^\s*<!--.*-->\s*$/.test(arr[start - 1])) start--;
    const end = blockEnd(arr, idx);
    const text = arr.slice(start, end + 1).join('\n');
    const d = divDepth(text);
    if (d !== 0) fail(`${what}: ${sp.file} is not balanced`);
    ranges.push({ start, end, file: sp.file, text, indent: arr[start].match(/^\s*/)[0] });
    from = end + 1;
  }
  const out = [];
  let cur = 0;
  for (const r of ranges) {
    out.push(...arr.slice(cur, r.start));
    out.push(`${r.indent}<!-- @include ${r.file} -->`);
    cur = r.end + 1;
  }
  out.push(...arr.slice(cur));
  return { text: out.join('\n'), pieces: ranges.map((r) => ({ file: r.file, text: r.text })) };
}

const top = extractBlocks(bodyLines, [
  { file: 'views/login-gate.html', re: /^\s*<!-- ADMIN LOGIN GATE -->\s*$/ },
  { file: 'views/landing.html', re: /^\s*<!-- LANDING -->\s*$/ },
  { file: 'views/employee-screen.html', re: /^\s*<!-- EMPLOYEE SCREEN -->\s*$/ },
  { file: 'views/admin/screen.html', re: /^\s*<!-- ADMIN SCREEN -->\s*$/ },
  { file: 'views/receipt-modal.html', re: /^\s*<!-- RECEIPT MODAL -->\s*$/ },
], 'HTML');

// the admin screen is split again into its tabs
const adminPiece = top.pieces.find((p) => p.file === 'views/admin/screen.html');
const tabNames = [...adminPiece.text.matchAll(/class="section-tab[^"]*" id="tab-([a-z]+)"/g)].map((m) => m[1]);
if (tabNames.length < 5) fail('could not find the admin tabs');
const tabs = extractBlocks(
  adminPiece.text.split('\n'),
  tabNames.map((n) => ({
    file: `views/admin/tab-${n}.html`,
    re: new RegExp(`class="section-tab[^"]*" id="tab-${n}"`),
    takeComment: true,
  })),
  'admin tabs'
);

const htmlFiles = [
  { file: 'views/index.html', text: top.text },
  ...top.pieces.filter((p) => p.file !== 'views/admin/screen.html'),
  { file: 'views/admin/screen.html', text: tabs.text },
  ...tabs.pieces,
];

// ── JavaScript ──────────────────────────────────────────────────────
const jsMarkers = [
  ['core/firebase.js', /^\s*\/\/ FIREBASE \+ DATA STORE\s*$/],
  ['core/store.js', /^\s*let db = \{/],
  ['core/theme.js', /^\s*function toggleTheme\(/],
  ['core/database.js', /^\s*function loadDB\(/],
  ['core/time.js', /^\s*function toKarachi\(/],
  ['core/product-form-state.js', /^\s*let editingProductRef = /],
  ['core/clock.js', /^\s*\/\/ CLOCK\s*$/],
  ['core/navigation.js', /^\s*\/\/ NAVIGATION\s*$/],
  ['screens/employee.js', /^\s*\/\/ EMPLOYEE SCREEN\s*$/],
  ['screens/admin.js', /^\s*\/\/ ADMIN SCREEN\s*$/],
  ['features/dashboard.js', /^\s*\/\/ ── DASHBOARD ──\s*$/],
  ['features/products.js', /^\s*\/\/ ── PRODUCTS ──\s*$/],
  ['features/inventory.js', /^\s*\/\/ ── INVENTORY ──\s*$/],
  ['features/categories.js', /^\s*\/\/ ── CATEGORIES ──\s*$/],
  ['core/toast.js', /^\s*\/\/ TOAST\s*$/],
  ['features/barcodes.js', /^\s*\/\/ BARCODE PRINTING\s*$/],
  ['features/analytics.js', /^\s*\/\/ ANALYTICS\s*$/],
  ['features/shop-hours.js', /^\s*\/\/ SHOP HOURS\s*$/],
  ['features/restock.js', /^\s*\/\/ RESTOCK LIST\s*$/],
  ['features/wipe-sales.js', /^\s*\/\/ WIPE SALES\s*$/],
  ['features/close-of-day.js', /^\s*\/\/ CLOSE OF DAY\s*$/],
  ['features/check-a-day.js', /^\s*\/\/ CHECK A DAY\s*$/],
  ['features/revenue.js', /^\s*\/\/ REVENUE SUMMARY\s*$/],
  ['features/mobile-nav.js', /^\s*\/\/ MOBILE NAV\s*$/],
  ['core/session.js', /^\s*\/\/ INIT\s*$/],
  ['screens/payment-method.js', /^\s*function togglePayDropdown\(/],
  ['core/version-check.js', /^\s*\(async \(\) => \{\s*$/],
  ['core/app-start.js', /^\s*function startApp\(/],
  ['core/notifications.js', /^\s*const VAPID_KEY = /],
  ['features/expenses.js', /^\s*\/\/ EXPENSES\s*$/],
  ['features/print-history.js', /^\s*async function clearPrintHistory\(/],
  ['features/expenses-live.js', /^\s*fbdb\.ref\('\/expenses'\)\.on\('value'/],
  ['core/boot.js', /^\s*initNotifications\(\);\s*$/],
].map(([file, re]) => ({ file, re }));

const jsPieces = splitByMarkers(jsLines, jsMarkers, 'JavaScript');

// ── safety check 1: the pieces must rebuild the original exactly ────
function resolveIncludes(text, files) {
  return text.replace(/^[ \t]*<!-- @include (\S+) -->[ \t]*$/gm, (m, rel) => {
    const f = files.find((x) => x.file === rel);
    if (!f) fail(`missing included file ${rel}`);
    return resolveIncludes(f.text, files);
  });
}
const same = (a, b, what) => {
  if (a !== b) fail(`${what} does not rebuild identically to the original`);
};
same(cssPieces.map((p) => p.text).join('\n'), cssLines.join('\n'), 'CSS');
same(resolveIncludes(top.text, htmlFiles), bodyLines.join('\n'), 'HTML');
same(jsPieces.map((p) => p.text).join('\n'), jsLines.join('\n'), 'JavaScript');

// ── shop-specific parts become per-shop values ──────────────────────
let apiCount = 0;
let cfgCount = 0;
let vapidCount = 0;
let swCount = 0;

for (const p of jsPieces) {
  p.text = p.text
    .replace(/const firebaseConfig = \{[\s\S]*?\};/, () => {
      cfgCount++;
      return 'const firebaseConfig = window.__SHOP__.firebaseConfig;';
    })
    .replace(/fetch\('\/api\/(checkpass|checkwipe|notify|wipealert)'/g, (m, name) => {
      apiCount++;
      return `fetch(shopApi('${name}')`;
    })
    .replace(/const VAPID_KEY = '[^']*';/, () => {
      vapidCount++;
      return 'const VAPID_KEY = window.__SHOP__.vapidKey;';
    })
    .replace(/'\/firebase-messaging-sw\.js'/, () => {
      swCount++;
      return "'/shop/' + window.__SHOP__.id + '/firebase-messaging-sw.js'";
    });
}
if (cfgCount !== 1) fail(`expected 1 firebase config, found ${cfgCount}`);
if (apiCount !== 12) fail(`expected 12 backend calls, found ${apiCount}`);
if (vapidCount !== 1) fail(`expected 1 notification key, found ${vapidCount}`);
if (swCount !== 1) fail(`expected 1 service worker path, found ${swCount}`);

const apiFile = {
  file: 'core/api.js',
  text: `// Backend addresses for the current shop.
// Every call to the hub backend goes through this one helper.
function shopApi(name) {
  return '/api/shop/' + window.__SHOP__.id + '/' + name;
}`,
};

// ── write everything ────────────────────────────────────────────────
const scriptFiles = [];
for (const p of jsPieces) {
  scriptFiles.push(p);
  if (p.file === 'core/firebase.js') scriptFiles.push(apiFile);
}

const all = [
  { file: 'shell.html', text: headLines.join('\n') },
  ...cssPieces,
  ...htmlFiles,
  ...scriptFiles.map((p) => ({ file: 'scripts/' + p.file, text: p.text })),
];

const manifest = {
  shell: 'shell.html',
  styles: cssPieces.map((p) => p.file),
  view: 'views/index.html',
  scripts: scriptFiles.map((p) => 'scripts/' + p.file),
};
all.push({ file: 'manifest.json', text: JSON.stringify(manifest, null, 2) + '\n' });

for (const f of all) {
  if (/AIza[0-9A-Za-z_-]{30,}/.test(f.text)) fail(`an API key is still inside ${f.file}`);
}

if (fs.existsSync(OUT) && !process.argv.includes('--force')) {
  fail('features/pos already exists. Running this again would overwrite your edits. Delete the folder first if you really want to start over.');
}
fs.rmSync(OUT, { recursive: true, force: true });
for (const f of all) {
  const full = path.join(OUT, f.file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, f.text);
}

console.log(`\nDone. Wrote ${all.length} files into features/pos/`);
console.log(`  styles: ${cssPieces.length}   views: ${htmlFiles.length}   scripts: ${scriptFiles.length}`);
console.log('Checks passed: HTML, CSS and JavaScript rebuild identically to your original.');
console.log('Replaced: 1 database config, 12 backend calls, 1 notification key, 1 service worker path.');