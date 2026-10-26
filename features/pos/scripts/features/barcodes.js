          // ══════════════════════════════════════
          // BARCODE PRINTING
          // ══════════════════════════════════════
          let bcMultiQueue = [];
let bcPrintMode = 'columns';
          let bcLabelSystem = parseInt(localStorage.getItem('bcLabelSystem')) || 3;

          function setLabelSystem(n) {
            bcLabelSystem = n;
            localStorage.setItem('bcLabelSystem', n);
            bcRefreshLabelButtons();
          }

          function bcRefreshLabelButtons() {
            [1, 2, 3].forEach(k => {
              const el = document.getElementById('ls-' + k);
              if (!el) return;
              el.style.background = bcLabelSystem === k ? 'var(--accent)' : 'transparent';
              el.style.color = bcLabelSystem === k ? '#fff' : 'var(--text2)';
            });
          }
          let bcPrintHistory = [];

          function bcLoadHistory() {
            fbdb.ref('/printHistory').orderByKey().limitToLast(50).once('value').then(snap => {
              const data = snap.val();
              bcPrintHistory = data ? Object.values(data).reverse() : [];
              bcRenderHistory();
            });
          }

          function bcAddHistory(items, mode) {
            const entry = {
              time: serverNow().toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit'}),
              date: serverNow().toLocaleDateString('en-PK', {day:'2-digit', month:'short'}),
              ts: Date.now() + _serverTimeOffset,
              mode: mode,
              items: items.map(({product: p, qty}) => ({ name: p.name, ref: p.ref, price: p.sellPrice, qty }))
            };
            fbdb.ref('/printHistory/' + entry.ts).set(entry);
            bcPrintHistory.unshift(entry);
            bcRenderHistory();
          }

          function bcRenderHistory() {
            const el = document.getElementById('bc-history');
            if (!el) return;
            if (bcPrintHistory.length === 0) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">No prints yet this session</div>';
              return;
            }
            el.innerHTML = bcPrintHistory.map((entry, i) => `
              <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg4);border-bottom:1px solid var(--border)">
                  <span style="font-family:var(--mono);font-size:.78rem;color:var(--accent);font-weight:700">Print ${bcPrintHistory.length - i}</span>
                  <span style="font-size:.75rem;color:var(--text3)">${entry.date} — ${entry.time}</span>
                  <span style="font-size:.72rem;padding:2px 8px;border-radius:20px;background:var(--bg2);border:1px solid var(--border2);color:var(--text3)">${entry.mode === 'columns' ? '3-Column Print' : 'Row Print'}</span>
                </div>
                <div style="padding:8px 12px;display:flex;flex-direction:column;gap:4px">
                  ${entry.items.map(item => `
                    <div style="display:flex;justify-content:space-between;font-size:.8rem">
                      <span style="color:var(--text2)">${item.name}</span>
                      <span style="font-family:var(--mono);color:var(--accent3)">Rs. ${item.price}</span>
                      <span style="font-family:var(--mono);color:var(--accent2);font-weight:700">${item.qty} labels</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('');
          }

          function setPrintMode(mode) {
            bcPrintMode = mode;
            ['mode-col-single','mode-col-multi'].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.style.background = mode === 'columns' ? 'var(--accent)' : 'transparent';
              if (el) el.style.color = mode === 'columns' ? '#fff' : 'var(--text2)';
            });
            ['mode-row-single','mode-row-multi'].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.style.background = mode === 'rows' ? 'var(--accent)' : 'transparent';
              if (el) el.style.color = mode === 'rows' ? '#fff' : 'var(--text2)';
            });
          }

function bcPopulateSelects() {
            bcRefreshLabelButtons();
            const withStock = db.products.filter(p => parseInt(p.stock||0) > 0 || p.customTrigger)
              .map(p => `<option value="${p.ref}">${p.ref} — ${p.name} ${p.customTrigger ? '(custom trigger)' : '('+p.stock+' in stock)'}</option>`).join('');
            const noStock = db.products.filter(p => parseInt(p.stock||0) <= 0 && !p.customTrigger)
              .map(p => `<option value="${p.ref}" disabled style="color:#666">${p.ref} — ${p.name} (no stock)</option>`).join('');
            const all = '<option value="">— Select product —</option>' + withStock + noStock;
            const s1 = document.getElementById('bc-single-select');
            const s2 = document.getElementById('bc-multi-select');
            if(s1) s1.innerHTML = all;
            if(s2) s2.innerHTML = all;
          }

          function bcSingleLoad() {
            const ref = document.getElementById('bc-single-select').value;
            if (!ref) return;
            const p = db.products.find(x => x.ref === ref);
            document.getElementById('bc-single-qty').value = p ? p.stock : 0;
            document.getElementById('bc-single-barcode').value = p ? p.barcode : '';
          }

          function bcSinglePrint() {
            const ref = document.getElementById('bc-single-select').value;
            const qty = parseInt(document.getElementById('bc-single-qty').value) || 0;
            if (!ref) { showToast('⚠ Select a product'); return; }
            if (qty <= 0 && !db.products.find(x=>x.ref===ref)?.customTrigger) { showToast('⚠ Stock is zero — cannot print'); return; }
            const p = db.products.find(x => x.ref === ref);
            bcDoPrint([{ product: p, qty }]);
            bcAddHistory([{ product: p, qty }], bcPrintMode);
          }

          function bcMultiAdd() {
            const ref = document.getElementById('bc-multi-select').value;
            if (!ref) { showToast('⚠ Select a product'); return; }
            if (bcMultiQueue.find(x => x.ref === ref)) { showToast('Already in queue'); return; }
            const p = db.products.find(x => x.ref === ref);
            if (parseInt(p.stock||0) <= 0 && !p.customTrigger) { showToast('⚠ No stock for: ' + p.name); return; }
            bcMultiQueue.push({ ref, name: p.name, barcode: p.barcode, qty: parseInt(p.stock) });
            bcRenderQueue();
          }

          function bcRenderQueue() {
            const el = document.getElementById('bc-multi-queue');
            if (!el) return;
            if (bcMultiQueue.length === 0) { el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">Queue is empty</div>'; return; }
            el.innerHTML = bcMultiQueue.map((item, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--bg3);border-radius:var(--radius2);border:1px solid var(--border)">
                <span style="font-family:var(--mono);font-size:.8rem;color:var(--accent);flex:0 0 60px">${item.ref}</span>
                <span style="flex:1;font-size:.85rem">${item.name}</span>
                <span style="font-family:var(--mono);font-size:.8rem;color:var(--text3)">Barcode: ${item.barcode}</span>
                <input type="number" value="${item.qty}" min="1" style="width:70px;background:var(--bg2);border:1px solid var(--border2);border-radius:4px;color:var(--text);padding:4px 8px;font-size:.82rem" onchange="bcMultiQueue[${i}].qty=parseInt(this.value)||1">
                <span style="font-size:.75rem;color:var(--text3)">labels</span>
                <button class="del-btn" onclick="bcMultiQueue.splice(${i},1);bcRenderQueue()">✕</button>
              </div>
            `).join('');
          }

          function bcMultiClear() { bcMultiQueue = []; bcRenderQueue(); }

          function bcMultiPrint() {
            if (bcMultiQueue.length === 0) { showToast('⚠ Queue is empty'); return; }
            const items = bcMultiQueue.map(q => ({ product: db.products.find(p => p.ref === q.ref), qty: q.qty }));
            bcDoPrint(items);
            bcAddHistory(items, bcPrintMode);
          }


          async function bcDoPrint(items) {
            try {
              const printerData = {
                deviceType: 'printer',
                uid: '28j182303493',
                provider: 'com.zebra.ds.webdriver.desktop.provider.DefaultDeviceProvider',
                name: '28j182303493',
                connection: 'usb',
                version: 5,
                manufacturer: 'Zebra Technologies'
              };

              // Build ZPL for all labels
              let allZPL = '^XA^PON^PMN^LH0,0^XZ';
              const label = (x, bx) => (p) => `^FO${x},10^FB230,1,0,C,0^ADN,18,10^FD${p.ref}^FS^FO${bx},32^BCN,88,N,N,N^FD${p.barcode}^FS^FO${x},128^FB230,1,0,C,0^ADN,18,10^FD${p.customTrigger ? '---' : 'Rs. ' + Math.round(p.sellPrice)}^FS`;
              const c1 = label(5, 30);
              const c2 = label(245, 270);
const c3 = label(500, 525);

              // 2-label roll tuning (dots, 8 dots = 1mm)
              const L2 = { leftDx: 4, leftDy: 52, rightDx: 72, rightDy: 52 };
              const label2 = (x, bx, dy) => (p) => `^FO${x},${10 + dy}^FB230,1,0,C,0^ADN,18,10^FD${p.ref}^FS^FO${bx},${32 + dy}^BCN,88,N,N,N^FD${p.barcode}^FS^FO${x},${128 + dy}^FB230,1,0,C,0^ADN,18,10^FD${p.customTrigger ? '---' : 'Rs. ' + Math.round(p.sellPrice)}^FS`;
              // 2-label roll layout (dots, 8 dots = 1mm).
              // Each block is 3.7 x 2.7 cm (296 x 216 dots); content stays 1mm inside it.
              const L2X = {
                leftCx: 166,    // horizontal centre of the LEFT block  (+8 = 1mm to the right)
                rightCx: 502,   // horizontal centre of the RIGHT block (+8 = 1mm to the right)
                leftDy: 0,      // LEFT block up/down  (+8 = 1mm down, -8 = 1mm up)
                rightDy: 0,     // RIGHT block up/down (+8 = 1mm down, -8 = 1mm up)
                top: 12,        // where the content starts inside the block
                maxW: 288,      // widest the barcode may be (block width minus 1mm each side)
                maxModule: 3,   // thickest bar width in dots
                barH: 96        // barcode height in dots
              };
              const label2x = (cx, dy) => (p) => {
                const data = String(p.barcode);
                const modules = 35 + 11 * data.length;
                const mw = Math.max(1, Math.min(L2X.maxModule, Math.floor(L2X.maxW / modules)));
                const bw = modules * mw;
                const bx = Math.round(cx - bw / 2);
                const tx = Math.round(cx - 130);
                const y = L2X.top + dy;
                const price = p.customTrigger ? '---' : 'Rs. ' + Math.round(p.sellPrice);
                return `^FO${tx},${y}^FB260,1,0,C,0^ADN,36,20^FD${p.ref}^FS` +
                       `^BY${mw}^FO${bx},${y + 42}^BCN,${L2X.barH},N,N,N^FD${p.barcode}^FS^BY2` +
                       `^FO${tx},${y + 42 + L2X.barH + 8}^FB260,1,0,C,0^ADN,36,20^FD${price}^FS`;
              };
              // 1-label roll tuning: dx = move right, dy = move down
              const L1 = { dx: 72, dy: 40 };
              let cols;
              if (bcLabelSystem === 2) {
                cols = [label2x(L2X.leftCx, L2X.leftDy), label2x(L2X.rightCx, L2X.rightDy)];
              } else {
                cols = bcLabelSystem === 1
                  ? [label2(5 + L1.dx, 30 + L1.dx, L1.dy)]
                  : [c1, c2, c3];
              }
              const n = cols.length;
              const pw = n === 3 ? 720 : (n === 2 ? 640 : 320);
              const ll = n === 3 ? '^LL152' : '';

              items.forEach(({ product: p, qty }) => {
                if (bcPrintMode === 'columns' && n > 1) {
                  const rows = Math.ceil(qty / n);
                  for (let i = 0; i < rows; i++) {
                    let row = '';
                    for (let c = 0; c < n; c++) {
                      if (i * n + c + 1 <= qty) row += cols[c](p);
                    }
                    allZPL += `^XA^PW${pw}${ll}${row}^XZ`;
                  }
                } else {
                  // Rows mode (or 1-label roll): each qty = 1 full row
                  for (let i = 0; i < qty; i++) {
                    allZPL += `^XA^PW${pw}${ll}${cols.map(f => f(p)).join('')}^XZ`;
                  }
                }
              });

              // Send to printer
              const sendRes = await fetch('http://localhost:9100/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  device: {
                    deviceType: 'printer',
                    uid: '28j182303493',
                    provider: 'com.zebra.ds.webdriver.desktop.provider.DefaultDeviceProvider',
                    name: '28j182303493',
                    connection: 'usb',
                    version: 5,
                    manufacturer: 'Zebra Technologies'
                  },
                  data: allZPL
                })
              });
              const result = await sendRes.text();
              console.log('Print result:', result);

              if (result === '' || result === '{}') {
                showToast(`✅ Printing labels!`);
              } else {
                showToast('⚠ Printer error: ' + result);
                console.error('ZPL error:', result);
              }
            } catch (err) {
              showToast('⚠ BrowserPrint error — is it running in system tray?');
              console.error(err);
            }
          }
