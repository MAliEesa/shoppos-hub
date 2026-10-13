          // ══════════════════════════════════════
          // INIT
          // ══════════════════════════════════════
          

      function getSessionStart() {
        // Returns an ISO string — start of current session (right after last closing, or epoch if never closed)
        return _sessionStartISO || '1970-01-01T00:00:00.000Z';
      }

      function loadSessionStart(cb) {
        fbdb.ref('/sessionStart').once('value').then(snap => {
          const manual = snap.val();
          if (manual) {
            _sessionStartISO = manual;
            if (cb) cb();
          } else {
            fbdb.ref('/closings').orderByKey().limitToLast(1).once('value').then(snap2 => {
              const data = snap2.val();
              if (data) {
                const lastKey = Object.keys(data)[0];
                _sessionStartISO = data[lastKey].closedAt;
              } else {
                _sessionStartISO = '1970-01-01T00:00:00.000Z';
              }
              if (cb) cb();
            });
          }
        });
      }