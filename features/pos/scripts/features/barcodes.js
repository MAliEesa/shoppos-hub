          // ══════════════════════════════════════
          // BARCODE PRINTING
          // ══════════════════════════════════════
          let bcMultiQueue = [];
          let bcPrintMode = 'columns';
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

          function generateBarcodeSVG(code) {
            // returns an SVG string with a real CODE128 barcode using JsBarcode
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            try {
              JsBarcode(svg, code, {
                format: 'CODE128',
                displayValue: false,
                margin: 0,
                width: 2,
                height: 40,
                background: '#ffffff'
              });
            } catch(e) {
              // fallback text if barcode invalid
              return `<text x="10" y="25" font-size="10" fill="red">Invalid</text>`;
            }
            return svg.outerHTML;
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

              items.forEach(({ product: p, qty }) => {
                if (bcPrintMode === 'columns') {
                  const rows = Math.ceil(qty / 3);
                  for (let i = 0; i < rows; i++) {
                    const l1 = i * 3 + 1 <= qty ? c1(p) : '';
                    const l2 = i * 3 + 2 <= qty ? c2(p) : '';
                    const l3 = i * 3 + 3 <= qty ? c3(p) : '';
                    allZPL += `^XA^PW720^LL152${l1}${l2}${l3}^XZ`;
                  }
                } else {
                  // Rows mode — each qty = 1 full row of 3
                  for (let i = 0; i < qty; i++) {
                    allZPL += `^XA^PW720^LL152${c1(p)}${c2(p)}${c3(p)}^XZ`;
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
