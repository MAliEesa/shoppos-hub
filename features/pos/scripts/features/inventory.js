          // ── INVENTORY ──
          function renderInventory(filter = '') {
            const tbody = document.getElementById('inv-tbody');
            tbody.innerHTML = '';
            const filtered = filter
              ? db.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.ref.includes(filter))
              : db.products;

            document.getElementById('inv-count').textContent = `${filtered.length} products`;

            if (filtered.length === 0) {
              tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;color:var(--text3);text-align:center">No products found</td></tr>`;
              return;
            }
            filtered.forEach(p => {
              const stock = parseInt(p.stock || 0);
              const stockClass = stock === 0 ? 'stock-out' : stock < 5 ? 'stock-low' : 'stock-ok';
              const stockLabel = stock === 0 ? 'Out' : stock < 5 ? 'Low' : 'OK';
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td class="mono">${p.ref}</td>
                <td><b>${p.name}</b>${p.supplier ? `<div style="font-size:.75rem;color:var(--text3)">${p.supplier}</div>` : ''}</td>
                <td class="mono">${p.barcode}</td>
                <td>${p.category}</td>
                <td class="mono">Rs. ${parseFloat(p.buyPrice||0).toFixed(2)}</td>
                <td class="mono">Rs. ${parseFloat(p.sellPrice).toFixed(2)}</td>
                <td><span class="stock-badge ${stockClass}">${stock} — ${stockLabel}</span></td>
              `;
              tbody.appendChild(tr);
            });
            renderInventorySummary(filtered);
          }

          function filterInventory(val) { renderInventory(val); }

          function renderInventorySummary(products) {
            const existing = document.getElementById('inv-summary-row');
            if (existing) existing.remove();
            const tbody = document.getElementById('inv-tbody');
            const totalStock = products.reduce((s,p) => s + parseInt(p.stock||0), 0);
            const totalBuyVal = products.reduce((s,p) => s + (parseInt(p.stock||0) * parseFloat(p.buyPrice||0)), 0);
            const totalSellVal = products.reduce((s,p) => s + (parseInt(p.stock||0) * parseFloat(p.sellPrice||0)), 0);
            const tr = document.createElement('tr');
            tr.id = 'inv-summary-row';
            tr.style.cssText = 'background:var(--bg3);font-weight:600;border-top:2px solid var(--border2)';
            tr.innerHTML = `
              <td colspan="2" style="padding:12px 14px;font-size:.8rem;color:var(--text2);text-transform:uppercase;letter-spacing:.05em">TOTALS — ${products.length} products, ${totalStock} units</td>
              <td colspan="2" style="padding:12px 14px;font-size:.78rem;color:var(--text3)"></td>
              <td style="padding:12px 14px;font-family:var(--mono);color:var(--accent3)">${privacyMode ? 'Rs. ---' : 'Rs. ' + totalBuyVal.toFixed(2)}<div style="font-size:.7rem;color:var(--text3);font-weight:400">Total Buy Value</div></td>
              <td style="padding:12px 14px;font-family:var(--mono);color:var(--accent2)">${privacyMode ? 'Rs. ---' : 'Rs. ' + totalSellVal.toFixed(2)}<div style="font-size:.7rem;color:var(--text3);font-weight:400">Total Sell Value</div></td>
              <td style="padding:12px 14px;font-family:var(--mono);color:#f59e0b">${privacyMode ? 'Rs. ---' : 'Rs. ' + (totalSellVal - totalBuyVal).toFixed(2)}<div style="font-size:.7rem;color:var(--text3);font-weight:400">Potential Profit</div></td>
            `;
            tbody.appendChild(tr);
          }
