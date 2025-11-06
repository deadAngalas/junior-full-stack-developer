// Simple cart utility using localStorage and window events
const CART_KEY = 'scandishop_cart_v1';

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
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

export function getCartCount() {
  const cart = readCart();
  return cart.reduce((sum, it) => sum + (it.quantity || 1), 0);
}

export function getCartTotal() {
  const cart = readCart();
  return cart.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0);
}

function normalizeProductForCart(product) {
  const priceObj = product.prices?.[0];
  const price = priceObj ? Number(priceObj.amount) : 0;
  const image = product.gallery?.[0]?.image_url || '';
  return {
    productId: String(product.id),
    name: product.name,
    price,
    image,
    attributeSets: product.attributes || [],
  };
}

export function addToCart(product, attributes = [], quantity = 1) {
  const cart = readCart();
  const base = normalizeProductForCart(product);

  const attrKey = (attributes || [])
    .map(a => `${a.attributeId}:${a.itemId}`)
    .sort()
    .join('|');

  const existingIndex = cart.findIndex(it => it.productId === base.productId && (it.attrKey || '') === attrKey);

  if (existingIndex !== -1) {
    cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + quantity;
  } else {
    cart.push({
      ...base,
      attributes,
      attrKey,
      quantity,
    });
  }

  writeCart(cart);
  return cart;
}

export function updateCartItemQuantity(index, delta) {
  const cart = readCart();
  if (index >= 0 && index < cart.length) {
    const current = cart[index].quantity || 1;
    const next = current + delta;
    if (next <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = next;
    }
    writeCart(cart);
  }
  return cart;
}

export default {
  getCart,
  addToCart,
  clearCart,
  getCartCount,
  getCartTotal,
};
