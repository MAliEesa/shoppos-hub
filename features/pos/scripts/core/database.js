          function loadDB() {
        loadSessionStart(() => {
          renderEmpCategories();
          updateDashboard();
          renderProductList();
          renderInventory();
          renderAdmCategories();
          populateCategoryDropdown();
        });
        attachDBListeners();
      }

          function saveDB() {
            const payload = {
              products: {},
              categories: {},
              nextSaleId: db.nextSaleId
            };
            db.products.forEach(p => { payload.products[p.ref] = p; });
            db.categories.forEach((c, i) => { payload.categories[i] = c; });
            fbdb.ref('/').update(payload);
          }

          function saveSale(sale) {
            fbdb.ref('/sales/' + sale.id).set(sale);
            fbdb.ref('/nextSaleId').set(db.nextSaleId);
            db.sales = db.sales.filter(s => s.id !== sale.id);
            db.sales.push(sale);
          }

          let _closingsCache = {};
          let _listenersAttached = false;
          function attachDBListeners() {
            if (_listenersAttached) return;
            _listenersAttached = true;

          fbdb.ref('/products').on('value', snapshot => {
            const data = snapshot.val();
            db.products = data ? Object.values(data) : [];
            renderEmpCategories();
            renderEmpProducts();
            renderProductList();
            renderInventory();
            updateDashboard();
            populateCategoryDropdown();
            bcPopulateSelects();
            const tab = document.getElementById('tab-analytics');
            if (tab && tab.classList.contains('active')) {
              renderTopProductsChart();
              anPopulateSelect();
            }
          });

          fbdb.ref('/categories').on('value', snapshot => {
            const data = snapshot.val();
            db.categories = data ? Object.values(data) : ['General'];
            renderEmpCategories();
            renderAdmCategories();
            populateCategoryDropdown();
          });
          fbdb.ref('/sales').on('value', snapshot => {
          const data = snapshot.val();
          db.sales = data ? Object.values(data) : [];
          updateDashboard();
          renderEmpCategories();
          renderEmpProducts();
          const tab = document.getElementById('tab-analytics');
          if (tab && tab.classList.contains('active')) {
            renderCOD();
            renderRevenueSummary();
            renderTopProductsChart();
            renderPaymentBreakdown();
            renderWeeklyRevenue();
            renderDailyRevenue();
            renderRevenueSummary();
          }
        });

          fbdb.ref('/nextSaleId').on('value', snapshot => {
            const val = snapshot.val();
            if (val) db.nextSaleId = val;
          });

          fbdb.ref('/sessionStart').on('value', snapshot => {
            const val = snapshot.val();
            if (val) {
              _sessionStartISO = val;
              updateDashboard();
            }
          });

          fbdb.ref('/closings').on('value', snap => {
            _closingsCache = snap.val() || {};
          });

          fbdb.ref('/closings').on('value', () => {
            const tab = document.getElementById('tab-analytics');
            loadSessionStart(() => {
              updateDashboard();
              if (tab && tab.classList.contains('active')) {
                renderCOD();
                renderRevenueSummary();
                if (revFilter === 'weeks') renderWeeklyRevenue();
                else if (revFilter === 'days') renderDailyRevenue();
                else renderRevenueSummary();
              }
            });
          });
          }

          // Bill state