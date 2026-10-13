          function toKarachi(d) { return new Date(new Date(d).getTime() + 5 * 60 * 60 * 1000); }
          function kY(d) { return toKarachi(d).getUTCFullYear(); }
          function kM(d) { return toKarachi(d).getUTCMonth(); }
          function kD(d) { return toKarachi(d).getUTCDate(); }
          function kDay(d) { return toKarachi(d).getUTCDay(); }
          function karachiTimeToISO(dateStr, timeStr) {
            const [y,m,d] = dateStr.split('-').map(Number);
            const [hh,mm] = timeStr.split(':').map(Number);
            const utcMs = Date.UTC(y, m-1, d, hh, mm) - (5*60*60*1000);
            return new Date(utcMs).toISOString();
          }
          function localDate(d) { const x = toKarachi(d); return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`; }
          function karachiDateToISO(dateStr) { return karachiTimeToISO(dateStr, '12:00'); }
          function addDaysToDateStr(dateStr, days) {
            const [y,m,d] = dateStr.split('-').map(Number);
            const dt = new Date(Date.UTC(y, m-1, d + days));
            return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
          }
          function todayStr() { return localDate(serverNow()); }
        
          let selectedCatEmp = null;
          let selectedCatAdm = null;