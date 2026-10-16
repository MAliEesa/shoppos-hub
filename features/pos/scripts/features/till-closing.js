          // ══════════════════════════════════════
          // TILL CLOSING (employee) + TILL CHECK (admin)
          // ══════════════════════════════════════
          const TC_SLOTS = [
            { key: 'cash', label: 'Cash', icon: '💵' },
            { key: 'card', label: 'Card', icon: '💳' },
            { key: 'easypaisa', label: 'Easypaisa / Jazz', icon: '📱' },
            { key: 'bank', label: 'Bank', icon: '🏦' }
          ];

          function tcSlotOf(method) {
            if (method === 'Card') return 'card';
            if (method === 'Easypaisa' || method === 'JazzCash') return 'easypaisa';
            if (method === 'Bank Transfer') return 'bank';
            return 'cash';
          }

          function tcRound(n) { return Math.round((Number(n) || 0) * 100) / 100; }
          function tcMoney(n) { n = tcRound(n); return 'Rs. ' + (Number.isInteger(n) ? n : n.toFixed(2)); }
          function tcZero() { return { cash: 0, card: 0, easypaisa: 0, bank: 0 }; }

          async function tcGetLast() {
            const snap = await fbdb.ref('/tillClosings').orderByKey().limitToLast(1).once('value');
            const data = snap.val();
            return data ? Object.values(data)[0] : null;
          }

          function tcSalesSince(startISO) {
            const start = new Date(startISO);
            const out = tcZero();
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

          // ---------- EMPLOYEE: Closing popup ----------
          async function openTillClosing() {
            if (document.getElementById('tc-overlay')) return;
            const last = await tcGetLast();
            const periodStart = last && last.closedAt ? last.closedAt : getSessionStart();
            const prevCounted = last && last.counted ? last.counted : null;
            const vals = { opening: {}, counted: {} };
            if (prevCounted) TC_SLOTS.forEach(s => { vals.opening[s.key] = String(prevCounted[s.key] != null ? prevCounted[s.key] : 0); });

            const overlay = document.createElement('div');
            overlay.id = 'tc-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999;padding:12px';
            document.body.appendChild(overlay);

            const boxStyle = 'background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:22px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px #0008';
            const inputStyle = 'width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-family:var(--mono);font-size:.95rem;padding:9px 8px;outline:none;text-align:right';

            function slotRow(group) {
              return '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">' + TC_SLOTS.map(s => `
                <div>
                  <div style="font-size:.7rem;color:var(--text3);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.icon} ${s.label}</div>
                  <input type="number" min="0" step="any" inputmode="decimal" data-g="${group}" data-k="${s.key}" value="${vals[group][s.key] != null ? vals[group][s.key] : ''}" placeholder="0" style="${inputStyle}">
                </div>`).join('') + '</div>';
            }

            function showForm() {
              overlay.innerHTML = `
                <div style="${boxStyle}">
                  <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2);margin-bottom:4px">🔒 Closing</div>
                  <div style="font-size:.78rem;color:var(--text3);margin-bottom:18px">Type the opening amount and the closing amount for every slot (type 0 if none), then press Continue.</div>
                  <div style="font-size:.75rem;font-weight:600;color:var(--accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Opening amount</div>
                  ${slotRow('opening')}
                  <div style="font-size:.75rem;font-weight:600;color:var(--accent);margin:18px 0 8px;text-transform:uppercase;letter-spacing:.05em">Closing amount</div>
                  ${slotRow('counted')}
                  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px">
                    <button class="btn btn-ghost" id="tc-cancel">Cancel</button>
                    <button class="btn btn-primary" id="tc-continue">Continue</button>
                  </div>
                </div>`;
              overlay.querySelector('#tc-cancel').onclick = () => overlay.remove();
              overlay.querySelector('#tc-continue').onclick = onContinue;
            }

            function onContinue() {
              TC_SLOTS.forEach(s => {
                vals.opening[s.key] = overlay.querySelector(`input[data-g="opening"][data-k="${s.key}"]`).value.trim();
                vals.counted[s.key] = overlay.querySelector(`input[data-g="counted"][data-k="${s.key}"]`).value.trim();
              });
              const bad = TC_SLOTS.some(s => ['opening', 'counted'].some(g => vals[g][s.key] === '' || !(parseFloat(vals[g][s.key]) >= 0)));
              if (bad) { showToast('⚠ Fill all 8 boxes (type 0 if none)'); return; }

              const sales = tcSalesSince(periodStart);
              const opening = {}, counted = {}, expected = {}, diff = {};
              let totalDiff = 0;
              TC_SLOTS.forEach(s => {
                opening[s.key] = tcRound(parseFloat(vals.opening[s.key]));
                counted[s.key] = tcRound(parseFloat(vals.counted[s.key]));
                sales[s.key] = tcRound(sales[s.key]);
                expected[s.key] = tcRound(opening[s.key] + sales[s.key]);
                diff[s.key] = tcRound(counted[s.key] - expected[s.key]);
                totalDiff += diff[s.key];
              });
              totalDiff = tcRound(totalDiff);
              const mismatches = TC_SLOTS.filter(s => diff[s.key] !== 0);
              showResult({ opening, counted, sales, expected, diff, totalDiff }, mismatches);
            }

            function showResult(r, mismatches) {
              const ok = mismatches.length === 0;
              const banner = ok
                ? `<div style="padding:12px 14px;border-radius:var(--radius2);background:#12a97a20;border:1px solid #12a97a60;color:var(--accent2);font-weight:600;margin-bottom:16px">✓ Everything matches the sales saved in the system</div>`
                : `<div style="padding:12px 14px;border-radius:var(--radius2);background:#ef444420;border:1px solid #ef444440;color:var(--danger);font-weight:600;margin-bottom:16px">⚠ Mismatch found<div style="font-weight:500;font-size:.82rem;margin-top:6px;line-height:1.6">${mismatches.map(s => `${s.label}: ${tcDiffText(r.diff[s.key])}`).join('<br>')}</div></div>`;
              const rows = TC_SLOTS.map(s => `
                <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr 1.2fr;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:.8rem;align-items:center">
                  <span>${s.icon} ${s.label}</span>
                  <span style="font-family:var(--mono);text-align:right;color:var(--text2)">${tcMoney(r.expected[s.key])}</span>
                  <span style="font-family:var(--mono);text-align:right">${tcMoney(r.counted[s.key])}</span>
                  <span style="text-align:right;font-weight:700;color:${tcDiffColor(r.diff[s.key])}">${tcDiffText(r.diff[s.key])}</span>
                </div>`).join('');
              overlay.innerHTML = `
                <div style="${boxStyle}">
                  <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2);margin-bottom:14px">🔒 Closing — Result</div>
                  ${banner}
                  <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr 1.2fr;gap:8px;padding-bottom:6px;border-bottom:1px solid var(--border2);font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">
                    <span></span><span style="text-align:right">System says</span><span style="text-align:right">You typed</span><span style="text-align:right">Result</span>
                  </div>
                  ${rows}
                  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:22px">
                    <button class="btn btn-ghost" id="tc-back">← Back</button>
                    <button class="btn btn-success" id="tc-save">Save Closing</button>
                  </div>
                </div>`;
              overlay.querySelector('#tc-back').onclick = showForm;
              overlay.querySelector('#tc-save').onclick = async function () {
                this.disabled = true;
                try {
                  const key = String(Date.now() + _serverTimeOffset);
                  const closedAt = await getTrueServerTime();
                  const rec = {
                    id: key, closedAt, periodStart,
                    opening: r.opening, sales: r.sales, expected: r.expected,
                    counted: r.counted, diff: r.diff, totalDiff: r.totalDiff
                  };
                  if (prevCounted) rec.prevCounted = prevCounted;
                  await fbdb.ref('/tillClosings/' + key).set(rec);
                  showToast(mismatches.length ? '⚠ Closing saved — mismatch recorded' : '✓ Closing saved — all matched');
                  overlay.remove();
                } catch (e) {
                  console.error(e);
                  showToast('⚠ Could not save — try again');
                  this.disabled = false;
                }
              };
            }

            showForm();
          }

          // ---------- ADMIN: Till Check tab ----------
          async function renderTillCheck() {
            const el = document.getElementById('tc-list');
            if (!el) return;
            const snap = await fbdb.ref('/tillClosings').orderByKey().limitToLast(60).once('value');
            const data = snap.val();
            const sOk = document.getElementById('tc-stat-ok');
            const sBad = document.getElementById('tc-stat-bad');
            const sTotal = document.getElementById('tc-stat-total');
            if (!data) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">No closings yet</div>';
              if (sOk) sOk.textContent = '0'; if (sBad) sBad.textContent = '0'; if (sTotal) sTotal.textContent = '0';
              return;
            }
            const entries = Object.entries(data).sort((a, b) => a[0] < b[0] ? 1 : -1);
            const bad = entries.filter(([k, r]) => TC_SLOTS.some(s => (r.diff && r.diff[s.key]) !== 0 && (r.diff && r.diff[s.key]) != null)).length;
            if (sTotal) sTotal.textContent = entries.length;
            if (sBad) sBad.textContent = bad;
            if (sOk) sOk.textContent = entries.length - bad;

            el.innerHTML = entries.map(([key, r]) => {
              const when = new Date(r.closedAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' });
              const mism = TC_SLOTS.filter(s => r.diff && r.diff[s.key] != null && r.diff[s.key] !== 0);
              const openWarn = r.prevCounted ? TC_SLOTS.filter(s => Math.abs((r.opening[s.key] || 0) - (r.prevCounted[s.key] || 0)) > 0.001)
                .map(s => `${s.label}: opened with ${tcMoney(r.opening[s.key])} but last closing was ${tcMoney(r.prevCounted[s.key])}`) : [];
              const badge = mism.length
                ? '<span style="font-size:.72rem;padding:2px 10px;border-radius:20px;background:#ef444420;border:1px solid #ef444440;color:var(--danger);font-weight:700">⚠ Mismatch</span>'
                : '<span style="font-size:.72rem;padding:2px 10px;border-radius:20px;background:#12a97a20;border:1px solid #12a97a60;color:var(--accent2);font-weight:700">✓ Matched</span>';
              const rows = TC_SLOTS.map(s => {
                const d = r.diff ? r.diff[s.key] : 0;
                return `<div style="display:grid;grid-template-columns:1.3fr repeat(4,1fr) 1.2fr;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:.78rem;align-items:center">
                  <span>${s.icon} ${s.label}</span>
                  <span style="font-family:var(--mono);text-align:right;color:var(--text3)">${tcMoney(r.opening[s.key])}</span>
                  <span style="font-family:var(--mono);text-align:right;color:var(--text3)">${tcMoney(r.sales[s.key])}</span>
                  <span style="font-family:var(--mono);text-align:right;color:var(--text2)">${tcMoney(r.expected[s.key])}</span>
                  <span style="font-family:var(--mono);text-align:right">${tcMoney(r.counted[s.key])}</span>
                  <span style="text-align:right;font-weight:700;color:${tcDiffColor(d)}">${tcDiffText(d)}</span>
                </div>`;
              }).join('');
              return `<div data-tc="${key}" style="border-radius:var(--radius2);border:1px solid var(--border);overflow:hidden">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3)">
                  <div style="cursor:pointer;flex:1;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap" onclick="var d=this.closest('[data-tc]').querySelector('.tc-detail');d.style.display=d.style.display==='none'?'block':'none'">
                    <span style="font-family:var(--mono);font-size:.8rem;color:var(--text2)">${when}</span>
                    ${badge}
                  </div>
                  <button onclick="tcDelete('${key}')" style="padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid #ef444440;background:#ef444420;color:var(--danger);cursor:pointer;font-weight:600;flex-shrink:0">🗑 Delete</button>
                </div>
                <div class="tc-detail" style="display:${mism.length || openWarn.length ? 'block' : 'none'};padding:10px 12px;background:var(--bg4);overflow-x:auto">
                  ${mism.length ? `<div style="color:var(--danger);font-size:.8rem;font-weight:600;margin-bottom:8px">${mism.map(s => `${s.label}: ${tcDiffText(r.diff[s.key])}`).join(' &nbsp;·&nbsp; ')}</div>` : ''}
                  ${openWarn.length ? `<div style="color:var(--accent3);font-size:.78rem;margin-bottom:8px">⚠ ${openWarn.join('<br>⚠ ')}</div>` : ''}
                  <div style="min-width:520px">
                    <div style="display:grid;grid-template-columns:1.3fr repeat(4,1fr) 1.2fr;gap:8px;padding-bottom:6px;border-bottom:1px solid var(--border2);font-size:.66rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">
                      <span></span><span style="text-align:right">Opening</span><span style="text-align:right">Sales</span><span style="text-align:right">Expected</span><span style="text-align:right">Typed</span><span style="text-align:right">Result</span>
                    </div>
                    ${rows}
                  </div>
                </div>
              </div>`;
            }).join('');
          }

          async function tcDelete(key) {
            const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to delete this closing:');
            if (pwd === null) return;
            const res = await fetch(shopApi('checkwipe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong password!'); return; }
            await fbdb.ref('/tillClosings/' + key).remove();
            showToast('🗑 Closing deleted');
            renderTillCheck();
          }