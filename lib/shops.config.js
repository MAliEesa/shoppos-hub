export const SHOPS = [
  {
    id: 'shop1',
    name: 'Shop 1',
    accentColor: '#2563eb',
    firebaseConfig: {
      apiKey: process.env.SHOP1_API_KEY,
      authDomain: 'shop1-b80de.firebaseapp.com',
      databaseURL: 'https://shop1-b80de-default-rtdb.firebaseio.com',
      projectId: 'shop1-b80de',
      storageBucket: 'shop1-b80de.firebasestorage.app',
      messagingSenderId: '1056204431989',
      appId: '1:1056204431989:web:2a11bbf178068565cace3c',
    },
  },
  {
    id: 'shop2',
    name: 'Shop 2',
    accentColor: '#16a34a',
    firebaseConfig: {
      apiKey: process.env.SHOP2_API_KEY,
      authDomain: 'shoppos-b9323.firebaseapp.com',
      databaseURL: 'https://shoppos-b9323-default-rtdb.firebaseio.com',
      projectId: 'shoppos-b9323',
      storageBucket: 'shoppos-b9323.firebasestorage.app',
      messagingSenderId: '646949373893',
      appId: '1:646949373893:web:e78f5a7c9f599aaf91adac',
    },
  },
];

export function getShop(shopId) {
  return SHOPS.find((s) => s.id === shopId) || null;
}