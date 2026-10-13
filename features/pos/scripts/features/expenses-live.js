        fbdb.ref('/expenses').on('value', () => {
          const tab = document.getElementById('tab-expenses');
          if (tab && tab.classList.contains('active')) renderExpenses();
        });
