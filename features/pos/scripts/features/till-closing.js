          // ══════════════════════════════════════
          // CLOSING CHECK (employee) — checks typed money against sales, saves nothing
          // ══════════════════════════════════════
          const TC_SLOTS = [
            { key: 'cash', label: 'Cash', icon: '💵' },
            { key: 'card', label: 'Card', icon: '💳' },
            { key: 'easypaisa', label: 'Easypaisa', icon: '📱' },
            { key: 'jazzcash', label: 'JazzCash', icon: '📱' },
            { key: 'bank', label: 'Bank', icon: '🏦' }
          ];

          function tcSlotOf(method) {
            if (method === 'Card') return 'card';
            if (method === 'Easypaisa') return 'easypaisa';
            if (method === 'JazzCash') return 'jazzcash';
            if (method === 'Bank Transfer') return 'bank';
            return 'cash';
          }

          function tcRound(n) { return Math.round((Number(n) || 0) * 100) / 100; }
          function tcMoney(n) { n = tcRound(n); return 'Rs. ' + (Number.isInteger(n) ? n : n.toFixed(2)); }

          // Same period as the "Today" filter in the Sales tab
          function tcSalesSince(startISO) {
            const start = new Date(startISO);
            const out = { cash: 0, card: 0, easypaisa: 0, jazzcash: 0, bank: 0 };
            db.sales.forEach(s => {
              if (new Date(s.time) > start) out[tcSlotOf(s.payMethod)] += parseFloat(s.total) || 0;
            });
            return out;
          }

          function tcDiffText(diff) {
            if (diff === 0) return '✓ Matched';
            return diff < 0 ? tcMoney(-diff) + ' LESS' : tcMoney(diff) + ' MORE';
          }

          function tcDiffColor(diff) {
            return diff === 0 ? 'var(--accent2)' : (diff < 0 ? 'var(--danger)' : 'var(--accent3)');
          }

          function openTillClosing() {
            if (document.getElementById('tc-overlay')) return;
                        const periodStart = karachiTimeToISO(todayStr(), '00:00');
            const vals = { opening: '', counted: {} };

            const overlay = document.createElement('div');
            overlay.id = 'tc-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999;padding:12px';
            document.body.appendChild(overlay);

            const boxStyle = 'background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:22px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px #0008';
            const inputStyle = 'width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-family:var(--mono);font-size:.9rem;padding:9px 6px;outline:none;text-align:right';
            const secStyle = 'font-size:.75rem;font-weight:600;color:var(--accent);margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em';

            function showForm() {
              const methodBoxes = '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px">' + TC_SLOTS.map(s => `
                <div>
                  <div style="font-size:.68rem;color:var(--text3);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.icon} ${s.label}</div>
                  <input type="number" min="0" step="any" inputmode="decimal" data-k="${s.key}" value="${vals.counted[s.key] != null ? vals.counted[s.key] : ''}" placeholder="0" style="${inputStyle}">
                </div>`).join('') + '</div>';
              overlay.innerHTML = `
                <div style="${boxStyle}">
<style>#tc-overlay input::-webkit-outer-spin-button,#tc-overlay input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}#tc-overlay input[type=number]{-moz-appearance:textfield}</style>
                  <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2);margin-bottom:4px">🔒 Closing</div>
                  <div style="font-size:.78rem;color:var(--text3);margin-bottom:18px">Opening money is required. Leave a box empty if that method had no money, then press Continue.</div>

                  <div style="${secStyle}">Opening money</div>
                  <div style="font-size:.72rem;color:var(--text3);margin-bottom:6px">Money that was in the box when the shop opened</div>
                  <input type="number" min="0" step="any" inputmode="decimal" id="tc-opening" value="${vals.opening}" placeholder="0" style="${inputStyle}">

                  <div style="${secStyle};margin-top:20px">Money collected</div>
                  <div style="font-size:.72rem;color:var(--text3);margin-bottom:6px">Cash = all the cash in the box (opening money included)</div>
                  ${methodBoxes}

                  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px">
                    <button class="btn btn-ghost" id="tc-cancel">Cancel</button>
                    <button class="btn btn-primary" id="tc-continue">Continue</button>
                  </div>
                </div>`;
              overlay.querySelector('#tc-cancel').onclick = () => overlay.remove();
              overlay.querySelector('#tc-continue').onclick = onContinue;
            }

            function onContinue() {
              vals.opening = overlay.querySelector('#tc-opening').value.trim();
              TC_SLOTS.forEach(s => { vals.counted[s.key] = overlay.querySelector(`input[data-k="${s.key}"]`).value.trim(); });
              // Only opening money is required. An empty method box counts as 0.
              if (vals.opening === '' || !(parseFloat(vals.opening) >= 0)) { showToast('⚠ Opening money is required'); return; }
              TC_SLOTS.forEach(s => { if (vals.counted[s.key] === '') vals.counted[s.key] = '0'; });
              if (TC_SLOTS.some(s => !(parseFloat(vals.counted[s.key]) >= 0))) { showToast('⚠ Amounts cannot be negative'); return; }

              const sales = tcSalesSince(periodStart);
              const opening = tcRound(parseFloat(vals.opening));
              const counted = {}, expected = {}, diff = {};
              let totalSales = 0, totalCounted = 0;
              TC_SLOTS.forEach(s => {
                sales[s.key] = tcRound(sales[s.key]);
                // Cash: opening money is taken out first. Other methods are used as typed.
                counted[s.key] = tcRound(parseFloat(vals.counted[s.key]) - (s.key === 'cash' ? opening : 0));
                expected[s.key] = sales[s.key];
                diff[s.key] = tcRound(counted[s.key] - expected[s.key]);
                totalSales += sales[s.key];
                totalCounted += counted[s.key];
              });
              totalSales = tcRound(totalSales);
              totalCounted = tcRound(totalCounted);
              const totalDiff = tcRound(totalCounted - totalSales);
              // Cash is NOT checked on its own (it is random) - only the total.
              // Card / Easypaisa / JazzCash / Bank must each match their own sales.
              const mismatches = TC_SLOTS.filter(s => s.key !== 'cash' && diff[s.key] !== 0);
              showResult({ opening, sales, expected, counted, diff, totalSales, totalCounted, totalDiff }, mismatches);
            }

            function showResult(r, mismatches) {
              const okAll = mismatches.length === 0 && r.totalDiff === 0;
              const bad = r.totalDiff < 0 || mismatches.length > 0;
              const bStyle = okAll ? 'background:#12a97a20;border:1px solid #12a97a60;color:var(--accent2)'
                : bad ? 'background:#ef444420;border:1px solid #ef444440;color:var(--danger)'
                : 'background:#f59e0b20;border:1px solid #f59e0b60;color:var(--accent3)';
              const totalMsg = r.totalDiff === 0 ? '✓ Total matches the sales'
                : r.totalDiff < 0 ? '⚠ Total is ' + tcMoney(-r.totalDiff) + ' LESS than the sales'
                : '⚠ Total is ' + tcMoney(r.totalDiff) + ' MORE than the sales';
              const banner = `<div style="padding:12px 14px;border-radius:var(--radius2);${bStyle};font-weight:600;margin-bottom:16px">${okAll ? '✓ Everything matches the sales saved in the system' : totalMsg}${okAll ? '' : `<div style="font-weight:500;font-size:.82rem;margin-top:6px;line-height:1.6">${mismatches.map(s => `${s.label}: ${tcDiffText(r.diff[s.key])}`).join('<br>')}</div>`}</div>`;
              const rows = TC_SLOTS.map(s => `
                <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr 1.2fr;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:.8rem;align-items:center">
                  <span>${s.icon} ${s.label}</span>
                  <span style="font-family:var(--mono);text-align:right;color:var(--text2)">${tcMoney(r.expected[s.key])}</span>
                  <span style="font-family:var(--mono);text-align:right">${tcMoney(r.counted[s.key])}</span>
                  <span style="text-align:right;font-weight:700;color:${s.key === 'cash' ? 'var(--text3)' : tcDiffColor(r.diff[s.key])}">${s.key === 'cash' ? 'see total' : tcDiffText(r.diff[s.key])}</span>
                </div>`).join('') + `
                <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr 1.2fr;gap:8px;padding:10px 0;font-size:.85rem;font-weight:700;align-items:center">
                  <span>Total</span>
                  <span style="font-family:var(--mono);text-align:right;color:var(--text2)">${tcMoney(r.totalSales)}</span>
                  <span style="font-family:var(--mono);text-align:right">${tcMoney(r.totalCounted)}</span>
                  <span style="text-align:right;color:${tcDiffColor(r.totalDiff)}">${tcDiffText(r.totalDiff)}</span>
                </div>`;
              overlay.innerHTML = `
                <div style="${boxStyle}">
                  <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2);margin-bottom:14px">🔒 Closing — Result</div>
                  ${banner}
                  <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr 1.2fr;gap:8px;padding-bottom:6px;border-bottom:1px solid var(--border2);font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">
                    <span></span><span style="text-align:right">System says</span><span style="text-align:right">You typed</span><span style="text-align:right">Result</span>
                  </div>
                  ${rows}
                  <div style="font-size:.72rem;color:var(--text3);margin-top:12px;line-height:1.5">Cash row = cash typed ${tcMoney(r.counted.cash + r.opening)} − opening ${tcMoney(r.opening)}. Cash is only checked inside the Total.</div>
                  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px">
                    <button class="btn btn-ghost" id="tc-back">← Back</button>
                    <button class="btn btn-success" id="tc-done">Done</button>
                  </div>
                </div>`;
              overlay.querySelector('#tc-back').onclick = showForm;
              overlay.querySelector('#tc-done').onclick = () => overlay.remove();
            }

            showForm();
          }