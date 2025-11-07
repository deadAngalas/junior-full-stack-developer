import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import './Header.css';
import logo from "../assets/logo.svg";
import cartIcon from "../assets/cart-icon.svg";
import { fetchProducts } from "../api/productService";
import { PLACE_ORDER_MUTATION } from "../api/placeOrder";
import { getCart, getCartCount, getCartTotal, updateCartItemQuantity, clearCart } from '../utils/cart';

export default function Header({ categories }) {
  const [productCategoryId, setProductCategoryId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const { productId } = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    return {
      categoryName: pathParts[0] || null,
      productId: pathParts[1] || null,
    };
  }, [location.pathname]);

  useEffect(() => {
    function onCartOpenRequest() {
      setCartOpen(true);
    }
    window.addEventListener('cart.open', onCartOpenRequest);
    return () => window.removeEventListener('cart.open', onCartOpenRequest);
  }, []);


  useEffect(() => {
    setCartItems(getCart());
    setCartCount(getCartCount());
    setCartTotal(getCartTotal());

    function onCartUpdate(e) {
      setCartItems((e && e.detail && e.detail.cart) || getCart());
      setCartCount(getCartCount());
      setCartTotal(getCartTotal());
    }

    window.addEventListener('cart.updated', onCartUpdate);
    window.addEventListener('storage', onCartUpdate);
    return () => {
      window.removeEventListener('cart.updated', onCartUpdate);
      window.removeEventListener('storage', onCartUpdate);
    };
  }, []);

  useEffect(() => {
    async function detectCategoryByProduct() {
      if (productId) {
        try {
          const products = await fetchProducts();
          const product = products.find(
            (p) => String(p.id) === String(productId)
          );
          setProductCategoryId(product ? product.category_id : null);
        } catch (err) {
          console.error("Error detecting category:", err);
          setProductCategoryId(null);
        }
      } else {
        setProductCategoryId(null);
      }
    }

    detectCategoryByProduct();
  }, [productId]);

  const handleCategoryClick = (category) => {
    if (category.name.toLowerCase() === 'all') {
      navigate('/');
    } else {
      navigate(`/${category.name.toLowerCase()}`);
    }

    if (window.innerWidth > 900) setMenuOpen(false);
  };

  const isCategoryActive = (category) => {
    const pathname = location.pathname.toLowerCase();

    if (productId && productCategoryId) {
      return String(category.id) === String(productCategoryId);
    }

    if (category.name.toLowerCase() === 'all') {
      return pathname === '/';
    }

    return pathname.startsWith(`/${category.name.toLowerCase()}`);
  };

    async function placeOrder() {
    const items = cartItems.map(item => ({
      product_id: item.productId,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
      attributes: item.attributes || {}
    }));

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
            attributes: JSON.stringify(item.attributes || {})
          }))
        }
      })
    });

    const result = await response.json();

    if (result.data && result.data.placeOrder) {
      clearCart();
    }
  }

  const itemLabel = cartCount === 1 ? `${cartCount} item` : `${cartCount} items`;

  return (
    <>
      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <div
              className={`burger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className={`categories ${menuOpen ? 'open' : ''}`}>
              {categories.map(c => (
                <div
                  key={c.id}
                  className={`category ${isCategoryActive(c) ? "active" : ""}`}
                  onClick={() => handleCategoryClick(c)}
                  data-testid={isCategoryActive(c) ? "active-category-link" : "category-link"}
                >
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          <div className="header-logo">
            <Link to="/" className="logo-box">
              <img src={logo} alt="Logo" className="logo-icon" />
            </Link>
          </div>

          <div className="nav-right">
            <div className="cart-icon" onClick={() => setCartOpen(!cartOpen)}>
              <img src={cartIcon} alt="Cart" className="cart-icon" />
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </nav>
      </header>

      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)}></div>
          <div className="cart-dropdown">
            <div className="cart-content">
              <h2 className="cart-title">
                <span className="cart-title-main">My Bag,</span>
                <span className="cart-title-count">{itemLabel}</span>
              </h2>

              <div className="cart-items">
                {cartItems.length === 0 && <div className="loading">Cart is empty</div>}
                {cartItems.map((item, idx) => (
                  <div className="cart-item" key={`${item.productId}-${idx}`} data-testid='cart-item'>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{(item.price || 0).toFixed ? `$${item.price.toFixed(2)}` : `$${item.price}`}</div>

                      {(item.attributeSets || []).map((attrSet) => {
                        const kebabName = (attrSet.name || '').toLowerCase().replace(/\s+/g, '-');
                        const current = (item.attributes || []).find(a => String(a.attributeId) === String(attrSet.id) || String(a.attributeId) === String(attrSet.attribute_set_id) || String(a.attributeName) === String(attrSet.name));
                        return (
                          <div className="attr-block" key={attrSet.id || attrSet.name} data-testid={`cart-item-attribute-${kebabName}`}>
                            <div className="attr-title">{attrSet.name}:</div>
                            <div className="attr-items-row">
                              {(attrSet.items || []).map(it => {
                                const kebabValue = (it.displayValue || it.value || '').toLowerCase().replace(/\s+/g, '-');
                                const isColor = (attrSet.name || '').toLowerCase().includes('color');
                                const isActive = current && (String(current.itemId) === String(it.id) || String(current.value) === String(it.value));
                                const baseTestId = `cart-item-attribute-${kebabName}-${kebabValue}`;
                                const testId = isActive ? `${baseTestId}-selected` : baseTestId;

                                return isColor ? (
                                  <div
                                    key={it.id}
                                    className={`color-option ${isActive ? 'active' : ''}`}
                                    style={{ background: it.value || it.displayValue }}
                                    data-testid={testId}
                                    aria-hidden={true}
                                  />
                                ) : (
                                  <div
                                    key={it.id}
                                    className={`attr-item ${isActive ? ' active' : ''} size-option`}
                                    data-testid={testId}
                                    aria-hidden={true}
                                  >
                                    {it.displayValue || it.value}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cart-item-qty">
                      <button
                        className="qty-btn"
                        data-testid='cart-item-amount-increase'
                        onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(idx, 1); setCartItems(getCart()); setCartCount(getCartCount()); setCartTotal(getCartTotal()); }}>+</button>
                      <div className="qty-count" data-testid='cart-item-amount'>{item.quantity || 1}</div>
                      <button
                        className="qty-btn"
                        data-testid='cart-item-amount-decrease'
                        onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(idx, -1); setCartItems(getCart()); setCartCount(getCartCount()); setCartTotal(getCartTotal()); }}>-</button>
                    </div>

                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total" data-testid='cart-total'>
                <span>Total</span>
                <span>${cartTotal.toFixed ? cartTotal.toFixed(2) : cartTotal}</span>
              </div>

              <button className={`cart-button ${cartItems.length === 0 ? 'disabled' : ''}`} onClick={placeOrder} disabled={cartItems.length === 0}>PLACE ORDER</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
