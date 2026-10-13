        function startApp() {
          loadDB();
        }
        syncServerTime();
        firebase.auth().onAuthStateChanged(user => {
          if (user) {
            document.getElementById('login-gate').style.display = 'none';
            startApp();
          } else {
            document.getElementById('login-gate').style.display = 'flex';
          }
        });
        
        const gateLoginBtn = document.getElementById('gate-login-btn');
        const gateEmailInput = document.getElementById('gate-email-input');
        const gatePwdInput = document.getElementById('gate-pwd-input');
        const gateError = document.getElementById('gate-error');
        function tryGateLogin() {
          const email = gateEmailInput.value.trim();
          const pwd = gatePwdInput.value;
          if (!email || !pwd) return;
          gateError.style.display = 'none';
          firebase.auth().signInWithEmailAndPassword(email, pwd).catch(() => {
            gateError.style.display = 'block';
          });
        }
        gateLoginBtn.onclick = tryGateLogin;
        gatePwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryGateLogin(); });
        if (sessionStorage.getItem('reloadAfterClose') === 'true') {
          sessionStorage.removeItem('reloadAfterClose');
          const savedTab = sessionStorage.getItem('reloadTab') || 'dashboard';
          const savedScroll = parseInt(sessionStorage.getItem('reloadScroll') || 0);
          sessionStorage.removeItem('reloadTab');
          sessionStorage.removeItem('reloadScroll');
          document.getElementById('landing').style.display = 'none';
          document.getElementById('adm-screen').classList.add('active');
          const tabBtn = document.querySelector(`.adm-nav-btn[onclick*="${savedTab}"]`);
          if (tabBtn) admTab(savedTab, tabBtn);
          setTimeout(() => {
            const scrollEl = document.querySelector('#tab-' + savedTab + ' > div');
            if (scrollEl) scrollEl.scrollTop = savedScroll;
          }, 500);
        }
