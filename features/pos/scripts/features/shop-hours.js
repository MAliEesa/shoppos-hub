          // ══════════════════════════════════════
          // SHOP HOURS
          // ══════════════════════════════════════
          function showCustomProductPrompt() {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999';
            overlay.innerHTML = `
              <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:28px;min-width:300px;box-shadow:0 24px 80px #0008">
                <div style="font-family:var(--mono);font-size:.95rem;color:var(--accent);margin-bottom:20px">✏️ Custom Product</div>
                <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
                  <div>
                    <div style="font-size:.75rem;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Name</div>
                    <input id="custom-prod-name" type="text" value="Custom" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-size:.95rem;padding:10px 14px;outline:none">
                  </div>
                  <div>
                    <div style="font-size:.75rem;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Price (Rs.)</div>
                    <input id="custom-prod-price" type="number" min="0" step="1" placeholder="0" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-size:.95rem;padding:10px 14px;outline:none">
                  </div>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end">
                  <button class="btn btn-ghost" onclick="this.closest('div[style*=fixed]').remove();document.getElementById('barcode-input').focus()">Cancel</button>
                  <button class="btn btn-primary" onclick="confirmCustomProduct()">✓ Done</button>
                </div>
              </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.querySelector('#custom-prod-price').focus(), 100);
            overlay.querySelector('#custom-prod-price').addEventListener('keydown', e => { if (e.key === 'Enter') confirmCustomProduct(); });
          }

          function confirmCustomProduct() {
            const nameEl = document.getElementById('custom-prod-name');
            const priceEl = document.getElementById('custom-prod-price');
            if (!nameEl || !priceEl) return;
            const name = nameEl.value.trim() || 'Custom';
            const price = parseFloat(priceEl.value) || 0;
            if (price <= 0) { showToast('⚠ Enter a valid price'); return; }
            const overlay = nameEl.closest('div[style*="fixed"]');
            if (overlay) overlay.remove();
            const customProduct = {
              ref: 'CUSTOM-' + Date.now(),
              barcode: '',
              name,
              category: 'Custom',
              stock: 9999,
              sellPrice: price,
              buyPrice: 0,
              supplier: '',
              photo: null
            };
            addToBill(customProduct);
            showToast(`✓ ${name} added — Rs. ${price}`);
            document.getElementById('barcode-input').focus();
          }

          function showShopHoursPrompt() {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999';
            overlay.innerHTML = `
              <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:28px;min-width:300px;box-shadow:0 24px 80px #0008">
                <div style="font-family:var(--mono);font-size:.95rem;color:var(--accent2);margin-bottom:20px">🏪 Shop Hours</div>
                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
                  <button id="sh-open-btn" onclick="selectShopHour('opening')" style="padding:14px;border-radius:var(--radius2);border:2px solid var(--border2);background:var(--bg3);color:var(--text);font-size:.95rem;cursor:pointer;transition:.15s;text-align:left">🟢 Opening — Shop is opening now</button>
                  <button id="sh-close-btn" onclick="selectShopHour('closing')" style="padding:14px;border-radius:var(--radius2);border:2px solid var(--border2);background:var(--bg3);color:var(--text);font-size:.95rem;cursor:pointer;transition:.15s;text-align:left">🔴 Closing — Shop is closing now</button>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end">
                  <button id="sh-cancel" class="btn btn-ghost">Cancel</button>
                  <button id="sh-done" class="btn btn-primary" disabled>✓ Done</button>
                </div>
              </div>
            `;
            document.body.appendChild(overlay);
            let selected = null;
            window._shOverlay = overlay;
            overlay.querySelector('#sh-cancel').onclick = () => { document.body.removeChild(overlay); document.getElementById('barcode-input').focus(); };
            overlay.querySelector('#sh-done').onclick = () => {
              if (!selected) return;
              if (selected === 'closing') autoDownloadBackupOnClose();
              saveShopHour(selected);
              document.body.removeChild(overlay);
              document.getElementById('barcode-input').focus();
            };
            overlay._setSelected = (val) => { selected = val; };
          }

          function selectShopHour(type) {
            if (window._shOverlay && window._shOverlay._setSelected) window._shOverlay._setSelected(type);
            selected = type;
            const openBtn = document.querySelector('#sh-open-btn');
            const closeBtn = document.querySelector('#sh-close-btn');
            const doneBtn = document.querySelector('#sh-done');
            if (openBtn) { openBtn.style.borderColor = type === 'opening' ? 'var(--accent2)' : 'var(--border2)'; openBtn.style.background = type === 'opening' ? '#6ee7b720' : 'var(--bg3)'; }
            if (closeBtn) { closeBtn.style.borderColor = type === 'closing' ? 'var(--danger)' : 'var(--border2)'; closeBtn.style.background = type === 'closing' ? '#ef444420' : 'var(--bg3)'; }
            if (doneBtn) doneBtn.disabled = false;
          }

          function saveShopHour(type) {
            const now = getServerTime();
            const timeStr = new Date(now).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Karachi'});
            const todayKey = localDate(now);
            fbdb.ref('/shopHours').orderByKey().limitToLast(1).once('value').then(snap => {
              const data = snap.val();
              const lastKey = data ? Object.keys(data)[0] : null;
              const lastEntry = data ? data[lastKey] : null;
              const todayEntry = (lastKey === todayKey) ? lastEntry : null;

              if (todayEntry && todayEntry.opening && todayEntry.closing) {
                showToast('⚠ Today is already complete — opening & closing already recorded');
                return;
              }

              if (type === 'opening') {
                if (todayEntry && todayEntry.opening) {
                  showToast('⚠ Opening already exists for today');
                  return;
                }
                fbdb.ref('/shopHours/' + todayKey + '/opening').set({ time: now, timeStr, type: 'opening' }).then(() => {
                  showToast('🟢 Shop opened — ' + timeStr + ' (' + todayKey + ')');
                  renderShopHours();
                });
              } else {
                if (!todayEntry || !todayEntry.opening) {
                  showToast('⚠ No opening exists for today — open the shop first');
                  return;
                }
                fbdb.ref('/shopHours/' + todayKey + '/closing').set({ time: now, timeStr, type: 'closing' }).then(() => {
                  showToast('🔴 Shop closed — ' + timeStr);
                  renderShopHours();
                });
              }
            });
          }

          async function editShopHourEntry(date) {
            const pwd = await showPasswordPrompt('🔑 Enter Password to edit this entry:');
            if (pwd === null) return;
            const res = await fetch(shopApi('checkpass'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong password!'); return; }

            const snap = await fbdb.ref('/shopHours/' + date).once('value');
            const rec = snap.val() || {};
            const openTimeVal = rec.opening ? new Date(rec.opening.time).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Karachi'}) : '';
            const closeTimeVal = rec.closing ? new Date(rec.closing.time).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Karachi'}) : '';

            const overlay = document.createElement('div');
            overlay.id = 'sh-edit-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999';
            overlay.innerHTML = `
              <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:28px;min-width:300px;box-shadow:0 24px 80px #0008">
                <div style="font-family:var(--mono);font-size:.95rem;color:var(--accent2);margin-bottom:6px">✏️ Edit Shop Hours</div>
                <div style="font-size:.85rem;color:var(--text2);margin-bottom:16px">${date}</div>
                <div class="sh-edit-times-row">
                  <div class="form-group" style="margin-bottom:14px">
                    <label class="form-label">Opening Time</label>
                    <input class="form-input" type="time" id="edit-sh-open" value="${openTimeVal}">
                  </div>
                  <div class="form-group" style="margin-bottom:16px">
                    <label class="form-label">Closing Time</label>
                    <input class="form-input" type="time" id="edit-sh-close" value="${closeTimeVal}">
                  </div>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
                  <button class="btn btn-danger" style="flex:1" onclick="deleteShopHourPart('${date}','opening')">🗑 Delete Opening</button>
                  <button class="btn btn-danger" style="flex:1" onclick="deleteShopHourPart('${date}','closing')">🗑 Delete Closing</button>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end">
                  <button class="btn btn-ghost" onclick="document.getElementById('sh-edit-overlay')?.remove()">Cancel</button>
                  <button class="btn btn-primary" onclick="confirmEditShopHour('${date}')">💾 Save</button>
                </div>
              </div>`;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.querySelector('#edit-sh-open').focus(), 100);
          }

          function confirmEditShopHour(date) {
            const openVal = document.getElementById('edit-sh-open').value;
            const closeVal = document.getElementById('edit-sh-close').value;
            const updates = {};
            if (openVal) {
              const iso = karachiTimeToISO(date, openVal);
              const timeStr = new Date(iso).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Karachi'});
              updates.opening = { time: iso, timeStr, type: 'opening' };
            }
            if (closeVal) {
              const closeDateVal = (openVal && closeVal < openVal) ? addDaysToDateStr(date, 1) : date;
              const iso = karachiTimeToISO(closeDateVal, closeVal);
              const timeStr = new Date(iso).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Karachi'});
              updates.closing = { time: iso, timeStr, type: 'closing' };
            }
            fbdb.ref('/shopHours/' + date).update(updates).then(() => {
              document.getElementById('sh-edit-overlay')?.remove();
              showToast('✓ Shop hours updated');
              renderShopHours();
            });
          }

          function deleteShopHourPart(date, part) {
            if (!confirm(`Delete ${part} for ${date}? The other entry (if any) will be kept.`)) return;
            fbdb.ref('/shopHours/' + date + '/' + part).remove().then(() => {
              document.getElementById('sh-edit-overlay')?.remove();
              showToast(`🗑 ${part} deleted for ${date}`);
              renderShopHours();
            });
          }

          async function deleteShopHourEntry(date) {
            const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to delete this entry:');
            if (pwd === null) return;
            const res = await fetch(shopApi('checkwipe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong password!'); return; }
            if (!confirm(`Delete shop hours for ${date}?`)) return;
            await fbdb.ref('/shopHours/' + date).remove();
            showToast('🗑 Deleted: ' + date);
            renderShopHours();
          }

          function addManualShopHour() {
            const dateVal = document.getElementById('sh-manual-date').value;
            const openVal = document.getElementById('sh-manual-open').value;
            const closeVal = document.getElementById('sh-manual-close').value;
            if (!dateVal) { showToast('⚠ Select a date'); return; }
            if (!openVal && !closeVal) { showToast('⚠ Enter at least one time'); return; }
            const updates = {};
            if (openVal) {
              const iso = karachiTimeToISO(dateVal, openVal);
              const timeStr = new Date(iso).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Karachi'});
              updates.opening = { time: iso, timeStr, type: 'opening' };
            }
            if (closeVal) {
              const closeDateVal = (openVal && closeVal < openVal) ? addDaysToDateStr(dateVal, 1) : dateVal;
              const iso = karachiTimeToISO(closeDateVal, closeVal);
              const timeStr = new Date(iso).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Karachi'});
              updates.closing = { time: iso, timeStr, type: 'closing' };
            }
            fbdb.ref('/shopHours/' + dateVal).update(updates).then(() => {
              showToast('✓ Shop hours added for ' + dateVal);
              document.getElementById('sh-manual-date').value = '';
              document.getElementById('sh-manual-open').value = '';
              document.getElementById('sh-manual-close').value = '';
              renderShopHours();
            });
          }

          function autoDownloadBackupOnClose() {
            const date = serverNow().toISOString().substring(0, 10);
            const payload = { exportDate: date, products: db.products, sales: db.sales };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `shoppos-closing-backup-${date}.json`;
            a.click();
            showToast('💾 Backup downloaded automatically');
          }

          function renderShopHours() {
            const isMobile = window.innerWidth <= 768;
            fbdb.ref('/shopHours').orderByKey().limitToLast(14).once('value').then(snap => {
              const data = snap.val();
              const el = document.getElementById('shop-hours-history');
              if (!el) return;
              if (!data) { el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">No records yet</div>'; return; }
              const entries = Object.entries(data).sort((a,b) => a[0] < b[0] ? 1 : -1);
              el.innerHTML = entries.map(([date, rec]) => {
                const opening = rec.opening;
                const closing = rec.closing;
                const openStr = opening ? `<span style="font-family:var(--mono);font-size:.82rem">🟢 <span style="color:var(--text)">${opening.timeStr}</span></span>` : `<span style="color:var(--text3);font-size:.78rem">Not recorded</span>`;
                const closeStr = closing ? `<span style="font-family:var(--mono);font-size:.82rem">🔴 <span style="color:var(--text)">${closing.timeStr}</span></span>` : `<span style="color:var(--text3);font-size:.78rem">Still open</span>`;
                const isComplete = opening && closing;
                let hoursStr = '';
                if (isComplete && rec.opening && rec.closing) {
                  const diffMs = new Date(rec.closing.time) - new Date(rec.opening.time);
                  const diffHrs = diffMs / (1000 * 60 * 60);
                  const h = Math.floor(diffHrs);
                  const m = Math.round((diffHrs - h) * 60);
                  hoursStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                }
                const statusBadge = isComplete ? '<span style="font-size:.72rem;padding:2px 8px;border-radius:20px;background:#6ee7b720;color:var(--accent2);border:1px solid #6ee7b740">Complete</span>' : '<span style="font-size:.72rem;padding:2px 8px;border-radius:20px;background:#f59e0b20;color:var(--accent3);border:1px solid #f59e0b40">Open</span>';
                const deleteBtn = `<button onclick="deleteShopHourEntry('${date}')" style="padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid #ef444440;background:#ef444420;color:var(--danger);cursor:pointer;font-weight:600">🗑</button>`;
                const editBtn = `<button onclick="editShopHourEntry('${date}')" style="padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid var(--border2);background:var(--bg4);color:var(--text2);cursor:pointer;font-weight:600">✏️</button>`;
                if (isMobile) {
                  return `<div style="border-radius:var(--radius2);border:1px solid ${isComplete ? 'var(--border)' : 'var(--accent2)40'};overflow:hidden">
                    <div style="background:var(--bg3);padding:10px 12px;display:flex;flex-direction:column;gap:8px">
                      <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="font-family:var(--mono);font-size:.78rem;color:var(--text2);font-weight:600">${date}</div>
                        <div style="display:flex;align-items:center;gap:8px">${statusBadge}${editBtn}${deleteBtn}</div>
                      </div>
                      <div style="display:flex;gap:16px;flex-wrap:wrap">
                        <div style="display:flex;flex-direction:column;gap:3px">
                          <div style="font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Opened</div>
                          ${openStr}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:3px">
                          <div style="font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Closed</div>
                          ${closeStr}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:3px">
                          <div style="font-size:.65rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Duration</div>
                          <span style="font-family:var(--mono);font-size:.82rem;color:var(--accent3);font-weight:700">${hoursStr || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>`;
                } else {
                  return `<div style="border-radius:var(--radius2);border:1px solid ${isComplete ? 'var(--border)' : 'var(--accent2)40'};overflow:hidden">
                    <div style="display:grid;grid-template-columns:auto 1fr 1fr 1fr auto auto auto;align-items:center;padding:14px 16px;background:var(--bg3);gap:12px">
                      <div style="font-family:var(--mono);font-size:.78rem;color:var(--text2);font-weight:600">${date}</div>
                      <div style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center">
                        <div style="font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Opened</div>
                        ${openStr}
                      </div>
                      <div style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center">
                        <div style="font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Closed</div>
                        ${closeStr}
                      </div>
                      <div style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center">
                        <div style="font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Duration</div>
                        <span style="font-family:var(--mono);font-size:.82rem;color:var(--accent3);font-weight:700">${hoursStr || '—'}</span>
                      </div>
                      <div style="display:flex;justify-content:center">${statusBadge}</div>
                      <div style="display:flex;justify-content:center">${editBtn}</div>
                      <div style="display:flex;justify-content:center">${deleteBtn}</div>
                    </div>
                  </div>`;
                }
              }).join('');
            });
          }
