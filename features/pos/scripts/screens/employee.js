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
              filtered = filtered.filter(p => String(Math.round(parseFloat(p.sellPrice))) === String(Math.round(parseFloat(priceSearchVal))));
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
              card.innerHTML = `${imgHtml}<div class="prod-card-name">${p.name}</div><div class="prod-card-price">${p.customTrigger ? '---' : 'Rs. ' + parseFloat(p.sellPrice).toFixed(2)}</div>`;
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
              const rowTotal = b.qty * parseFloat(b.product.sellPrice);
              totalQty += b.qty;
              totalAmt += rowTotal;
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td style="color:var(--text3);font-family:var(--mono);font-size:.78rem">${i+1}</td>
                <td><div class="item-name">${b.product.name}</div><div class="item-price">${b.product.ref}</div></td>
                <td class="item-price">Rs. ${parseFloat(b.product.sellPrice).toFixed(2)}</td>
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
            const total = bill.reduce((s, b) => s + b.qty * parseFloat(b.product.sellPrice), 0);
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
          function clearBill() {
            if (bill.length === 0) return;
            bill = [];
            renderBill();
            document.getElementById('cash-input').value = '';
            calcChange();
            showToast('Bill cleared');
          }

          async function empCloseOfDay() {
        const sessionStart = new Date(getSessionStart());
        const sessionSales = db.sales.filter(s => new Date(s.time) > sessionStart);
        const sessionTotal = sessionSales.reduce((s, sale) => s + sale.total, 0);
        if (!confirm(`Close current session?\nTotal: Rs. ${sessionTotal.toFixed(0)}\nTransactions: ${sessionSales.length}`)) return;
        const closedAt = await getTrueServerTime();
        const todayKey = localDate(getSessionStart());
        _sessionStartISO = closedAt;
        await fbdb.ref('/sessionStart').set(closedAt);
        await fbdb.ref('/closings/' + todayKey).set({
          date: todayKey,
          total: sessionTotal,
          transactions: sessionSales.length,
          closedAt: closedAt
        });
        showToast(`✓ Session closed — Rs. ${sessionTotal.toFixed(0)}`);
        updateDashboard();
        renderCOD();
        renderRevenueSummary();
        if (revFilter === 'weeks') renderWeeklyRevenue();
        else if (revFilter === 'days') renderDailyRevenue();
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

            checkoutInProgress = true;
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) checkoutBtn.disabled = true;

            // Snapshot + clear the bill IMMEDIATELY, synchronously — before any await.
            // This is the fix: nothing can mutate `bill` in between anymore.
            const billSnapshot = bill.map(b => ({ product: b.product, qty: b.qty }));
            const total = billSnapshot.reduce((s, b) => s + b.qty * parseFloat(b.product.sellPrice), 0);
            const items = billSnapshot.map(b => ({ name: b.product.name, ref: b.product.ref, qty: b.qty, price: parseFloat(b.product.sellPrice) }));
            bill = [];
            renderBill();

            try {
              const serverTime = await getTrueServerTime();
              const sale = {
                id: db.nextSaleId++,
                items,
                total,
                payMethod: selectedPayMethod,
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
              const line = b.qty * parseFloat(b.product.sellPrice);
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
