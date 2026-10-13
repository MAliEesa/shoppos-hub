          // ── CATEGORIES ──
          function renderAdmCategories() {
            const el = document.getElementById('adm-cat-items');
            el.innerHTML = '';
            db.categories.forEach(cat => {
              const count = db.products.filter(p => p.category === cat).length;
              const div = document.createElement('div');
              div.className = 'cat-list-item' + (selectedCatAdm === cat ? ' active' : '');
              div.innerHTML = `<span class="cat-name">${cat}</span><span class="cat-count">${count} items</span>`;
              div.onclick = () => {
                selectedCatAdm = cat;
                document.getElementById('cat-name-input').value = cat;
                renderAdmCategories();
              };
              el.appendChild(div);
            });
          }

          function showAddCat() {
            selectedCatAdm = null;
            document.getElementById('cat-name-input').value = '';
            renderAdmCategories();
          }

          function saveCategory() {
            const name = document.getElementById('cat-name-input').value.trim();
            if (!name) { showToast('⚠ Enter category name'); return; }
            if (selectedCatAdm) {
              // Rename
              const idx = db.categories.indexOf(selectedCatAdm);
              db.categories[idx] = name;
              db.products.forEach(p => { if (p.category === selectedCatAdm) p.category = name; });
              showToast(`✓ Renamed to: ${name}`);
            } else {
              if (db.categories.includes(name)) { showToast('⚠ Category already exists'); return; }
              db.categories.push(name);
              showToast(`✓ Added category: ${name}`);
            }
            saveDB();
            selectedCatAdm = null;
            document.getElementById('cat-name-input').value = '';
            renderAdmCategories();
            populateCategoryDropdown();
            renderEmpCategories();
          }
