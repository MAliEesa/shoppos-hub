        async function clearPrintHistory() {
          const pwd = await showPasswordPrompt('🔑 Enter Wipe Password to clear print history:');
          if (pwd === null) return;
          const res = await fetch(shopApi('checkwipe'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
          });
          const data = await res.json();
          if (!data.ok) { alert('❌ Wrong password!'); return; }
          fbdb.ref('/printHistory').remove();
          bcPrintHistory = [];
          bcRenderHistory();
          showToast('🗑 Print history cleared');
        }
