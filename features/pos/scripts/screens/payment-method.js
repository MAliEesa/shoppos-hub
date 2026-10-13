        function togglePayDropdown() {
          const d = document.getElementById('pay-dropdown');
          d.style.display = d.style.display === 'none' ? 'block' : 'none';
        }
        function selectPayMethod(method) {
          selectedPayMethod = method;
          document.getElementById('pay-method-btn').textContent = `💳 ${method} ▾`;
          document.getElementById('pay-dropdown').style.display = 'none';
        }
        document.addEventListener('click', function(e) {
          if (!e.target.closest('#pay-method-btn') && !e.target.closest('#pay-dropdown')) {
            const d = document.getElementById('pay-dropdown');
            if (d) d.style.display = 'none';
          }
        });