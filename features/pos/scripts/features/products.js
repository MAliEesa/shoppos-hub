          // ── PRODUCTS ──
          function renderProductList() {
            const el = document.getElementById('product-list-items');
            el.innerHTML = '';
            if (db.products.length === 0) {
              el.innerHTML = '<div style="padding:14px;color:var(--text3);font-size:.82rem">No products yet. Add one →</div>';
              return;
            }
            db.products.forEach(p => {
              const div = document.createElement('div');
              div.className = 'product-list-item' + (editingProductRef === p.ref ? ' active' : '');
              const stockColor = parseInt(p.stock||0) === 0 ? '#ef4444' : parseInt(p.stock||0) < 5 ? '#f59e0b' : '#6ee7b7';
        div.innerHTML = `<div class="pli-ref">${p.ref}</div><div class="pli-name">${p.name}</div><div style="display:flex;justify-content:space-between;align-items:center"><div class="pli-price">${p.customTrigger ? '---' : 'Rs. ' + parseFloat(p.sellPrice).toFixed(2)}</div><div style="font-family:var(--mono);font-size:.72rem;color:${stockColor}">${p.customTrigger ? '✏️ trigger' : 'Stock: ' + (p.stock||0)}</div></div>`;
              div.onclick = () => editProduct(p.ref);
              el.appendChild(div);
            });
          }

          function newProduct() {
            editingProductRef = null;
            clearForm();
            document.getElementById('form-mode-label').textContent = 'New Product';
            document.querySelectorAll('.product-list-item').forEach(e => e.classList.remove('active'));
          }

          function editProduct(ref) {
            const p = db.products.find(x => x.ref === ref);
            if (!p) return;
            editingProductRef = ref;
            document.getElementById('form-mode-label').textContent = `Editing: ${p.name}`;
            document.getElementById('delete-product-btn').style.display = 'flex';
            document.getElementById('f-ref').value = p.ref;
            document.getElementById('f-barcode').value = p.barcode;
            document.getElementById('f-name').value = p.name;
            document.getElementById('f-category').value = p.category;
            document.getElementById('f-stock').value = p.stock || 0;
            document.getElementById('f-sellprice').value = p.sellPrice;
            document.getElementById('f-buyprice').value = p.buyPrice || '';
            document.getElementById('f-supplier').value = p.supplier || '';
            _isCustomTrigger = p.customTrigger || false;
            const ctBtn = document.getElementById('custom-trigger-btn');
            if (ctBtn) { ctBtn.style.background = _isCustomTrigger ? 'var(--accent)' : 'transparent'; ctBtn.style.color = _isCustomTrigger ? '#fff' : 'var(--text2)'; ctBtn.textContent = _isCustomTrigger ? '✏️ Custom ✓' : '✏️ Custom'; }
            photoDataUrl = p.photo || null;
            if (p.photo) {
              document.getElementById('f-photo-preview').src = p.photo;
              document.getElementById('f-photo-preview').style.display = 'block';
              document.getElementById('upload-icon').style.display = 'none';
              document.getElementById('upload-text').textContent = 'Click to change photo';
            }
            renderProductList();
          }

          function saveProduct() {
            const ref = document.getElementById('f-ref').value.trim();
            const barcode = document.getElementById('f-barcode').value.trim() || ref;
            const name = document.getElementById('f-name').value.trim();
            const category = document.getElementById('f-category').value;
            const stock = parseInt(document.getElementById('f-stock').value) || 0;
            const sellPrice = Math.round(parseFloat(document.getElementById('f-sellprice').value) || 0);
            const buyPrice = Math.round(parseFloat(document.getElementById('f-buyprice').value) || 0);
            const supplier = document.getElementById('f-supplier').value.trim();

            if (_isCustomTrigger) {
              if (!ref || !name) { showToast('⚠ Fill Ref and Name at minimum'); return; }
            } else {
              if (!ref || !name || !sellPrice) { showToast('⚠ Fill required fields (Ref, Name, Price)'); return; }
            }
            const finalSellPrice = _isCustomTrigger ? 1 : sellPrice;
            const finalStock = _isCustomTrigger ? 999 : stock;

            if (editingProductRef) {
              const idx = db.products.findIndex(p => p.ref === editingProductRef);
              if (idx !== -1) {
                db.products[idx] = { ref, barcode, name, category, stock: finalStock, sellPrice: finalSellPrice, buyPrice, supplier, photo: photoDataUrl, customTrigger: _isCustomTrigger };
              }
              showToast(`✓ Updated: ${name}`);
            } else {
              if (db.products.find(p => p.ref === ref)) { showToast('⚠ Reference already exists'); return; }
              db.products.push({ ref, barcode, name, category, stock: finalStock, sellPrice: finalSellPrice, buyPrice, supplier, photo: photoDataUrl, customTrigger: _isCustomTrigger });
              showToast(`✓ Added: ${name}`);
            }

            saveDB();
            editingProductRef = null;
            clearForm();
            renderProductList();
            renderInventory();
            updateDashboard();
            renderEmpProducts();
          }

          async function deleteProduct() {
            if (!editingProductRef) return;
            const p = db.products.find(x => x.ref === editingProductRef);
            const pwd = await showPasswordPrompt(`🔑 Enter Wipe Password to delete "${p.name}":`);
if (pwd === null) return;
const res = await fetch(shopApi('checkwipe'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) });
const data = await res.json();
if (!data.ok) { alert('❌ Wrong password!'); return; }
            db.products = db.products.filter(x => x.ref !== editingProductRef);
            saveDB();
            editingProductRef = null;
            clearForm();
            renderProductList();
            renderInventory();
            updateDashboard();
            renderEmpProducts();
            showToast('🗑 Product deleted');
          }

          function toggleCustomTrigger() {
            _isCustomTrigger = !_isCustomTrigger;
            const btn = document.getElementById('custom-trigger-btn');
            btn.style.background = _isCustomTrigger ? 'var(--accent)' : 'transparent';
            btn.style.color = _isCustomTrigger ? '#fff' : 'var(--text2)';
            btn.textContent = _isCustomTrigger ? '✏️ Custom ✓' : '✏️ Custom';
            showToast(_isCustomTrigger ? '✓ This barcode will open custom window' : 'Custom trigger removed');
          }

          function clearForm() {
            _isCustomTrigger = false;
            const btn = document.getElementById('custom-trigger-btn');
            if (btn) { btn.style.background = 'transparent'; btn.style.color = 'var(--text2)'; btn.textContent = '✏️ Custom'; }
            ['f-ref','f-barcode','f-name','f-stock','f-sellprice','f-buyprice','f-supplier'].forEach(id => {
              document.getElementById(id).value = '';
            });
            photoDataUrl = null;
            document.getElementById('f-photo-preview').style.display = 'none';
            document.getElementById('upload-icon').style.display = 'block';
            document.getElementById('upload-text').textContent = 'Click to upload photo';
            document.getElementById('form-mode-label').textContent = 'New Product';
            document.getElementById('delete-product-btn').style.display = 'none';
            editingProductRef = null;
          }

          // Auto-fill barcode from reference
          document.getElementById('f-ref').addEventListener('input', function() {
            const bc = document.getElementById('f-barcode');
            if (!bc.value || bc.value === bc.dataset.last) {
              bc.value = this.value;
              bc.dataset.last = this.value;
            }
          });

          function handlePhotoUpload(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
              photoDataUrl = e.target.result;
              document.getElementById('f-photo-preview').src = photoDataUrl;
              document.getElementById('f-photo-preview').style.display = 'block';
              document.getElementById('upload-icon').style.display = 'none';
              document.getElementById('upload-text').textContent = 'Photo uploaded ✓';
            };
            reader.readAsDataURL(file);
          }

          function populateCategoryDropdown() {
            const sel = document.getElementById('f-category');
            sel.innerHTML = db.categories.map(c => `<option value="${c}">${c}</option>`).join('');
          }
