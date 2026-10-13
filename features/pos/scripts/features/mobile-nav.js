          // ══════════════════════════════════════
          // MOBILE NAV
          // ══════════════════════════════════════
          function toggleAdmNav() {
            document.getElementById('adm-sidebar').classList.toggle('open');
            document.getElementById('adm-overlay').classList.toggle('open');
          }
          function closeAdmNav() {
            document.getElementById('adm-sidebar').classList.remove('open');
            document.getElementById('adm-overlay').classList.remove('open');
          }
            // Employee catalog panel
          function toggleCatalog() {
            const catalog = document.getElementById('emp-catalog');
            const overlay = document.getElementById('catalog-overlay');
            catalog.classList.toggle('open');
            overlay.classList.toggle('open');
            if (!catalog.classList.contains('open')) clearEmpPriceSearch();
          }
          function closeCatalog() {
            const overlay = document.getElementById('catalog-overlay');
            const catalog = document.getElementById('emp-catalog');
            overlay.style.pointerEvents = '';
            overlay.classList.remove('open');
            catalog.classList.remove('open');
            clearEmpPriceSearch();
          }
          function clearEmpPriceSearch() {
            const el = document.getElementById('emp-price-search');
            if (el) el.value = '';
            renderEmpProducts();
          }

          // Products list panel
          function toggleProductsList() {
            const panel = document.querySelector('.products-list-panel');
            const overlay = document.getElementById('prod-list-overlay');
            panel.classList.toggle('open');
            if (overlay) overlay.style.display = panel.classList.contains('open') ? 'block' : 'none';
          }

          // Categories list panel
          function toggleCatList() {
            const panel = document.querySelector('.cat-list-panel');
            const overlay = document.getElementById('cat-list-overlay');
            panel.classList.toggle('open');
            if (overlay) overlay.style.display = panel.classList.contains('open') ? 'block' : 'none';
          }
          // Close sidebar when a tab is clicked on mobile
          const origAdmTab = admTab;
          admTab = function(name, btn) {
            origAdmTab(name, btn);
            if (window.innerWidth <= 768) closeAdmNav();
          };

          // Show mobile-only buttons
          if (window.innerWidth <= 768) {
            const pt = document.getElementById('prod-list-toggle');
            const ct = document.getElementById('cat-list-toggle');
            if (pt) pt.style.display = 'flex';
            if (ct) ct.style.display = 'flex';
          }