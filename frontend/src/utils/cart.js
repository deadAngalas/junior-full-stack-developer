// Simple cart utility using localStorage and window events
const CART_KEY = 'scandishop_cart_v1';

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch (e) {
    console.error('Failed to read cart', e);
    return [];
  }
}

function writeCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart.updated', { detail: { cart } }));
  } catch (e) {
    console.error('Failed to write cart', e);
  }
}

export function getCart() {
  return readCart();
}

export function clearCart() {
  writeCart([]);
}

export const getCartCount = () =>
  readCart().reduce((sum, { quantity = 1 }) => sum + quantity, 0); // reduce iterates through all the elements of the cart array and accumulates the value in sum

export const getCartTotal = () =>
  parseFloat(
    readCart()
      .reduce((sum, { price = 0, quantity = 1 }) => sum + price * quantity, 0)
      .toFixed(2)
  );

function normalizeProductForCart(product) {
  const { id, name, prices = [], gallery = [], attributes = [] } = product;
  const price = Number(prices[0]?.amount || 0);
  const image = gallery[0]?.image_url || '';

  return {
    productId: String(id),
    name,
    price,
    image,
    attributeSets: attributes,
  };
}

function generateAttrKey(attributes = []) {
  return attributes
    .map(a => `${a.attributeId}:${a.itemId}`)
    .sort()
    .join('|');
}

export function addToCart(product, attributes = [], quantity = 1) {
  const cart = readCart();
  const base = normalizeProductForCart(product); // ensures that the object contains only the required fields
  quantity = Math.max(1, quantity);

  const attrKey = generateAttrKey(attributes);

  const existingItem = cart.find(
    item => item.productId === base.productId && (item.attrKey ?? '') === attrKey
  );

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity ?? 1) + quantity;
  } else {
    cart.push({ ...base, attributes, attrKey, quantity });
  }

  writeCart(cart);
  return cart;
}

export function updateCartItemQuantity(index, delta) {
  const cart = readCart();
  const item = cart.at(index);
  if (!item) return cart;

  const nextQuantity = (item.quantity ?? 1) + delta;

  if (nextQuantity <= 0) {
    cart.splice(index, 1);
  } else {
    item.quantity = nextQuantity;
  }

  writeCart(cart);
  return cart;
}

export default {
  getCart,
  addToCart,
  clearCart,
  getCartCount,
  getCartTotal,
};
