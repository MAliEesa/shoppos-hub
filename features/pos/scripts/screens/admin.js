          // ══════════════════════════════════════
          // ADMIN SCREEN
          // ══════════════════════════════════════
          function initAdmScreen() {
            updateDashboard();
            renderProductList();
            renderInventory();
            renderAdmCategories();
            populateCategoryDropdown();
          }

          function admTab(name, btn) {
            document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.adm-nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tab-' + name).classList.add('active');
            btn.classList.add('active');
            if (name === 'inventory') renderInventory();
            if (name === 'products') { renderProductList(); populateCategoryDropdown(); }
            if (name === 'categories') renderAdmCategories();
            if (name === 'dashboard') updateDashboard();
            if (name === 'dashboard') updateDashboard();
            if (name === 'analytics') { renderAnalytics(); loadRestockList(); }
            if (name === 'shophours') { renderShopHours(); }
            if (name === 'expenses') { renderExpenses(); }
if (name === 'barcodes') { bcPopulateSelects(); bcLoadHistory(); }
          }
