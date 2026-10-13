        (async () => {
          try {
            const res = await fetch('/version.json?t=' + Date.now());
            const { version } = await res.json();
            const cached = localStorage.getItem('appVersion');
            if (cached && cached !== version) {
              localStorage.setItem('appVersion', version);
              location.reload(true);
              return;
            }
            localStorage.setItem('appVersion', version);
          } catch(e) {}
        })();