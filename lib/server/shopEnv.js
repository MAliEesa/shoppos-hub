// Reads a per-shop env var, e.g. shopEnv('shop1', 'ADMIN_PASSWORD') -> ADMIN_PASSWORD_SHOP1
export function shopEnv(shopId, name) {
  return process.env[`${name}_${shopId.toUpperCase()}`] || '';
}