          // ══════════════════════════════════════
          // EMPLOYEE SCREEN
          // ══════════════════════════════════════
          function initEmpScreen() {
            renderEmpCategories();
            if (window.innerWidth > 768) document.getElementById('barcode-input').focus();
            if (window.innerWidth > 768) {
              document.addEventListener('click', function(e) {
                const empActive = document.getElementById('emp-screen').classList.contains('active');
                if (!empActive) return;
                const tag = e.target.tagName.toLowerCase();
                const type = (e.target.type || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
                if (tag === 'button') return;
                if (e.target.closest('[style*="z-index:9999"]')) return;
                document.getElementById('barcode-input').focus();
              });
            }
          }
          

          function renderEmpCategories() {
            const list = document.getElementById('emp-cat-list');
            list.innerHTML = '';
            // All button
            const all = document.createElement('button');
            all.className = 'cat-btn' + (selectedCatEmp === null ? ' active' : '');
            all.textContent = 'All';
            all.onclick = () => { selectedCatEmp = null; renderEmpCategories(); };
            list.appendChild(all);

            db.categories.forEach(cat => {
              const btn = document.createElement('button');
              btn.className = 'cat-btn' + (selectedCatEmp === cat ? ' active' : '');
              btn.textContent = cat;
              btn.onclick = () => { selectedCatEmp = cat; renderEmpCategories(); };
              list.appendChild(btn);
            });
            renderEmpProducts();
          }

          function renderEmpProducts() {
            const grid = document.getElementById('emp-prod-grid');
            grid.innerHTML = '';
            let filtered = selectedCatEmp
              ? db.products.filter(p => p.category === selectedCatEmp)
              : db.products;

            const priceSearchEl = document.getElementById('emp-price-search');
            const priceSearchVal = priceSearchEl ? priceSearchEl.value.trim() : '';
            if (priceSearchVal !== '') {
              filtered = filtered.filter(p => [p.barcode, p.ref].some(v => String(v || '').toLowerCase().includes(priceSearchVal.toLowerCase())));
            }

            if (filtered.length === 0) {
              grid.innerHTML = '<div style="color:var(--text3);font-size:.82rem;padding:16px;grid-column:1/-1">No products yet</div>';
              return;
            }
            filtered.forEach(p => {
              const card = document.createElement('div');
              card.className = 'prod-card';
              const imgHtml = p.photo
                ? `<img src="${p.photo}" alt="${p.name}">`
                : `<div class="prod-card-img-placeholder">📦</div>`;
                card.innerHTML = `<div style="font-family:var(--mono);font-size:.68rem;color:var(--text3);margin-bottom:4px;word-break:break-all">${p.barcode || p.ref}</div>${imgHtml}<div class="prod-card-name">${p.name}</div><div class="prod-card-price">${p.customTrigger ? '---' : 'Rs. ' + parseFloat(p.sellPrice).toFixed(2)}</div>`;
              card.onclick = () => {
                if (parseInt(p.stock||0) <= 0) { showToast('⚠ Out of stock — cannot add: ' + p.name); return; }
                const inBill = bill.find(b => b.product.ref === p.ref);
                const qtyInBill = inBill ? inBill.qty : 0;
                if (qtyInBill >= parseInt(p.stock||0)) { showToast('⚠ Not enough stock: ' + p.name); return; }
                addToBill(p);
              };
              grid.appendChild(card);
            });
          }

          // Barcode input — works with barcode scanners (Enter key)
(function() { const el = document.getElementById('barcode-input'); let buf = '', last = 0, fast = 0; el.setAttribute('inputmode', 'none'); el.placeholder = 'Scan barcode...'; el.addEventListener('keydown', function(e) { if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Tab') return; if (e.key === 'Enter') { el.value = (buf.length >= 3 && fast >= buf.length - 1) ? buf : ''; buf = ''; fast = 0; return; } e.preventDefault(); if (e.key.length === 1) { const now = Date.now(); if (now - last > 80) { buf = ''; fast = 0; } else fast++; last = now; buf += e.key; } }); ['paste','drop','input'].forEach(ev => el.addEventListener(ev, function(e) { e.preventDefault(); el.value = ''; })); })();
document.getElementById('barcode-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              const val = this.value.trim();
              this.value = '';
              processBarcodeInput(val);
            }
          });

          function addToBill(product) {
            const existing = bill.find(b => b.product.ref === product.ref);
            if (existing) {
              existing.qty++;
            } else {
              bill.push({ product, qty: 1 });
            }
            renderBill();
          }

          function renderBill() {
            const tbody = document.getElementById('bill-tbody');
            tbody.innerHTML = '';

            if (bill.length === 0) {
              tbody.innerHTML = `<tr id="bill-empty-row"><td colspan="6"><div class="bill-empty"><span>⬛</span><p>Scan a barcode or select a product below</p></div></td></tr>`;
              document.getElementById('total-items').textContent = '0';
              document.getElementById('total-amount').textContent = 'Rs. 0.00';
              return;
            }

            let totalQty = 0, totalAmt = 0;
            bill.forEach((b, i) => {
              const rowTotal = b.qty * billPrice(b);
              totalQty += b.qty;
              totalAmt += rowTotal;
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td style="color:var(--text3);font-family:var(--mono);font-size:.78rem">${i+1}</td>
                <td><div class="item-name">${b.product.name}</div><div class="item-price">${b.product.ref}</div></td>
               <td class="item-price"><input type="number" min="0" step="any" inputmode="decimal" value="${billPrice(b)}" onchange="setBillPrice(${i},this.value)" onkeydown="if(event.key==='Enter')this.blur()" style="width:90px;background:var(--bg3);border:1px solid ${billPrice(b) !== parseFloat(b.product.sellPrice) ? '#f59e0b' : 'var(--border2)'};border-radius:6px;color:var(--text);font-family:var(--mono);font-size:.85rem;padding:5px 8px;outline:none">${billPrice(b) !== parseFloat(b.product.sellPrice) ? `<div style="font-size:.68rem;color:#f59e0b;margin-top:2px">was Rs. ${parseFloat(b.product.sellPrice).toFixed(2)}</div>` : ''}</td>
                <td><div class="qty-ctrl">
                  <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
                  <span class="qty-num">${b.qty}</span>
                  <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
                </div></td>
                <td class="item-total">Rs. ${rowTotal.toFixed(2)}</td>
                <td><button class="del-btn" onclick="removeFromBill(${i})">✕</button></td>
              `;
              tbody.appendChild(tr);
            });

            document.getElementById('total-items').textContent = totalQty;
            document.getElementById('total-amount').textContent = `Rs. ${totalAmt.toFixed(2)}`;
          }

function billPrice(b) { const p = parseFloat(b.price); return (b.price != null && !isNaN(p) && p >= 0) ? p : parseFloat(b.product.sellPrice); }
function setBillPrice(i, val) { const v = parseFloat(val); if (bill[i] && !isNaN(v) && v >= 0) bill[i].price = v; renderBill(); calcChange(); if (window.innerWidth > 768) document.getElementById('barcode-input').focus(); }
function changeQty(i, delta) {
            bill[i].qty += delta;
            if (bill[i].qty <= 0) bill.splice(i, 1);
            renderBill();
          }
          function removeFromBill(i) {
            bill.splice(i, 1);
            renderBill();
            if (window.innerWidth > 768) document.getElementById('barcode-input').focus();
          } 

        function cashInputKeydown(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              const barEl = document.getElementById('barcode-input');
              const scanVal = barEl.value.trim();
              if (scanVal) processBarcodeInput(scanVal);
              return;
            }
          }

          // Barcode scanner intercept on cash input
          let cashScanBuffer = '';
          let cashScanTimer = null;
          document.getElementById('cash-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') return; // handled by cashInputKeydown
            // Barcode scanners send chars very fast — buffer them
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
              // If this looks like a digit being typed normally, let it through
              // But if chars arrive faster than 50ms apart, it's a scanner
              clearTimeout(cashScanTimer);
              cashScanTimer = setTimeout(() => { cashScanBuffer = ''; }, 100);
              cashScanBuffer += e.key;
            }
          });

          document.getElementById('cash-input').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (cashScanBuffer.length >= 3) {
                const scanned = cashScanBuffer.trim();
                cashScanBuffer = '';
                clearTimeout(cashScanTimer);
                // Remove the scanned chars that got appended to cash input
                const currentVal = this.value;
                this.value = currentVal.slice(0, currentVal.length - scanned.length);
                calcChange();
                processBarcodeInput(scanned);
              }
              cashScanBuffer = '';
            }
          });

          function processBarcodeInput(val) {
            if (!val) return;
            if (db.products.length === 0) { showToast('⚠ Still loading products, try again...'); return; }
            const prod = db.products.find(p => String(p.barcode||'').trim() === val || String(p.ref||'').trim() === val);
            if (prod && prod.customTrigger) {
              showCustomProductPrompt();
              return;
            }
            if (prod) {
              if (parseInt(prod.stock||0) <= 0) { showToast('⚠ Out of stock: ' + prod.name); return; }
              const inBill = bill.find(b => b.product.ref === prod.ref);
              const qtyInBill = inBill ? inBill.qty : 0;
              if (qtyInBill >= parseInt(prod.stock||0)) { showToast('⚠ Not enough stock: ' + prod.name); return; }
              addToBill(prod);
              showToast(`✓ ${prod.name} added`);
            } else {
              showToast(`⚠ Not found: "${val}"`);
            }
            document.getElementById('barcode-input').value = '';
          }
          function calcChange() {
            const cash = parseFloat(document.getElementById('cash-input').value) || 0;
            const total = bill.reduce((s, b) => s + b.qty * billPrice(b), 0);
            const el = document.getElementById('change-display');
            if (!el) return;
            if (cash === 0 || bill.length === 0) { el.textContent = '—'; el.style.color = 'var(--text3)'; return; }
            const change = cash - total;
            if (change < 0) {
              el.textContent = `Rs. ${Math.abs(change).toFixed(2)} short`;
              el.style.color = 'var(--danger)';
            } else {
              el.textContent = `Change: Rs. ${change.toFixed(2)}`;
              el.style.color = 'var(--accent2)';
            }
          }
          // Start of the current "day" for the Record panel: the last 3:00 AM (Karachi),
          // or the last closing if that is later. Nothing is deleted - older sales are just not shown here.
          function recordsStartISO() {
            const nowK = toKarachi(serverNow());
            let dayStr = todayStr();
            if (nowK.getUTCHours() < 3) dayStr = addDaysToDateStr(dayStr, -1);
            const threeAm = karachiTimeToISO(dayStr, '03:00');
            const ss = getSessionStart();
            return threeAm;
          }

          function openRecords() {
            if (document.getElementById('rec-overlay')) return;
            const start = new Date(recordsStartISO());
            const sales = db.sales.filter(s => new Date(s.time) > start).sort((a, b) => new Date(b.time) - new Date(a.time));
            const total = sales.reduce((a, s) => a + (parseFloat(s.total) || 0), 0);
            const rows = sales.map(s => {
              const t = new Date(s.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });
              const names = (s.items || []).map(i => i.name + ' x' + i.qty).join(', ');
              const cashInfo = (s.cashGiven != null && s.change != null)
                ? `<div style="font-size:.72rem;color:var(--text3);margin-top:2px">Paid Rs. ${Number(s.cashGiven).toFixed(0)} · Change Rs. ${Number(s.change).toFixed(0)}</div>` : '';
              return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between;gap:10px">
                  <div style="min-width:0">
                    <div style="font-family:var(--mono);font-size:.75rem;color:var(--text3)">#${String(s.id).padStart(4, '0')} · ${t} · ${s.payMethod || 'Cash'}</div>
                    <div style="font-size:.82rem;margin-top:2px">${names}</div>
                    ${cashInfo}
                  </div>
                  <div style="font-family:var(--mono);font-weight:700;color:var(--accent2);white-space:nowrap">Rs. ${(parseFloat(s.total) || 0).toFixed(0)}</div>
                </div>
              </div>`;
            }).join('');

            const overlay = document.createElement('div');
            overlay.id = 'rec-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;z-index:9999;display:flex;align-items:flex-end;justify-content:center';
            overlay.innerHTML = `
              <div id="rec-panel" style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px 14px 0 0;width:100%;max-width:700px;max-height:85vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .25s ease;box-shadow:0 -12px 40px #0008">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border2)">
                  <div>
                    <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2)">📋 Today's Sales</div>
                    <div style="font-size:.78rem;color:var(--text3);margin-top:2px">${sales.length} sale${sales.length === 1 ? '' : 's'} · Rs. ${total.toFixed(0)}</div>
                  </div>
                  <button class="btn btn-ghost" id="rec-close">✕ Close</button>
                </div>
                <div style="overflow-y:auto;padding:4px 20px 20px">
                  ${rows || '<div style="color:var(--text3);font-size:.85rem;padding:24px 0;text-align:center">No sales yet today</div>'}
                </div>
              </div>`;
            document.body.appendChild(overlay);
            const close = () => {
              const p = document.getElementById('rec-panel');
              if (p) p.style.transform = 'translateY(100%)';
                          document.removeEventListener('keydown', escClose);
              setTimeout(() => overlay.remove(), 250);
            };
            overlay.querySelector('#rec-close').onclick = close;
            overlay.onclick = e => { if (e.target === overlay) close(); };
            const escClose = e => { if (e.key === 'Escape') close(); };
            document.addEventListener('keydown', escClose);
            requestAnimationFrame(() => requestAnimationFrame(() => {
              const p = document.getElementById('rec-panel');
              if (p) p.style.transform = 'translateY(0)';
            }));
          }

          function clearBill() {
            if (bill.length === 0) return;
            bill = [];
            renderBill();
            document.getElementById('cash-input').value = '';
            calcChange();
            showToast('Bill cleared');
          }

          let _spendings = [];
let _spA = {}, _spB = {}, _spStarted = false;
function spMerge() { const m = {}; Object.values(_spB).forEach(x => { m[x.key] = x; }); Object.values(_spA).forEach(x => { m[x.key] = x; }); _spendings = Object.values(m); if (document.getElementById('sp-overlay')) spRender(); }
function spListen() {
  if (_spStarted || typeof fbdb === 'undefined') return;
  _spStarted = true;
  fbdb.ref('/spendings').on('value', snap => { _spA = snap.val() || {}; spMerge(); }, () => { _spStarted = false; });
  fbdb.ref('/expenses').on('value', snap => { const v = snap.val() || {}; _spB = {}; Object.values(v).forEach(x => { if (x && x.fromSpending) _spB[x.key] = x; }); spMerge(); }, () => {});
}
spListen();
function spendingsSince(startISO) { const st = new Date(startISO); return _spendings.filter(x => new Date(x.createdAt) > st); }
function spEsc(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function spRender() {
  const listEl = document.getElementById('sp-list'), totEl = document.getElementById('sp-total');
  if (!listEl) return;
  const items = spendingsSince(recordsStartISO()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = items.reduce((a, x) => a + (parseFloat(x.amount) || 0), 0);
  totEl.textContent = items.length + ' spending' + (items.length === 1 ? '' : 's') + ' · Rs. ' + total.toFixed(0);
  listEl.innerHTML = items.length ? items.map(x => {
    const t = new Date(x.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });
    return `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div style="min-width:0"><div style="font-size:.85rem">${spEsc(x.name)}</div><div style="font-family:var(--mono);font-size:.72rem;color:var(--text3)">${t}</div></div>
      <div style="display:flex;align-items:center;gap:10px"><div style="font-family:var(--mono);font-weight:700;color:var(--danger);white-space:nowrap">Rs. ${(parseFloat(x.amount) || 0).toFixed(0)}</div>
      <button onclick="deleteSpending('${x.key}')" style="padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid #ef444440;background:#ef444420;color:var(--danger);cursor:pointer">🗑</button></div>
    </div>`;
  }).join('') : '<div style="color:var(--text3);font-size:.85rem;padding:24px 0;text-align:center">No spending yet today</div>';
}

function addSpending() {
  const nameEl = document.getElementById('sp-name'), amtEl = document.getElementById('sp-amount');
  const name = nameEl.value.trim(), amount = parseFloat(amtEl.value);
  if (!name) { showToast('⚠ Enter payment name'); return; }
  if (!(amount > 0)) { showToast('⚠ Enter a valid price'); return; }
  const key = 'exp_' + Date.now();
  const createdAt = serverNow().toISOString();
  fbdb.ref('/spendings/' + key).set({ key, name, amount, createdAt });
  fbdb.ref('/expenses/' + key).set({ key, name, amount, createdAt, fromSpending: true });
  nameEl.value = ''; amtEl.value = '';
  showToast('✓ Spending added: ' + name);
  nameEl.focus();
}

async function deleteSpending(key) {
  const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to delete this spending:');
  if (pwd === null) return;
  const res = await fetch(shopApi('checkwipe'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) });
  const data = await res.json();
  if (!data.ok) { alert('❌ Wrong password!'); return; }
  fbdb.ref('/spendings/' + key).remove();
  fbdb.ref('/expenses/' + key).remove();
  showToast('🗑 Spending deleted');
}

function openSpending() {
if (document.getElementById('sp-overlay')) return;
  spListen();
  const inp = 'background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-size:.9rem;padding:9px 12px;outline:none';
  const overlay = document.createElement('div');
  overlay.id = 'sp-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:#000a;z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  overlay.innerHTML = `
    <div id="sp-panel" style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px 14px 0 0;width:100%;max-width:700px;max-height:85vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .25s ease;box-shadow:0 -12px 40px #0008">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border2)">
        <div>
          <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2)">💸 Today's Spending</div>
          <div id="sp-total" style="font-size:.78rem;color:var(--text3);margin-top:2px"></div>
        </div>
        <button class="btn btn-ghost" id="sp-close">✕ Close</button>
      </div>
      <div style="display:flex;gap:8px;padding:14px 20px 4px;flex-wrap:wrap">
        <input id="sp-name" type="text" placeholder="Payment name (e.g. Home shopping)" style="${inp};flex:2;min-width:160px">
        <input id="sp-amount" type="text" inputmode="decimal" placeholder="Price" oninput="this.value=this.value.replace(/[^0-9.]/g,'')" style="${inp};flex:1;min-width:90px;text-align:right">
        <button class="btn btn-primary" id="sp-add">+ Add</button>
      </div>
      <div id="sp-list" style="overflow-y:auto;padding:4px 20px 20px"></div>
    </div>`;
  document.body.appendChild(overlay);
  spRender();
  const close = () => {
    const p = document.getElementById('sp-panel');
    if (p) p.style.transform = 'translateY(100%)';
    document.removeEventListener('keydown', escClose);
    setTimeout(() => overlay.remove(), 250);
    if (window.innerWidth > 768) document.getElementById('barcode-input').focus();
  };
  const escClose = e => { if (e.key === 'Escape') close(); };
  overlay.querySelector('#sp-close').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };
  overlay.querySelector('#sp-add').onclick = addSpending;
  overlay.querySelector('#sp-amount').addEventListener('keydown', e => { if (e.key === 'Enter') addSpending(); });
  overlay.querySelector('#sp-name').addEventListener('keydown', e => { if (e.key === 'Enter') overlay.querySelector('#sp-amount').focus(); });
  document.addEventListener('keydown', escClose);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const p = document.getElementById('sp-panel');
    if (p) p.style.transform = 'translateY(0)';
    const n = document.getElementById('sp-name'); if (n) n.focus();
  }));
}

// _serverTimeOffset moved to top

          function syncServerTime() {
        fbdb.ref('.info/serverTimeOffset').on('value', snapshot => {
          _serverTimeOffset = snapshot.val() || 0;
          _serverTimeSynced = true;
        });
      }

          function getServerTime() {
            return new Date(Date.now() + _serverTimeOffset).toISOString();
          }

          function getTrueServerTime() {
            return new Promise((resolve) => {
              const tsRef = fbdb.ref('serverTimeCheck/' + Math.random().toString(36).slice(2));
              let settled = false;
              const timeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                tsRef.remove();
                resolve(new Date(Date.now() + _serverTimeOffset).toISOString());
              }, 4000);
              tsRef.set(firebase.database.ServerValue.TIMESTAMP).then(() => {
                tsRef.once('value').then(snap => {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timeout);
                  const epoch = snap.val();
                  tsRef.remove();
                  resolve(new Date(epoch).toISOString());
                });
              }).catch(() => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                resolve(new Date(Date.now() + _serverTimeOffset).toISOString());
              });
            });
          }

          function serverNow() {
            return new Date(Date.now() + _serverTimeOffset);
          }

          async function checkout() {
            if (checkoutInProgress) return;
            if (bill.length === 0) { showToast('⚠ Nothing in bill'); return; }
            if (!_serverTimeSynced) { showToast('⏳ Still syncing time — try checkout again in a second'); return; }

            // Cash sales: the amount the customer paid must be entered, and must cover the total.
            const _billTotal = bill.reduce((s, b) => s + b.qty * billPrice(b), 0);
            const _cashGiven = parseFloat(document.getElementById('cash-input').value) || 0;
            if (selectedPayMethod === 'Cash') {
              if (_cashGiven <= 0) { showToast('⚠ Enter the amount the customer paid'); document.getElementById('cash-input').focus(); return; }
              if (_cashGiven + 0.005 < _billTotal) { showToast('⚠ Customer paid less than the total'); document.getElementById('cash-input').focus(); return; }
            }

            checkoutInProgress = true;
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) checkoutBtn.disabled = true;

            // Snapshot + clear the bill IMMEDIATELY, synchronously — before any await.
            // This is the fix: nothing can mutate `bill` in between anymore.
            const billSnapshot = bill.map(b => ({ product: b.product, qty: b.qty, price: b.price }));
            document.getElementById('cash-input').value = '';
            calcChange();
            const total = billSnapshot.reduce((s, b) => s + b.qty * billPrice(b), 0);
            const items = billSnapshot.map(b => { const orig = parseFloat(b.product.sellPrice), given = billPrice(b); return { name: b.product.name, ref: b.product.ref, qty: b.qty, price: given, ...(given !== orig ? { origPrice: orig, edited: true } : {}) }; });
            bill = [];
            renderBill();

            try {
              const serverTime = await getTrueServerTime();
              const sale = {
                id: db.nextSaleId++,
                items,
                total,
                payMethod: selectedPayMethod,
                cashGiven: selectedPayMethod === 'Cash' ? _cashGiven : null,
                change: selectedPayMethod === 'Cash' ? Math.round((_cashGiven - total) * 100) / 100 : null,
                time: serverTime
              };
              items.forEach(item => {
                const p = db.products.find(x => x.ref === item.ref);
                if (p) {
                  p.stock = Math.max(0, (parseInt(p.stock)||0) - item.qty);
                  fbdb.ref('/products/' + p.ref + '/stock').set(p.stock);
                }
              });
              saveSale(sale);
              saveDB();
              showToast(`✓ Checkout done — Rs. ${total.toFixed(2)}`);
              sendSaleNotification(total, sale.items.length);
              updateDashboard();
              selectPayMethod('Cash');
            } finally {
              checkoutInProgress = false;
              if (checkoutBtn) checkoutBtn.disabled = false;
              document.getElementById('barcode-input').focus();
            }
          }

          function printReceipt() {
            if (bill.length === 0) { showToast('⚠ Nothing in bill'); return; }
            const now = serverNow();
            const dateStr = now.toLocaleDateString('en-PK');
            const timeStr = now.toLocaleTimeString('en-PK', {hour:'2-digit',minute:'2-digit'});
            let rows = '';
            let total = 0;
            bill.forEach(b => {
const line = b.qty * billPrice(b);
              total += line;
              const name = b.product.name.substring(0,18).padEnd(18);
              const qty = `x${b.qty}`.padStart(3);
              const amt = `Rs.${line.toFixed(2)}`.padStart(10);
              rows += `<div>${name}${qty}${amt}</div>`;
            });
            const html = `
              <div class="receipt-title">🛍 SHOP RECEIPT</div>
              <div class="receipt-sub">Thank you for shopping with us!</div>
              <hr class="receipt-hr">
              <div style="font-size:11px;color:#555">${dateStr} ${timeStr}</div>
              <hr class="receipt-hr">
              <div style="font-family:monospace;font-size:12px">${rows}</div>
              <hr class="receipt-hr">
              <div class="receipt-row"><span>TOTAL</span><span><b>Rs. ${total.toFixed(2)}</b></span></div>
              <hr class="receipt-hr">
              <div style="text-align:center;font-size:11px;margin-top:8px">ShopOS — Powered by your team</div>
            `;
            document.getElementById('receipt-content').innerHTML = html;
            document.getElementById('receipt-modal').classList.add('open');
          }

          function closeModal() { document.getElementById('receipt-modal').classList.remove('open'); }
          function doPrint() { window.print(); }
