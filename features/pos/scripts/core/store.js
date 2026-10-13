            let db = {
            products: [],
            categories: ['General'],
            sales: [],
            nextSaleId: 1
          };

          // Bill array - global state for current bill
          let bill = [];
          let selectedPayMethod = 'Cash';
          let checkoutInProgress = false;
          let _sessionStartISO = null;
          let _serverTimeOffset = 0;
          let _serverTimeSynced = false;
          let privacyMode = localStorage.getItem('privacyMode') === 'true';
