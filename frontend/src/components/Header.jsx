import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import './Header.css';
import logo from "../assets/logo.svg";
import cartIcon from "../assets/cart-icon.svg";
import { fetchCategories } from "../api/categoryService";
import { fetchProducts } from "../api/productService";
import { getCart, getCartCount, getCartTotal, removeCartItem, setCartItemQuantity, updateCartItemQuantity, updateCartItemAttributes } from '../utils/cart';

export default function Header() {
  const [categories, setCategories] = useState([]);
  const [productCategoryId, setProductCategoryId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const productId = location.pathname.startsWith('/product/')
    ? location.pathname.split('/product/')[1]
    : null;


  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error loading categories", err);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    // initialize cart state
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
    async function loadProductCategory() {
      if (location.pathname.startsWith('/product/') && productId) {
        try {
          const products = await fetchProducts();
          const product = products.find(p => p.id === productId);
          if (product && product.category_id) {
            setProductCategoryId(product.category_id);
          }
        } catch (err) {
          console.error("Error loading product category:", err);
        }
      } else {
        setProductCategoryId(null);
      }
    }

    loadProductCategory();
  }, [location.pathname, productId]);

  const handleCategoryClick = (category) => {
    if (category.name.toLowerCase() === 'all') {
      navigate('/');
    } else {
      navigate(`/category/${category.id}`);
    }

    if (window.innerWidth > 900) {
      setMenuOpen(false);
    }
  };

  const isCategoryActive = (category) => {
    if (location.pathname.startsWith('/product/') && productCategoryId !== null) {
      const isActive = parseInt(category.id) === parseInt(productCategoryId);
      return isActive;
    }

    if (category.name.toLowerCase() === 'all') {
      return location.pathname === '/';
    }
    return location.pathname === `/category/${category.id}`;
  };

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
                >
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          <div className="header__logo">
            <Link to="/" className="logo-box">
              <img src={logo} alt="Logo" className="logo-icon" />
            </Link>
          </div>

          <div className="nav-right">
            <div className="cart-icon" onClick={() => setCartOpen(!cartOpen)}>
              <img src={cartIcon} alt="Cart" className="cart-icon" />
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
              <span className="cart-title-count">{cartCount} items</span>
            </h2>

            <div className="cart-items">
              {cartItems.length === 0 && <div className="loading">Cart is empty</div>}
              {cartItems.map((item, idx) => (
                <div className="cart-item" key={`${item.productId}-${idx}`}>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{(item.price || 0).toFixed ? `$${item.price.toFixed(2)}` : `$${item.price}`}</div>

                    {/* Render attribute option blocks using stored attributeSets or fallback to attributes */}
                    {(item.attributeSets || []).map((attrSet) => {
                      const setId = attrSet.id || attrSet.attribute_set_id || attrSet.attributeId || attrSet.attribute_id || attrSet.name;
                      // find current selected item for this set from item.attributes
                      const current = (item.attributes || []).find(a => String(a.attributeId) === String(attrSet.id) || String(a.attributeId) === String(attrSet.attribute_set_id) || String(a.attributeName) === String(attrSet.name));
                      return (
                        <div className="attr-block" key={attrSet.id || attrSet.name}>
                          <div className="attr-title">{attrSet.name}:</div>
                          <div className="attr-items-row">
                            {(attrSet.items || []).map(it => {
                              const isColor = (attrSet.name || '').toLowerCase().includes('color') || (attrSet.name || '').toLowerCase().includes('цвет');
                              const isActive = current && (String(current.itemId) === String(it.id) || String(current.value) === String(it.value));
                              // render display-only controls (no onClick)
                              return isColor ? (
                                <div
                                  key={it.id}
                                  className={`color-option ${isActive ? 'active' : ''}`}
                                  style={{ background: it.value || it.displayValue }}
                                  aria-hidden={true}
                                />
                              ) : (
                                <div
                                  key={it.id}
                                  className={`attr-item ${isActive ? ' active' : ''} size-option`}
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
                    <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(idx, 1); setCartItems(getCart()); setCartCount(getCartCount()); setCartTotal(getCartTotal()); }}>+</button>
                    <div className="qty-count">{item.quantity || 1}</div>
                    <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(idx, -1); setCartItems(getCart()); setCartCount(getCartCount()); setCartTotal(getCartTotal()); }}>-</button>
                  </div>

                  <div className="cart-item-image">
                    <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} />
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <span>${cartTotal.toFixed ? cartTotal.toFixed(2) : cartTotal}</span>
            </div>

            <button className="cart-button">PLACE ORDER</button>
          </div>
        </div>
        </>
      )}
    </>
  );
}
