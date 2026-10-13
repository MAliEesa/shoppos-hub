          // ══════════════════════════════════════
          // ANALYTICS
          // ══════════════════════════════════════
          let chartFilter = 'all';
          function setChartFilter(f, btn) {
            chartFilter = f;
            ['cf-today','cf-week','cf-month','cf-all'].forEach(id => {
              const el = document.getElementById(id);
              if (!el) return;
              el.style.background = 'transparent';
              el.style.color = 'var(--text2)';
            });
            if (btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; }
            const labels = { today:'Today\'s top sellers', week:'This week\'s top sellers', month:'This month\'s top sellers', all:'All time top sellers' };
            const lbl = document.getElementById('chart-filter-label');
            if (lbl) lbl.textContent = labels[f];
            renderTopProductsChart();
          }

          function renderTopProductsChart() {
            const el = document.getElementById('analytics-bar-chart');
            if (!el) return;
            if (privacyMode) { el.innerHTML = '<div style="color:var(--text3);font-size:.83rem;padding:8px 0">Privacy mode is on — chart hidden.</div>'; return; }

            const now = serverNow();
            const startOfWeek = new Date(Date.UTC(kY(now), kM(now), kD(now) - kDay(now)));
            const startOfMonth = new Date(Date.UTC(kY(now), kM(now), 1));
            if (startOfWeek < startOfMonth) startOfWeek.setTime(startOfMonth.getTime());
            const weekAgo = startOfWeek;
            const filteredSales = db.sales.filter(s => {
              if (chartFilter === 'today') return new Date(s.time) > new Date(getSessionStart());
              if (chartFilter === 'week') return toKarachi(s.time) >= weekAgo;
              if (chartFilter === 'month') return kM(s.time)===kM(now) && kY(s.time)===kY(now);
              return true;
            });

            const salesMap = {};
            filteredSales.forEach(sale => {
              sale.items.forEach(item => {
                salesMap[item.ref] = (salesMap[item.ref] || 0) + item.qty;
              });
            });

            if (Object.keys(salesMap).length === 0) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.83rem;padding:8px 0">No sales data yet.</div>';
              return;
            }

            const sorted = Object.entries(salesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const max = sorted[0][1];
            const colors = ['#22c55e', '#f97316', '#eab308', '#3b82f6', '#92400e'];
            const chartH = 80;
            const barW = 16;
            const gap = 20;
            const paddingLeft = 28;
            const paddingBottom = 26;
            const totalW = paddingLeft + 5 * (barW + gap) + gap;
            const ySteps = 5;
            const displayMax = Math.max(max, 5);
            const stepVal = Math.ceil(displayMax / ySteps);

            let barsHTML = '';
            sorted.forEach(([ref, qty], i) => {
              const p = db.products.find(x => x.ref === ref);
              const name = p ? p.name.substring(0, 8) : ref.substring(0, 8);
              const barH = Math.round((qty / displayMax) * chartH);
              const x = paddingLeft + gap + i * (barW + gap);
              const y = chartH - barH;
              const color = colors[i];
              barsHTML += `
                <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" rx="4"/>
                <text x="${x + barW/2}" y="${y - 4}" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${qty}</text>
                <text x="${x + barW/2}" y="${chartH + 12}" text-anchor="middle" font-size="8" fill="#8b93b0">${ref.startsWith('CUSTOM-') ? 'CUSTOM' : ref}</text>
                <text x="${x + barW/2}" y="${chartH + 22}" text-anchor="middle" font-size="7" fill="#5a6180">${name}</text>  
              `;
            });

            let gridHTML = '';
            for (let s = 0; s <= ySteps; s++) {
              const val = s * stepVal;
              const y = chartH - Math.round((val / displayMax) * chartH);
              gridHTML += `
                <line x1="${paddingLeft}" y1="${y}" x2="${totalW}" y2="${y}" stroke="#2a2f45" stroke-width="1"/>
                <text x="${paddingLeft - 4}" y="${y + 4}" text-anchor="end" font-size="8" fill="#5a6180">${val}</text>  
              `;
            }

            el.innerHTML = `
              <svg viewBox="0 0 ${totalW + 10} ${chartH + paddingBottom + 10}" style="width:100%;max-width:360px;height:auto;overflow:visible;display:block;margin:0 auto">
                ${gridHTML}
                <line x1="${paddingLeft}" y1="0" x2="${paddingLeft}" y2="${chartH}" stroke="#353d5c" stroke-width="2"/>
                <line x1="${paddingLeft}" y1="${chartH}" x2="${totalW}" y2="${chartH}" stroke="#353d5c" stroke-width="2"/>
                ${barsHTML}
              </svg>
              <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px">
                ${sorted.map(([ref,qty],i) => {
                  const p = db.products.find(x => x.ref === ref);
                  return `<div style="display:flex;align-items:center;gap:6px">
                    <div style="width:10px;height:10px;border-radius:2px;background:${colors[i]};flex-shrink:0"></div>
                    <span style="font-size:.75rem;color:var(--text2)">${p ? (p.name.length > 12 ? p.name.substring(0, 12) + '…' : p.name) : (ref.startsWith('CUSTOM-') ? 'Custom' : ref)}</span>
                  </div>`;
                }).join('')}
              </div>
            `;
          }

          let pmFilter = 'today';
          function setPmFilter(f, btn) {
            pmFilter = f;
            ['pm-today','pm-week','pm-month','pm-all'].forEach(id => {
              const el = document.getElementById(id);
              if (!el) return;
              el.style.background = 'transparent';
              el.style.color = 'var(--text2)';
            });
            if (btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; }
            renderPaymentBreakdown();
          }

          function _pmFilterSales(filter) {
            const now = serverNow();
            if (filter === 'today') return db.sales.filter(s => new Date(s.time) > new Date(getSessionStart()));
            if (filter === 'week') { const weekAgo = new Date(now.getTime() - 7*24*60*60*1000); return db.sales.filter(s => new Date(s.time) >= weekAgo); }
            if (filter === 'month') return db.sales.filter(s => kM(s.time) === kM(now) && kY(s.time) === kY(now));
            return db.sales;
          }

          function renderPaymentBreakdown() {
            const el = document.getElementById('pm-breakdown-grid');
            if (!el) return;
            const sales = _pmFilterSales(pmFilter);
            const methods = ['Cash', 'Easypaisa', 'JazzCash', 'Card', 'Bank Transfer'];
            const icons = { Cash:'💵', Easypaisa:'📱', JazzCash:'📱', Card:'💳', 'Bank Transfer':'🏦' };
            const totals = {};
            methods.forEach(m => totals[m] = 0);
            sales.forEach(s => {
              const m = s.payMethod || 'Cash';
              totals[m] = (totals[m] || 0) + s.total;
            });
            el.innerHTML = methods.map(m => `
              <div class="pm-card">
                <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${icons[m]} ${m}</div>
                <div style="font-family:var(--mono);font-size:1.15rem;font-weight:700;color:var(--accent2)">${privacyMode ? 'Rs. ---' : 'Rs. ' + totals[m].toFixed(0)}</div>
              </div>
            `).join('');
          }

          function anPopulateSelect(filter = '') {
            const sel = document.getElementById('an-prod-select');
            if (!sel) return;
            const filtered = filter
              ? db.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.ref.includes(filter))
              : db.products;
            sel.innerHTML = filtered.length === 0
              ? '<option value="">No match</option>'
              : filtered.map(p => `<option value="${p.ref}">${p.ref} — ${p.name}</option>`).join('');
          }

          function anFilterProducts() {
            const val = document.getElementById('an-prod-search').value.trim();
            anPopulateSelect(val);
          }

          function anRun() {
            const ref = document.getElementById('an-prod-select').value;
            const range = document.getElementById('an-range').value;
            const el = document.getElementById('an-result');
            if (!ref) { showToast('⚠ Select a product'); return; }

            const p = db.products.find(x => x.ref === ref);
            const now = serverNow();

            let filteredSales = db.sales.filter(sale => {
              const hasItem = sale.items.some(i => i.ref === ref);
              if (!hasItem) return false;
              if (range === 'day') return localDate(sale.time) === localDate(now);
              if (range === 'week') { const w = new Date(now.getTime() - 7*24*60*60*1000); return new Date(sale.time) >= w; }
              if (range === 'month') return kM(sale.time) === kM(now) && kY(sale.time) === kY(now);
              return true; // all
            });

            if (filteredSales.length === 0) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.83rem;padding:8px 0">No sales found for this product in the selected range.</div>';
              return;
            }

            let totalQty = 0, totalRevenue = 0;
            const rows = filteredSales.map(sale => {
              const item = sale.items.find(i => i.ref === ref);
              totalQty += item.qty;
              totalRevenue += item.qty * item.price;
              const t = new Date(sale.time).toLocaleString('en-PK', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Karachi'});
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg3);border-radius:var(--radius2);border:1px solid var(--border)">
                <div style="font-family:var(--mono);font-size:.75rem;color:var(--text3)">#${String(sale.id).padStart(4,'0')}</div>
                <div style="font-size:.83rem;">${t}</div>
                <div style="font-family:var(--mono);font-size:.82rem;color:var(--accent)">x${item.qty}</div>
                <div style="font-family:var(--mono);font-size:.82rem;color:var(--accent2);font-weight:700">Rs. ${(item.qty * item.price).toFixed(2)}</div>
              </div>`;
            }).join('');

            el.innerHTML = privacyMode ? `
              <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:10px 18px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Units Sold</div>
                  <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--accent)">---</div>
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:10px 18px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Total Revenue</div>
                  <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--accent2)">Rs. ---</div>
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:10px 18px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Transactions</div>
                  <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--accent3)">---</div>
                </div>
              </div>
              <div style="color:var(--text3);font-size:.83rem">Privacy mode is on — details hidden.</div>
            ` : `
              <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:10px 18px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Units Sold</div>
                  <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--accent)">${totalQty}</div>
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:10px 18px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Total Revenue</div>
                  <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--accent2)">Rs. ${totalRevenue.toFixed(2)}</div>
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:10px 18px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Transactions</div>
                  <div style="font-family:var(--mono);font-size:1.4rem;font-weight:700;color:var(--accent3)">${filteredSales.length}</div>
                </div>
              </div>
              ${rows}
            `;
          }
