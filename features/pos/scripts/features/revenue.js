          // ══════════════════════════════════════
          // REVENUE SUMMARY
          // ══════════════════════════════════════
          function renderRevenueSummary() {
            const now = serverNow();
            const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);

            const todayTotal = db.sales.filter(s => new Date(s.time) > new Date(getSessionStart())).reduce((a,s) => a+s.total, 0);
            const nowK2 = toKarachi(now);
            const weekStart2 = new Date(nowK2); weekStart2.setDate(nowK2.getDate() - nowK2.getDay()); weekStart2.setHours(0,0,0,0);
            const monthStart2 = new Date(nowK2.getFullYear(), nowK2.getMonth(), 1);
            if (weekStart2 < monthStart2) weekStart2.setTime(monthStart2.getTime());
            let weekTotal = 0;
            const d2 = new Date(weekStart2);
            while (d2 <= nowK2) {
              const dk = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
              if (_closingsCache[dk]) weekTotal += parseFloat(_closingsCache[dk].total) || 0;
              d2.setDate(d2.getDate() + 1);
            }
            const sessionStart3 = new Date(getSessionStart());
            weekTotal += db.sales.filter(s => new Date(s.time) > sessionStart3).reduce((a,s) => a+s.total, 0);
            const monthTotal = db.sales.filter(s => kM(s.time)===kM(now) && kY(s.time)===kY(now)).reduce((a,s) => a+s.total, 0);
            const yearTotal = db.sales.filter(s => kY(s.time)===kY(now)).reduce((a,s) => a+s.total, 0);
            const e = id => document.getElementById(id);
            if (e('rev-today')) e('rev-today').textContent = privacyMode ? 'Rs. ---' : `Rs. ${todayTotal.toFixed(0)}`;
            if (e('rev-week')) e('rev-week').textContent = privacyMode ? 'Rs. ---' : `Rs. ${weekTotal.toFixed(0)}`;
            if (e('rev-month')) e('rev-month').textContent = privacyMode ? 'Rs. ---' : `Rs. ${monthTotal.toFixed(0)}`;
            if (e('rev-year')) e('rev-year').textContent = privacyMode ? 'Rs. ---' : `Rs. ${yearTotal.toFixed(0)}`;

            const targetYear = now.getFullYear() + revMonthOffset;
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthly = Array(12).fill(0);
            db.sales.forEach(s => {
              if (kY(s.time) === targetYear) monthly[kM(s.time)] += s.total;
            });
            const maxM = Math.max(...monthly, 1);
            const el = document.getElementById('rev-monthly');
            if (!el) return;
            const lbl = document.getElementById('rev-period-label');
            if (lbl) lbl.textContent = `${targetYear}`;
            _updateNavNext(revMonthOffset);
            if (privacyMode) { el.innerHTML = '<div style="color:var(--text3);font-size:.83rem">Privacy mode is on — graph hidden.</div>'; return; }
            el.innerHTML = months.map((m, i) => {
              const isCurrent = i === now.getMonth() && targetYear === now.getFullYear();
              const pct = Math.round((monthly[i] / maxM) * 100);
              return `<div style="display:flex;align-items:center;gap:10px">
                <div style="width:28px;font-size:.75rem;color:${isCurrent ? 'var(--accent2)' : 'var(--text3)'};font-weight:${isCurrent?'700':'400'}">${m}</div>
                <div style="flex:1;background:var(--bg4);border-radius:3px;height:18px;overflow:hidden">
                  <div style="width:${pct}%;height:100%;background:${isCurrent ? 'var(--accent2)' : 'var(--accent)'};border-radius:3px;transition:width .4s"></div>
                </div>
                <div style="font-family:var(--mono);font-size:.75rem;color:var(--text2);width:80px;text-align:right">Rs. ${monthly[i].toFixed(0)}</div>
              </div>`;
            }).join('');
          }

          let revFilter = 'months';
          let revDayOffset = 0;
          let revWeekOffset = 0;
          let revMonthOffset = 0;
          function setRevFilter(f, btn) {
            revFilter = f;
            revDayOffset = 0;
            revWeekOffset = 0;
            revMonthOffset = 0;
            ['rf-months','rf-weeks','rf-days'].forEach(id => {
              const el = document.getElementById(id);
              if (!el) return;
              el.style.background = 'transparent'; el.style.color = 'var(--text2)';
            });
            if (btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; }
            if (f === 'weeks') { _updateNavNext(0); renderWeeklyRevenue(); }
            else if (f === 'days') { _updateNavNext(0); renderDailyRevenue(); }
            else { _updateNavNext(0); renderRevenueSummary(); }
          }

          function renderWeeklyRevenue() {
            const el = document.getElementById('rev-monthly');
            if (!el) return;
            const now = serverNow();
            const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const target = new Date(Date.UTC(kY(now), kM(now) + revWeekOffset, 1));
            const year = target.getUTCFullYear();
            const month = target.getUTCMonth();
            const lbl = document.getElementById('rev-period-label');
            if (lbl) lbl.textContent = `${mNames[month]} ${year}`;
            _updateNavNext(revWeekOffset);
            if (privacyMode) { el.innerHTML = '<div style="color:var(--text3);font-size:.83rem">Privacy mode is on — graph hidden.</div>'; return; }
            const firstDay = new Date(Date.UTC(year, month, 1));
            const lastDay = new Date(Date.UTC(year, month + 1, 0));
            const weeks = [];
            let weekStart = new Date(firstDay);
            let weekNum = 1;
            while (weekStart <= lastDay) {
              const weekEnd = new Date(weekStart);
              weekEnd.setUTCDate(weekStart.getUTCDate() + (6 - weekStart.getUTCDay()));
              if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
              weeks.push({ weekNum, start: new Date(weekStart), end: new Date(weekEnd) });
              weekNum++;
              weekStart = new Date(weekEnd);
              weekStart.setUTCDate(weekEnd.getUTCDate() + 1);
            }
            Promise.resolve().then(() => {
              const closingsData = _closingsCache;
              const weeksData = weeks.map(w => {
                let total = 0;
                const d = new Date(w.start);
                while (d <= w.end) {
                  const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
                  if (closingsData[dateKey]) total += parseFloat(closingsData[dateKey].total) || 0;
                  d.setUTCDate(d.getUTCDate() + 1);
                }
                const todayKey2 = localDate(now);
                const weekDayKeys = [];
                const td = new Date(w.start);
                while (td <= w.end) { weekDayKeys.push(`${td.getUTCFullYear()}-${String(td.getUTCMonth()+1).padStart(2,'0')}-${String(td.getUTCDate()).padStart(2,'0')}`); td.setUTCDate(td.getUTCDate()+1); }
                const isCurrent = weekDayKeys.includes(todayKey2);
              if (isCurrent) {
                const sessionStart = new Date(getSessionStart());
                const liveSales = db.sales.filter(s => new Date(s.time) > sessionStart);
                total += liveSales.reduce((a, s) => a + s.total, 0);
              }
              const startStr = w.start.getUTCDate() + '/' + (w.start.getUTCMonth()+1);
                const endStr = w.end.getUTCDate() + '/' + (w.end.getUTCMonth()+1);
                return { label: 'Week ' + w.weekNum, range: startStr + ' – ' + endStr, total, isCurrent };
              });
              const maxW = Math.max(...weeksData.map(w => w.total), 1);
              el.innerHTML = weeksData.map(w => {
                const pct = Math.round((w.total / maxW) * 100);
                return `<div style="display:flex;align-items:center;gap:10px">
                  <div style="width:48px;font-size:.75rem;color:${w.isCurrent ? 'var(--accent2)' : 'var(--text3)'};font-weight:${w.isCurrent?'700':'400'}">${w.label}</div>
                  <div style="width:60px;font-size:.7rem;color:var(--text3)">${w.range}</div>
                  <div style="flex:1;background:var(--bg4);border-radius:3px;height:18px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:${w.isCurrent ? 'var(--accent2)' : 'var(--accent)'};border-radius:3px;transition:width .4s"></div>
                  </div>
                  <div style="font-family:var(--mono);font-size:.75rem;color:var(--text2);width:80px;text-align:right">Rs. ${w.total.toFixed(0)}</div>
                </div>`;
              }).join('');
            });
          }

          const SHOP_OPEN_YEAR = 2026;
          const SHOP_OPEN_MONTH = 3;

          function revNavigate(dir) {
            if (revFilter === 'days') {
              const next = revDayOffset + dir;
              // Stop going back if no sales exist that far back
              if (dir < 0) {
                const now = serverNow();
                const sunday = new Date(Date.UTC(kY(now), kM(now), kD(now) - kDay(now) + next * 7));
                const sat = new Date(sunday); sat.setUTCDate(sunday.getUTCDate() + 6); sat.setUTCHours(23,59,59,999);
                const hasSales = db.sales.some(s => new Date(s.time) <= sat);
                if (!hasSales) return;
              }
              revDayOffset = next;
              renderDailyRevenue();
            } else if (revFilter === 'weeks') {
              const next = revWeekOffset + dir;
              if (dir < 0 && !_hasSalesForMonthOffset(next)) return;
              revWeekOffset = next;
              _updateNavNext(revWeekOffset);
              renderWeeklyRevenue();
            } else {
              const next = revMonthOffset + dir;
              if (next > 0) return;
              revMonthOffset = next;
              _updateNavNext(revMonthOffset);
              renderRevenueSummary();
            }
          }

          function _hasSalesForWeekOffset(offset) {
            const now = serverNow();
            const sunday = new Date(Date.UTC(kY(now), kM(now), kD(now) - kDay(now) + offset * 7));
            const sat = new Date(sunday); sat.setUTCDate(sunday.getUTCDate() + 6); sat.setUTCHours(23,59,59,999);
            return db.sales.some(s => new Date(s.time) <= sat);
          }

          function _hasSalesForMonthOffset(offset) {
            const now = serverNow();
            const target = new Date(Date.UTC(kY(now), kM(now) + offset, 1));
            const monthEnd = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            return db.sales.some(s => new Date(s.time) <= monthEnd);
          }

          function _updateNavNext(offset) {
            const leftBtn = document.getElementById('rev-nav-prev');
            const rightBtn = document.getElementById('rev-nav-next');
            if (revFilter === 'months') {
              if (leftBtn) leftBtn.style.display = offset < 0 ? 'flex' : 'none';
              if (rightBtn) rightBtn.style.display = offset < 0 ? 'flex' : 'none';
            } else if (revFilter === 'days') {
              if (rightBtn) { rightBtn.style.display = offset < 0 ? 'flex' : 'none'; }
              if (leftBtn) { leftBtn.style.display = _hasSalesForWeekOffset(offset - 1) ? 'flex' : 'none'; }
            } else {
              if (rightBtn) { rightBtn.style.display = offset < 0 ? 'flex' : 'none'; }
              if (leftBtn) { leftBtn.style.display = _hasSalesForMonthOffset(offset - 1) ? 'flex' : 'none'; }
            }
          }

          function renderDailyRevenue() {
            const el = document.getElementById('rev-monthly');
            if (!el) return;
            const now = serverNow();
            const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const sunday = new Date(Date.UTC(kY(now), kM(now), kD(now) - kDay(now) + revDayOffset * 7));
            const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const sat = new Date(sunday); sat.setUTCDate(sunday.getUTCDate() + 6);
            const rangeStr = sunday.getUTCMonth() === sat.getUTCMonth()
              ? `${sunday.getUTCDate()} – ${sat.getUTCDate()} ${mNames[sat.getUTCMonth()]} ${sat.getUTCFullYear()}`
              : `${sunday.getUTCDate()} ${mNames[sunday.getUTCMonth()]} – ${sat.getUTCDate()} ${mNames[sat.getUTCMonth()]}`;
            const lbl = document.getElementById('rev-period-label');
            if (lbl) lbl.textContent = rangeStr;
            _updateNavNext(revDayOffset);
            if (privacyMode) { el.innerHTML = '<div style="color:var(--text3);font-size:.83rem">Privacy mode is on — graph hidden.</div>'; return; }
            const closingsData = _closingsCache || {};
              const days = dayNames.map((name, i) => {
                const d = new Date(sunday);
                d.setUTCDate(sunday.getUTCDate() + i);
                const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
                const sessionStart = new Date(getSessionStart());
                const sessionDayKey = localDate(sessionStart);
                const sessionTotal = db.sales.filter(s => new Date(s.time) > sessionStart).reduce((a,s) => a+s.total, 0);
                const isSessionDay = dateKey === sessionDayKey;
                let total = 0;
                if (closingsData[dateKey]) total = parseFloat(closingsData[dateKey].total) || 0;
                if (isSessionDay) total += sessionTotal;
                return { name, total, isToday: isSessionDay, date: d.getUTCDate() + '/' + (d.getUTCMonth()+1) };
              });
              const maxD = Math.max(...days.map(d => d.total), 1);
              el.innerHTML = days.map(d => {
                const pct = Math.round((d.total / maxD) * 100);
                return `<div style="display:flex;align-items:center;gap:10px">
                  <div style="width:40px;font-size:.75rem;color:${d.isToday ? 'var(--accent2)' : 'var(--text3)'};font-weight:${d.isToday?'700':'400'}">${d.name}</div>
                  <div style="width:36px;font-size:.7rem;color:var(--text3)">${d.date}</div>
                  <div style="flex:1;background:var(--bg4);border-radius:3px;height:18px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:${d.isToday ? 'var(--accent2)' : 'var(--accent)'};border-radius:3px;transition:width .4s"></div>
                  </div>
                  <div style="font-family:var(--mono);font-size:.75rem;color:var(--text2);width:80px;text-align:right">Rs. ${d.total.toFixed(0)}</div>
                </div>`;
              }).join('');
          }

          // ══════════════════════════════════════
          // AUTO CLOSE OF DAY AT 3AM
          // ══════════════════════════════════════
          function checkAutoClose() {
            const now = serverNow();
            const hours = now.toLocaleString('en-US', {hour:'numeric', hour12:false, timeZone:'Asia/Karachi'});
            const minutes = now.toLocaleString('en-US', {minute:'numeric', timeZone:'Asia/Karachi'});
            if (parseInt(hours) === 3 && parseInt(minutes) === 0) {
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayKey = localDate(yesterday);
              fbdb.ref('/closings/' + yesterdayKey).once('value').then(snap => {
                if (!snap.val()) {
                  const yesterdaySales = db.sales.filter(s => localDate(s.time) === yesterdayKey);
                  const yesterdayTotal = yesterdaySales.reduce((a, s) => a + s.total, 0);
                  const autoClosedAt = getServerTime();
                  fbdb.ref('/closings/' + yesterdayKey).set({
                    date: yesterdayKey,
                    total: yesterdayTotal,
                    transactions: yesterdaySales.length,
                    closedAt: autoClosedAt,
                    auto: true
                  });
                  fbdb.ref('/sessionStart').set(autoClosedAt);
                  _sessionStartISO = autoClosedAt;
                  showToast('🔒 Auto closed — ' + yesterdayKey);
                  updateDashboard();
                }
              });
            }
          }
          setInterval(checkAutoClose, 60000);
