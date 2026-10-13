          // ══════════════════════════════════════
          // FIREBASE + DATA STORE
          // ══════════════════════════════════════
          const firebaseConfig = window.__SHOP__.firebaseConfig;
          firebase.initializeApp(firebaseConfig);
          const fbdb = firebase.database();
