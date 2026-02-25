import { useEffect, useRef, useState } from "react";
import {
  getCart,
  getCartCount,
  getCartTotal,
  updateCartItemQuantity,
  clearCart
} from "../utils/cart";
import { PLACE_ORDER_MUTATION } from "../utils/placeOrder";

export function useCart() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const cartRef = useRef(null);

  useEffect(() => {
    const handler = () => setCartOpen(true);
    window.addEventListener('cart.open', handler);
    return () => window.removeEventListener('cart.open', handler);
  }, []);

  useEffect(() => {
    if (!cartOpen) return;

    const handleClickOutside = (event) => {
      if (!cartRef.current) return;
      const clickedInside = cartRef.current.contains(event.target);
      const clickedIcon = event.target.closest('.cart-icon');
      if (!clickedInside && !clickedIcon) setCartOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cartOpen]);

  useEffect(() => {
    const updateState = (e) => {
      const cart = e?.detail?.cart || getCart();
      setCartItems(cart);
      setCartCount(getCartCount());
      setCartTotal(getCartTotal());
    };

    updateState();
    window.addEventListener('cart.updated', updateState);
    window.addEventListener('storage', updateState);
    return () => {
      window.removeEventListener('cart.updated', updateState);
      window.removeEventListener('storage', updateState);
    };
  }, []);

  async function placeOrder() {
    const response = await fetch("/graphql", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: PLACE_ORDER_MUTATION,
        variables: {
          items: cartItems.map(item => ({
            product_id: item.productId,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            attributes: JSON.stringify(item.attributes || [])
          }))
        }
      })
    });

    const result = await response.json();

    if (result.data?.placeOrder) {
      clearCart();
    }
  }

  return {
    cartOpen,
    setCartOpen,
    cartItems,
    cartCount,
    cartTotal,
    cartRef,
    placeOrder,
    increase: (idx) => updateCartItemQuantity(idx, 1),
    decrease: (idx) => updateCartItemQuantity(idx, -1),
  };
}
