          // ── DASHBOARD ──
          let dashFilter = 'today';
          function setDashFilter(f, btn) {
            dashFilter = f;
            ['df-today','df-week','df-month','df-all'].forEach(id => {
              const el = document.getElementById(id);
              if (!el) return;
              el.style.background = 'transparent';
              el.style.color = 'var(--text2)';
            });
            if (btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; }
            updateDashboard();
          }

          function updateDashboard() {
        document.getElementById('dash-categories').textContent = db.categories.length;
        const lowStockCount = db.products.filter(p => parseInt(p.stock || 0) > 0 && parseInt(p.stock || 0) < 5).length;
        document.getElementById('dash-low-stock').textContent = lowStockCount;

        const now = serverNow();
        const sessionStart = new Date(getSessionStart());
        let filtered = [...db.sales];

        if (dashFilter === 'today') {
          // "Today" = current session (since last closing)
          filtered = db.sales.filter(s => new Date(s.time) > sessionStart);
        } else if (dashFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
          filtered = db.sales.filter(s => new Date(s.time) >= weekAgo);
        } else if (dashFilter === 'month') {
          filtered = db.sales.filter(s => kM(s.time) === kM(now) && kY(s.time) === kY(now));
        }
        _finishDashboard(filtered, now);
      }

          function _finishDashboard(filtered, now) {
          
            const filteredTotal = filtered.reduce((a, s) => a + s.total, 0);  
          const recent = [...filtered].sort((a,b) => b.id - a.id);

            document.getElementById('dash-total-products').textContent = privacyMode ? '---' : filtered.length;
            document.getElementById('dash-today-sales').textContent = privacyMode ? 'Rs. ---' : `Rs. ${filteredTotal.toFixed(0)}`;
            document.getElementById('dash-today-txn').textContent = privacyMode ? '--- transactions' : `${filtered.length} transactions`;

            // Recent Sales — expandable rows
            const recentList = document.getElementById('recent-sales-list');
            if (recent.length === 0) {
              recentList.innerHTML = '<div class="recent-sale-row"><span style="color:var(--text3);font-size:.83rem">No sales in this period</span></div>';
            } else {
                 recentList.innerHTML = recent.map(s => {
                if (!s.items) s.items = [];
                const saleDate = toKarachi(s.time);
                const saleDayStr = localDate(s.time);
                const todayDayStr = todayStr();
                const nowK = toKarachi(now);
                const yesterdayDate = new Date(nowK); yesterdayDate.setDate(nowK.getDate()-1);
                const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth()+1).padStart(2,'0')}-${String(yesterdayDate.getDate()).padStart(2,'0')}`; 
                let dayLabel;
                const sessionStart = new Date(getSessionStart());
                if (new Date(s.time) > sessionStart) dayLabel = 'Today';
                else dayLabel = new Date(s.time).toLocaleDateString('en-US',{weekday:'long',timeZone:'Asia/Karachi'});
                const t = new Date(s.time).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Karachi'});
                const itemsPreview = s.items.map(i=>i.name).join(', ').substring(0,40);
                const itemsDetail = s.items.map(i => `
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:.78rem">
                    <span style="color:var(--text2)">${i.name}</span>
                    <span style="font-family:var(--mono);color:var(--text3)">x${i.qty}</span>
                    <span style="font-family:var(--mono);color:var(--accent2)">${privacyMode ? 'Rs. ---' : 'Rs. ' + (i.qty * i.price).toFixed(0)}</span>
                  </div>`).join('');
                return `<div class="recent-sale-row" style="flex-direction:column;align-items:stretch;cursor:pointer" onclick="this.querySelector('.sale-detail').style.display=this.querySelector('.sale-detail').style.display==='none'?'block':'none'">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                      <div class="rs-id">#${String(s.id).padStart(4,'0')} · ${s.items.length} item${s.items.length>1?'s':''} · ${s.payMethod||'Cash'}</div>
                      <div style="font-size:.82rem">${itemsPreview}</div>
                    </div>
                    <div style="text-align:right;display:flex;align-items:center;gap:10px">
                      <div>
                        <div class="rs-time">${dayLabel} — ${t}</div>
                        <div class="rs-total">${privacyMode ? 'Rs. ---' : 'Rs. ' + s.total.toFixed(0)}</div>
                      </div>
                      <button onclick="event.stopPropagation();editSale(${s.id})" style="padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid #3b82f640;background:#3b82f620;color:var(--accent);cursor:pointer;font-weight:600;flex-shrink:0">✏</button>
                      <button onclick="event.stopPropagation();deleteSale(${s.id})" style="padding:3px 10px;font-size:.72rem;border-radius:4px;border:1px solid #ef444440;background:#ef444420;color:var(--danger);cursor:pointer;font-weight:600;flex-shrink:0">🗑</button>
                    </div>
                  </div>
                  <div class="sale-detail" style="display:none;margin-top:8px;padding:8px;background:var(--bg3);border-radius:var(--radius2)">
                    ${itemsDetail}
                    <div style="display:flex;justify-content:space-between;padding-top:6px;font-family:var(--mono);font-size:.8rem;font-weight:700">
                      <span style="color:var(--text3)">TOTAL</span>
                      <span style="color:var(--accent2)">${privacyMode ? 'Rs. ---' : 'Rs. ' + s.total.toFixed(0)}</span>
                    </div>
                  </div>
                </div>`;
              }).join('');
            }
          }
