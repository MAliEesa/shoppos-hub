// Backend addresses for the current shop.
// Every call to the hub backend goes through this one helper.
function shopApi(name) {
  return '/api/shop/' + window.__SHOP__.id + '/' + name;
}