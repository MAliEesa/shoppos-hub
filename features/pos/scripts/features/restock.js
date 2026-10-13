          // ══════════════════════════════════════
          // RESTOCK LIST
          // ══════════════════════════════════════
          function loadRestockList() {
            fbdb.ref('/restockList').on('value', snap => {
              const data = snap.val();
              const items = data ? Object.entries(data) : [];
              const el = document.getElementById('restock-list');
              if (!el) return;
              if (items.length === 0) {
                el.innerHTML = '<div style="color:var(--text3);font-size:.82rem">No items yet — add what customers are asking for</div>';
                return;
              }
              el.innerHTML = items.map(([key, item]) => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg3);border-radius:var(--radius2);border:1px solid var(--border)">
                  <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleRestockItem('${key}',this.checked)" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent2)">
                  <span style="flex:1;font-size:.85rem;${item.done ? 'text-decoration:line-through;color:var(--text3)' : ''}">${item.text}</span>
                  <span style="font-size:.72rem;color:var(--text3)">${item.date}</span>
                  <button class="del-btn" onclick="deleteRestockItem('${key}')">✕</button>
                </div>
              `).join('');
            });
          }

          function addRestockItem() {
            const input = document.getElementById('restock-input');
            const text = input.value.trim();
            if (!text) { showToast('⚠ Type something first'); return; }
            const key = Date.now();
            fbdb.ref('/restockList/' + key).set({
              text,
              done: false,
              date: serverNow().toLocaleDateString('en-US',{day:'2-digit',month:'short',timeZone:'Asia/Karachi'})
            });
            input.value = '';
            showToast('✓ Added to restock list');
          }

          function toggleRestockItem(key, done) {
            fbdb.ref('/restockList/' + key + '/done').set(done);
          }

          function deleteRestockItem(key) {
            fbdb.ref('/restockList/' + key).remove();
          }
