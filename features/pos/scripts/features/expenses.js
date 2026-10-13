        // ══════════════════════════════════════
        // EXPENSES
        // ══════════════════════════════════════
        let expMonthOffset = 0;
        const EXP_START_YEAR = 2026;
        const EXP_START_MONTH = 5;

        function expGetViewedDate() {
          const now = serverNow();
          return new Date(Date.UTC(kY(now), kM(now) + expMonthOffset, 1));
        }

        function expFilterForMonth(expenses, viewedYear, viewedMonth) {
          return expenses.filter(exp => kY(exp.createdAt) === viewedYear && kM(exp.createdAt) === viewedMonth);
        }

        function expUpdateNav() {
          const leftBtn = document.getElementById('exp-nav-prev');
          const rightBtn = document.getElementById('exp-nav-next');
          const now = serverNow();
          const startYM = EXP_START_YEAR * 12 + EXP_START_MONTH;
          const viewedYM = kY(now) * 12 + kM(now) + expMonthOffset;
          if (leftBtn) leftBtn.style.display = viewedYM > startYM ? 'flex' : 'none';
          if (rightBtn) rightBtn.style.display = expMonthOffset < 0 ? 'flex' : 'none';
        }

        function expUpdateLabel(viewedYear, viewedMonth) {
          const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const lbl = document.getElementById('exp-period-label');
          if (lbl) lbl.textContent = `${months[viewedMonth]} ${viewedYear}`;
        }

        function expNavigate(dir) {
          const next = expMonthOffset + dir;
          if (next > 0) return;
          const now = serverNow();
          const startYM = EXP_START_YEAR * 12 + EXP_START_MONTH;
          const nextYM = now.getFullYear() * 12 + now.getMonth() + next;
          if (nextYM < startYM) return;
          expMonthOffset = next;
          renderExpenses();
        }

        function addExpense() {
          const name = document.getElementById('exp-name-input').value.trim();
          const amount = parseFloat(document.getElementById('exp-amount-input').value) || 0;
          const dateVal = document.getElementById('exp-date-input').value;
          if (!name) { showToast('⚠ Enter expense name'); return; }
          if (amount <= 0) { showToast('⚠ Enter a valid amount'); return; }
          const key = 'exp_' + Date.now();
          let createdAt;
          if (dateVal) {
            createdAt = karachiDateToISO(dateVal);
          } else {
            const now = serverNow();
            const viewedY = kY(now), viewedM = kM(now) + expMonthOffset;
            const lastDayOfViewed = new Date(Date.UTC(viewedY, viewedM + 1, 0)).getUTCDate();
            const day = Math.min(kD(now), lastDayOfViewed);
            const dStr = `${viewedY}-${String(viewedM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            createdAt = karachiDateToISO(dStr);
          }
          const expense = { key, name, amount, createdAt };
          fbdb.ref('/expenses/' + key).set(expense).then(() => {
            showToast('✓ Expense added: ' + name);
            document.getElementById('exp-name-input').value = '';
            document.getElementById('exp-amount-input').value = '';
            document.getElementById('exp-date-input').value = '';
          });
        }

        function renderExpenses() {
          fbdb.ref('/expenses').once('value').then(snap => {
            const data = snap.val();
            const allExpenses = data ? Object.values(data) : [];
            const viewedDate = expGetViewedDate();
            const viewedYear = viewedDate.getUTCFullYear();
            const viewedMonth = viewedDate.getUTCMonth();
            const expenses = expFilterForMonth(allExpenses, viewedYear, viewedMonth);
            expUpdateNav();
            expUpdateLabel(viewedYear, viewedMonth);
            const el = document.getElementById('exp-list');
            if (!el) return;
            if (expenses.length === 0) {
              el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">No expenses for this month</div>';
              updateExpenseSummary([], 0, viewedYear, viewedMonth);
              return;
            }
            const totalExp = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            el.innerHTML = expenses.map(exp => {
              const dateLabel = exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '';
              return `<div class="exp-row" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg3);border-radius:var(--radius2);border:1px solid var(--border)">
                <div class="exp-row-info" style="flex:1;min-width:0">
                  <div style="font-size:.88rem;font-weight:500">${exp.name}</div>
                  <div style="margin-top:3px;font-size:.72rem;color:var(--text3)">${dateLabel}</div>
                </div>
                <div class="exp-row-amt" style="font-family:var(--mono);font-size:1rem;font-weight:700;color:var(--danger)">${privacyMode ? 'Rs. ---' : 'Rs. ' + parseFloat(exp.amount).toLocaleString()}</div>
                <div class="exp-row-actions" style="display:flex;gap:8px">
                  <button onclick="editExpensePrice('${exp.key}','${exp.name.replace(/'/g,"\\'")}',${exp.amount},'${exp.createdAt}')" style="padding:5px 12px;font-size:.78rem;border-radius:4px;border:1px solid var(--border2);background:var(--bg4);color:var(--text2);cursor:pointer">✏️ Edit</button>
                  <button onclick="deleteExpense('${exp.key}')" style="padding:5px 10px;font-size:.78rem;border-radius:4px;border:1px solid #ef444440;background:#ef444420;color:var(--danger);cursor:pointer">🗑</button>
                </div>
              </div>`;
            }).join('');
            updateExpenseSummary(expenses, totalExp, viewedYear, viewedMonth);
          });
        }

        function updateExpenseSummary(expenses, totalExp, viewedYear, viewedMonth) {
          const monthSales = db.sales.filter(s => kM(s.time) === viewedMonth && kY(s.time) === viewedYear).reduce((a, s) => a + s.total, 0);
          const net = monthSales - totalExp;
          const pct = totalExp === 0 ? 100 : Math.min(100, Math.round((monthSales / totalExp) * 100));
          const e = id => document.getElementById(id);
          if (e('exp-month-sales')) e('exp-month-sales').textContent = privacyMode ? 'Rs. ---' : 'Rs. ' + monthSales.toLocaleString();
          if (e('exp-month-total')) e('exp-month-total').textContent = privacyMode ? 'Rs. ---' : 'Rs. ' + totalExp.toLocaleString();
          if (e('exp-net')) {
            e('exp-net').textContent = privacyMode ? 'Rs. ---' : 'Rs. ' + Math.abs(net).toLocaleString() + (net >= 0 ? ' profit' : ' short');
            e('exp-net').style.color = net >= 0 ? 'var(--accent2)' : 'var(--danger)';
          }
          if (e('exp-coverage-bar')) e('exp-coverage-bar').style.width = privacyMode ? '0%' : pct + '%';
          if (e('exp-coverage-label')) e('exp-coverage-label').textContent = privacyMode ? 'Privacy mode is on' : (monthSales === 0 && totalExp === 0 ? '—' : pct + '% of expenses covered by sales');
        }

        async function editExpensePrice(key, name, currentAmount, currentCreatedAt) {
          const pwd = await showPasswordPrompt('🔑 Enter Password to edit expense:');
          if (pwd === null) return;
          const res = await fetch(shopApi('checkpass'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pwd }) });
          const data = await res.json();
          if (!data.ok) { alert('❌ Wrong password!'); return; }
          const dateStr = currentCreatedAt ? localDate(currentCreatedAt) : todayStr();
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999';
          overlay.innerHTML = `
            <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:28px;min-width:300px;box-shadow:0 24px 80px #0008">
              <div style="font-family:var(--mono);font-size:.95rem;color:var(--accent2);margin-bottom:16px">✏️ Edit Expense</div>
              <div class="form-group" style="margin-bottom:14px">
                <label class="form-label">Expense Name</label>
                <input class="form-input" type="text" id="edit-exp-name" value="${name}">
              </div>
              <div class="form-group" style="margin-bottom:14px">
                <label class="form-label">Amount (Rs.)</label>
                <input class="form-input" type="number" id="edit-exp-amount" value="${currentAmount}" min="0" style="font-size:1.1rem">
              </div>
              <div class="form-group" style="margin-bottom:16px">
                <label class="form-label">Date</label>
                <input class="form-input" type="date" id="edit-exp-date" value="${dateStr}">
              </div>
              <div style="display:flex;gap:10px;justify-content:flex-end">
                <button class="btn btn-ghost" onclick="this.closest('div[style*=fixed]').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="confirmEditExpense('${key}')">💾 Save</button>
              </div>
            </div>`;
          document.body.appendChild(overlay);
          setTimeout(() => overlay.querySelector('#edit-exp-name').focus(), 100);
        }

        function confirmEditExpense(key) {
          const name = document.getElementById('edit-exp-name').value.trim();
          const amount = parseFloat(document.getElementById('edit-exp-amount').value) || 0;
          const dateVal = document.getElementById('edit-exp-date').value;
          if (!name) { showToast('⚠ Enter expense name'); return; }
          if (amount <= 0) { showToast('⚠ Enter valid amount'); return; }
          const createdAt = dateVal ? karachiDateToISO(dateVal) : getServerTime();
          fbdb.ref('/expenses/' + key).update({ name, amount, createdAt }).then(() => {
            document.querySelector('div[style*="fixed"][style*="z-index:9999"]')?.remove();
            showToast('✓ Expense updated');
            renderExpenses();
          });
        }

        async function deleteExpense(key) {
          const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to delete expense:');
          if (pwd === null) return;
          const res = await fetch(shopApi('checkwipe'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pwd }) });
          const data = await res.json();
          if (!data.ok) { alert('❌ Wrong password!'); return; }
          if (!confirm('Delete this expense?')) return;
          fbdb.ref('/expenses/' + key).remove().then(() => {
            showToast('🗑 Expense deleted');
            renderExpenses();
          });
        }
