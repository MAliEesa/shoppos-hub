          // ══════════════════════════════════════
          // WIPE SALES
          // ══════════════════════════════════════
          async function downloadBackup(type) {
        showToast('📦 Preparing backup...');
        const date = serverNow().toISOString().substring(0,10);

        const productRows = [['Type','Ref','Name','Category','Stock','SellPrice','BuyPrice','Supplier','Barcode']];
        db.products.forEach(p => {
          productRows.push(['product', p.ref, p.name, p.category, p.stock||0, p.sellPrice||0, p.buyPrice||0, p.supplier||'', p.barcode||'']);
        });

        const saleRows = [['SaleID','Time','PayMethod','Total','ItemName','ItemRef','Qty','Price']];
        db.sales.forEach(s => {
          s.items.forEach((item, i) => {
            saleRows.push([
              i === 0 ? s.id : '',
              i === 0 ? new Date(s.time).toLocaleString('en-PK',{timeZone:'Asia/Karachi'}) : '',
              i === 0 ? (s.payMethod||'Cash') : '',
              i === 0 ? s.total.toFixed(2) : '',
              item.name, item.ref, item.qty, item.price
            ]);
          });
        });

        if (type === 'csv') {
          const allRows = [...productRows, [], ...saleRows];
          const csv = allRows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `shoppos-backup-${date}.csv`;
          a.click();

        } else if (type === 'json') {
          const payload = { exportDate: date, products: db.products, sales: db.sales };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `shoppos-backup-${date}.json`;
          a.click();

        } else if (type === 'excel') {
          let html = `<html><head><meta charset="UTF-8"></head><body>`;
          html += `<h2>Products</h2><table border="1">`;
          productRows.forEach(r => { html += '<tr>' + r.map(v => `<td>${v}</td>`).join('') + '</tr>'; });
          html += `</table><br><h2>Sales</h2><table border="1">`;
          saleRows.forEach(r => { html += '<tr>' + r.map(v => `<td>${v}</td>`).join('') + '</tr>'; });
          html += `</table></body></html>`;
          const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `shoppos-backup-${date}.xls`;
          a.click();
        }

        showToast('✓ Backup downloaded');
      }

          async function wipeAllSales() {
            const wipePass = await showPasswordPrompt('🔑 Enter Wipe Password:');
            if (wipePass === null) return;
            const res = await fetch(shopApi('checkwipe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: wipePass })
            });
            const data = await res.json();
            if (!data.ok) { alert('❌ Wrong wipe password!'); return; }
            if (!confirm('DELETE ALL SALES AND CLOSINGS? This cannot be undone.')) return;
            fbdb.ref('/sales').remove();
            fbdb.ref('/closings').remove();
            fbdb.ref('/nextSaleId').set(1);
            db.sales = [];
            db.nextSaleId = 1;
            updateDashboard();
            showToast('🗑 All sales and closings wiped');
            fetch(shopApi('wipealert'), { method: 'POST', headers: await authHeader() });
          }
