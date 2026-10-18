// Proves to the server that this browser is logged in to the shop.
async function authHeader() {
  try {
    const u = firebase.auth().currentUser;
    if (!u) return {};
    return { Authorization: 'Bearer ' + (await u.getIdToken()) };
  } catch (e) {
    return {};
  }
}

// Backend addresses for the current shop.
// Every call to the hub backend goes through this one helper.
function shopApi(name) {
  return '/api/shop/' + window.__SHOP__.id + '/' + name;
}