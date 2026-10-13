          // ══════════════════════════════════════
          // CHECK A DAY
          // ══════════════════════════════════════
          function checkDay() {
            const dateInput = document.getElementById('day-check-date').value;
            const el = document.getElementById('day-check-result');
            if (!dateInput) { showToast('⚠ Select a date'); return; }
            const daySales = db.sales.filter(s => localDate(s.time) === dateInput);
            if (daySales.length === 0) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.83rem">No sales found for this date.</div>';
              return;
            }
            if (privacyMode) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.83rem">Privacy mode is on — figures hidden.</div>';
              return;
            }
            let totalRev = 0;
            daySales.forEach(sale => { totalRev += sale.total; });

            const summaryHTML = `
              <div style="display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap">
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:8px 16px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase">Total Revenue</div>
                  <div style="font-family:var(--mono);font-size:1.2rem;font-weight:700;color:var(--accent2)">Rs. ${totalRev.toFixed(0)}</div>
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:8px 16px">
                  <div style="font-size:.7rem;color:var(--text3);text-transform:uppercase">Transactions</div>
                  <div style="font-family:var(--mono);font-size:1.2rem;font-weight:700;color:var(--accent)">${daySales.length}</div>
                </div>
              </div>
            `;

            if (daySales.length > 10) {
              el.innerHTML = summaryHTML + `
                <div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);text-align:center">
                  <div style="font-size:.85rem;color:var(--text2);margin-bottom:12px">${daySales.length} transactions — too many to display. Download the full report:</div>
                  <button class="btn btn-primary" onclick="downloadDayReport('${dateInput}')">⬇ Download Report</button>
                </div>
              `;
              return;
            }

            const rows = daySales.map((sale, idx) => {
              const t = new Date(sale.time).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Karachi'});
              const itemRows = sale.items.map(i =>
                `<div style="display:flex;justify-content:space-between;font-size:.78rem;color:var(--text2);padding:2px 0">
                  <span>${i.name}</span>
                  <span style="font-family:var(--mono)">x${i.qty} — Rs. ${(i.qty * i.price).toFixed(0)}</span>
                </div>`
              ).join('');
              return `
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg4);border-bottom:1px solid var(--border)">
                    <span style="font-family:var(--mono);font-size:.8rem;color:var(--accent);font-weight:700">Sale ${idx + 1}</span>
                    <span style="font-size:.75rem;color:var(--text3)">${t}</span>
                    <span style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--accent2)">Rs. ${sale.total.toFixed(0)}</span>
                  </div>
                  <div style="padding:8px 12px">${itemRows}</div>
                </div>
              `;
            }).join('');

            el.innerHTML = summaryHTML + rows;
          }

          function downloadDayReport(dateInput) {
            const daySales = db.sales.filter(s => localDate(s.time) === dateInput);
            let totalRev = 0;
            daySales.forEach(s => { totalRev += s.total; });

            let content = `SALES REPORT — ${dateInput}\n`;
            content += `Total Revenue: Rs. ${totalRev.toFixed(0)}\n`;
            content += `Total Transactions: ${daySales.length}\n`;
            content += `${'='.repeat(40)}\n\n`;
            daySales.forEach((sale, idx) => {
              const t = toKarachi(sale.time).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit'});
              content += `Sale ${idx + 1}  —  ${t}  —  Rs. ${sale.total.toFixed(0)}\n`;
              sale.items.forEach(i => {
                content += `  ${i.name.padEnd(20)} x${i.qty}   Rs. ${(i.qty * i.price).toFixed(0)}\n`;
              });
              content += `${'-'.repeat(40)}\n`;
            });

            const blob = new Blob([content], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `sales-report-${dateInput}.txt`;
            a.click();
          }
