          // ══════════════════════════════════════
          // CLOSE OF DAY
          // ══════════════════════════════════════
          function renderAnalytics() {
            renderTopProductsChart();
            renderPaymentBreakdown();
            anPopulateSelect();
            renderCOD();
            renderShopHours();
            _updateNavNext(revFilter === 'days' ? revDayOffset : revFilter === 'weeks' ? revWeekOffset : revMonthOffset);
            if (revFilter === 'days') renderDailyRevenue();
            else if (revFilter === 'weeks') renderWeeklyRevenue();
            else renderRevenueSummary();
          }

            
          function renderCOD() {
            const sessionStart = new Date(getSessionStart());
            const todaySales = db.sales.filter(s => new Date(s.time) > sessionStart);
            const todayTotal = todaySales.reduce((s, sale) => s + sale.total, 0);
            const el1 = document.getElementById('cod-today-total');
            const el2 = document.getElementById('cod-today-txn');
            if (el1) el1.textContent = privacyMode ? 'Rs. ---' : `Rs. ${todayTotal.toFixed(0)}`;
            if (el2) el2.textContent = privacyMode ? '---' : todaySales.length;

            const btn = document.getElementById('cod-btn');
            const status = document.getElementById('cod-status');
            if (btn) btn.disabled = false;
            if (status) status.textContent = '';

            // Load history
            fbdb.ref('/closings').orderByKey().once('value').then(snap => {
              const data = snap.val();
              const el = document.getElementById('cod-history');
              if (!el) return;
              if (!data) { el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">No closings yet</div>'; return; }
              const entries = Object.entries(data).sort((a,b) => a[0] < b[0] ? 1 : -1);
              el.innerHTML = entries.map(([date, rec], idx) => {
                const nextEntry = entries[idx + 1];
                const periodStart = nextEntry ? new Date(nextEntry[1].closedAt) : new Date(0);
                const periodEnd = new Date(rec.closedAt);
                const daySales = db.sales.filter(s => { const t = new Date(s.time); return t > periodStart && t <= periodEnd; });
                const itemRows = daySales.map(sale => {
                  const t = new Date(sale.time).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Karachi'});
                  return `<div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--text2);padding:4px 0;border-bottom:1px solid var(--border)">
                    <span style="font-family:var(--mono);color:var(--text3)">${t}</span>
                    <span>${sale.items.map(i=>i.name).join(', ').substring(0,30)}</span>
                    <span style="font-family:var(--mono);color:var(--accent2)">${privacyMode ? 'Rs. ---' : 'Rs. ' + sale.total.toFixed(0)}</span>
                  </div>`;
                }).join('');
                const closedTimeStr = rec.closedAt ? new Date(rec.closedAt).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Karachi'}) : '';
                return `<div data-closing="${date}" style="border-radius:var(--radius2);border:1px solid var(--border);overflow:hidden;margin-bottom:4px">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg3)">
                    <div style="cursor:pointer;flex:1;display:flex;justify-content:space-between;align-items:center" onclick="var detail=this.closest('[data-closing]').querySelector('.closing-detail');detail.style.display=detail.style.display==='none'?'block':'none'">
                      <div style="font-family:var(--mono);font-size:.78rem;color:var(--text2)">${date}${closedTimeStr ? ` <span style="color:var(--text3)">— ${closedTimeStr}</span>` : ''}</div>
                      <div style="font-size:.78rem;color:var(--text3)">${privacyMode ? '---' : rec.transactions} transactions</div>
                      <div style="font-family:var(--mono);font-size:.82rem;font-weight:700;color:var(--accent2)">${privacyMode ? 'Rs. ---' : 'Rs. ' + parseFloat(rec.total).toFixed(0)}</div>
                    </div>
                    <button onclick="deleteClosing('${date}')" style="margin-left:12px;padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid #ef444440;background:#ef444420;color:var(--danger);cursor:pointer;font-weight:600;flex-shrink:0">🗑 Delete</button>
                  </div>
                  <div class="closing-detail" style="display:none;padding:8px 12px;background:var(--bg4);max-height:none">${itemRows || '<div style="color:var(--text3);font-size:.78rem">No detailed records found</div>'}</div>
                </div>`;
              }).join('');
            });
          }

          async function editSale(saleId) {
            const sale = db.sales.find(x => x.id === saleId);
            if (!sale) { showToast('⚠ Sale not found'); return; }
            const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to edit this sale:');
            if (pwd === null) return;
            const res = await fetch(shopApi('checkwipe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong password!'); return; }

            const methods = ['Cash', 'Card', 'Easypaisa', 'JazzCash', 'Bank Transfer'];
            const cur = sale.payMethod || 'Cash';
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999;padding:12px';
            const fieldStyle = 'width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-family:var(--mono);font-size:.95rem;padding:10px;outline:none;margin-bottom:14px';
            overlay.innerHTML = `
              <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:22px;width:100%;max-width:380px;box-shadow:0 24px 80px #0008">
                <div style="font-family:var(--mono);font-size:1rem;color:var(--accent2);margin-bottom:16px">✏ Edit Sale #${String(saleId).padStart(4,'0')}</div>
                <div style="font-size:.75rem;color:var(--text3);margin-bottom:4px">Total amount (Rs.)</div>
                <input type="number" min="0" step="any" inputmode="decimal" id="es-total" value="${sale.total}" style="${fieldStyle}">
                <div style="font-size:.75rem;color:var(--text3);margin-bottom:4px">Payment method</div>
                <select id="es-method" style="${fieldStyle}">${methods.map(m => `<option value="${m}"${m === cur ? ' selected' : ''}>${m}</option>`).join('')}</select>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">
                  <button class="btn btn-ghost" id="es-cancel">Cancel</button>
                  <button class="btn btn-primary" id="es-save">Save</button>
                </div>
              </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#es-cancel').onclick = () => overlay.remove();
            overlay.querySelector('#es-save').onclick = async () => {
              const total = parseFloat(overlay.querySelector('#es-total').value);
              const payMethod = overlay.querySelector('#es-method').value;
              if (!(total >= 0)) { showToast('⚠ Enter a valid total'); return; }
              await fbdb.ref('/sales/' + saleId).update({ total: total, payMethod: payMethod });
              sale.total = total;
              sale.payMethod = payMethod;
              overlay.remove();
              showToast('✏ Sale updated');
              updateDashboard();
            };
          }

          async function deleteSale(saleId) {
            const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to delete this sale:');
            if (pwd === null) return;
            const res = await fetch(shopApi('checkwipe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong password!'); return; }

            showToast('🔄 Deleting and renumbering...');

            // Get the current full sales list fresh from Firebase
            const snap = await fbdb.ref('/sales').once('value');
            const allSales = snap.val() || {};

            // Remove the target sale — locally AND in Firebase
            delete allSales[saleId];
            await fbdb.ref('/sales/' + saleId).remove();

            // Find every sale with an id greater than the deleted one, sort ascending
            const idsToShift = Object.keys(allSales)
              .map(Number)
              .filter(id => id > saleId)
              .sort((a, b) => a - b);

            // Shift each one down by 1, ascending order so we never overwrite an unshifted sale
            for (const oldId of idsToShift) {
              const newId = oldId - 1;
              const saleData = allSales[oldId];
              saleData.id = newId;
              await fbdb.ref('/sales/' + newId).set(saleData);
              await fbdb.ref('/sales/' + oldId).remove();
            }

            // Recompute next sale id from the final state
            const finalSnap = await fbdb.ref('/sales').once('value');
            const finalSales = finalSnap.val() || {};
            const finalIds = Object.keys(finalSales).map(Number);
            db.nextSaleId = finalIds.length > 0 ? Math.max(...finalIds) + 1 : 1;
            fbdb.ref('/nextSaleId').set(db.nextSaleId);

            // Update local state to match
            db.sales = Object.values(finalSales);

            showToast('🗑 Sale deleted — numbers renumbered');
            updateDashboard();
          }

          async function deleteClosing(date) {
            const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to delete closing:');
            if (pwd === null) return;
            const res = await fetch(shopApi('checkwipe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong password!'); return; }
            if (!confirm(`Delete closing for ${date}? Sales data is kept, only the closing record is removed.`)) return;

            const snap = await fbdb.ref('/closings').orderByKey().once('value');
            const all = snap.val() || {};
            const keys = Object.keys(all).sort();
            const idx = keys.indexOf(date);
            const prevKey = idx > 0 ? keys[idx - 1] : null;
            const newSessionStart = prevKey ? all[prevKey].closedAt : '1970-01-01T00:00:00.000Z';

            await fbdb.ref('/closings/' + date).remove();
            await fbdb.ref('/sessionStart').set(newSessionStart);
            _sessionStartISO = newSessionStart;

            showToast(`🗑 Closing for ${date} deleted — its sales are back in the open session`);
            updateDashboard();
            const tab = document.getElementById('tab-analytics');
            if (tab && tab.classList.contains('active')) renderCOD();
          }

          async function closeOfDay() {
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
