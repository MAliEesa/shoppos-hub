          // ══════════════════════════════════════
          // CLOCK
          // ══════════════════════════════════════
          function updateClock() {
            const now = new Date(Date.now() + _serverTimeOffset);
      const t = now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Karachi'});
      const d = now.toLocaleDateString('en-US', {day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Karachi'});
            const str = `${d} — ${t}`;
            const el1 = document.getElementById('clock');
            const el2 = document.getElementById('emp-clock');
            const el3 = document.getElementById('adm-clock');
            if(el1) el1.textContent = str;
            if(el2) el2.textContent = t;
            if(el3) el3.textContent = t;
          }
          setInterval(updateClock, 1000);
          updateClock();
          initTogglesUI();
