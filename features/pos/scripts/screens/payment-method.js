        function togglePayDropdown() {
          const d = document.getElementById('pay-dropdown');
          d.style.display = d.style.display === 'none' ? 'block' : 'none';
        }
        function selectPayMethod(method) {
          selectedPayMethod = method;
          const ci = document.getElementById('cash-input');
          if (ci) {
            const isCash = method === 'Cash';
            ci.disabled = !isCash;
            ci.style.opacity = isCash ? '1' : '.35';
            ci.style.cursor = isCash ? '' : 'not-allowed';
            if (!isCash) { ci.value = ''; if (typeof calcChange === 'function') calcChange(); }
          }
          document.getElementById('pay-method-btn').textContent = `💳 ${method} ▾`;
          document.getElementById('pay-dropdown').style.display = 'none';
        }
        document.addEventListener('click', function(e) {
          if (!e.target.closest('#pay-method-btn') && !e.target.closest('#pay-dropdown')) {
            const d = document.getElementById('pay-dropdown');
            if (d) d.style.display = 'none';
          }
        });