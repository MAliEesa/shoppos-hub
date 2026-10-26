          // ══════════════════════════════════════
          // NAVIGATION
          // ══════════════════════════════════════
          let adminUnlocked = false;

          function showPasswordPrompt(message) {
            return new Promise(resolve => {
              const overlay = document.createElement('div');
              overlay.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9999';
              overlay.innerHTML = `
                <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:28px;min-width:320px;box-shadow:0 24px 80px #0008">
                  <div style="font-family:var(--mono);font-size:.95rem;color:var(--accent2);margin-bottom:16px">${message}</div>
                  <input type="password" id="pwd-input" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius2);color:var(--text);font-size:.95rem;padding:10px 14px;outline:none;margin-bottom:16px" placeholder="Enter password..." autofocus>
                  <div style="display:flex;gap:10px;justify-content:flex-end">
                    <button id="pwd-cancel" class="btn btn-ghost">Cancel</button>
                    <button id="pwd-ok" class="btn btn-primary">Confirm</button>
                  </div>
                </div>
              `;
              document.body.appendChild(overlay);
              const input = overlay.querySelector('#pwd-input');
              const ok = overlay.querySelector('#pwd-ok');
              const cancel = overlay.querySelector('#pwd-cancel');
              const done = val => { document.body.removeChild(overlay); resolve(val); };
              ok.onclick = () => done(input.value);
              cancel.onclick = () => done(null);
              input.addEventListener('keydown', e => { if (e.key === 'Enter') done(input.value); if (e.key === 'Escape') done(null); });
              setTimeout(() => input.focus(), 50);
            });
          }

                    let adminOpening = false;

          function adminBusy(on, text) {
            let el = document.getElementById('adm-busy');
            if (!on) { if (el) el.remove(); return; }
            if (!el) {
              el = document.createElement('div');
              el.id = 'adm-busy';
              el.style.cssText = 'position:fixed;inset:0;background:#0007;display:flex;align-items:center;justify-content:center;z-index:9998;color:#fff;font-family:var(--mono);font-size:.95rem';
              document.body.appendChild(el);
            }
            el.textContent = text || 'Checking...';
          }

          function showAdminScreen() {
            adminUnlocked = true;
            document.getElementById('landing').style.display = 'none';
            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
            document.getElementById('adm-screen').classList.add('active');
            initAdmScreen();
          }

          async function callCheckpass(options) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 15000);
            try {
              const r = await fetch(shopApi('checkpass'), { ...options, signal: ctrl.signal });
              return await r.json();
            } finally {
              clearTimeout(timer);
            }
          }

          async function openScreen(s) {
            if (s !== 'adm') {
              document.getElementById('landing').style.display = 'none';
              document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
              document.getElementById(s + '-screen').classList.add('active');
              if (s === 'emp') initEmpScreen();
              return;
            }
            if (adminOpening) return;
            adminOpening = true;
            try {
              if (adminUnlocked) { showAdminScreen(); return; }
              adminBusy(true, 'Checking this device...');
              try {
                const d0 = await callCheckpass({ cache: 'no-store' });
                if (d0.ok) { showAdminScreen(); return; }
              } catch (e) {}
              adminBusy(false);
              const entered = await showPasswordPrompt('🔒 Enter Admin Password:');
              if (entered === null) return;
              adminBusy(true, 'Checking password...');
              try {
                const data = await callCheckpass({
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: entered })
                });
                adminBusy(false);
                if (data.ok) showAdminScreen();
                else alert('❌ Wrong password!');
              } catch (e) {
                adminBusy(false);
                alert('Could not reach the server. Please try again.');
              }
            } finally {
              adminBusy(false);
              adminOpening = false;
            }
          }
          function goHome() {
            document.getElementById('landing').style.display = 'flex';
            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
          }
