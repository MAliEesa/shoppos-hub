          function toggleTheme() {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('lightTheme', isLight ? 'true' : 'false');
            const btn = document.getElementById('theme-toggle-btn');
            if (btn) btn.textContent = isLight ? '☀️' : '🌙';
          }

          async function togglePrivacyMode() {
            if (privacyMode) {
              const pwd = await showPasswordPrompt('🔑 Enter Password to turn off Privacy Mode:');
              if (pwd === null) return;
              const res = await fetch(shopApi('checkpass'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
              });
              const data = await res.json();
              if (!data.ok) { alert('❌ Wrong password!'); return; }
            }
            privacyMode = !privacyMode;
            localStorage.setItem('privacyMode', privacyMode ? 'true' : 'false');
            const btn = document.getElementById('privacy-toggle-btn');
            if (btn) btn.textContent = privacyMode ? '🙉' : '🙈';
            showToast(privacyMode ? '🙈 Privacy mode ON — figures hidden' : '🙉 Privacy mode OFF — figures visible');
            updateDashboard();
            renderInventory();
            const tab = document.getElementById('tab-analytics');
            if (tab && tab.classList.contains('active')) renderAnalytics();
            const expTab = document.getElementById('tab-expenses');
            if (expTab && expTab.classList.contains('active')) renderExpenses();
          }

          function initTogglesUI() {
            if (localStorage.getItem('lightTheme') === 'true') document.body.classList.add('light-theme');
            const themeBtn = document.getElementById('theme-toggle-btn');
            if (themeBtn) themeBtn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
            const privBtn = document.getElementById('privacy-toggle-btn');
            if (privBtn) privBtn.textContent = privacyMode ? '🙉' : '🙈';
          }
