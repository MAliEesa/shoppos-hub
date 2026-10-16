          // ══════════════════════════════════════
          // FIREBASE + DATA STORE
          // ══════════════════════════════════════
          const firebaseConfig = window.__SHOP__.firebaseConfig;
          firebase.initializeApp(firebaseConfig);
const fbdb = firebase.database();
        if (window.__SHOP__.id === 'shop2') fbdb.INTERNAL.forceWebSockets();
