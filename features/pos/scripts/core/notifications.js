        const VAPID_KEY = window.__SHOP__.vapidKey;

        async function initNotifications() {
          try {
            const savedToken = localStorage.getItem('fcmToken');
            if (savedToken) return;
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
            const reg = await navigator.serviceWorker.register('/shop/' + window.__SHOP__.id + '/firebase-messaging-sw.js');
            const messaging = firebase.messaging();
            const token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
            if (token) {
              const tokenKey = token.replace(/[.#$[\]]/g, '_');
              const snap = await fbdb.ref('/fcmTokens/' + tokenKey).once('value');
              if (!snap.val()) {
                await fbdb.ref('/fcmTokens/' + tokenKey).set({ token, ts: Date.now() });
              }
              localStorage.setItem('fcmToken', token);
            }
          } catch(e) { console.log('Notification setup failed:', e); }
        }

        async function sendSaleNotification(total, itemCount) {
          try {
            await fetch(shopApi('notify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ total: total.toFixed(0), itemCount })
            });
          } catch(e) { console.log('Notification send failed:', e); }
        }
