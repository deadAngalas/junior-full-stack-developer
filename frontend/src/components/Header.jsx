import { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import './Header.css';
import logo from "../assets/logo.svg";
import cartIcon from "../assets/cart-icon.svg";
import { fetchProducts } from "../api/productService";
import CartOverlay from "./CartOverlay";
import { useCart } from "../hooks/useCart";

export default function Header({ categories }) {
  const [productCategoryId, setProductCategoryId] = useState(null); // used to highlight the active category in the menu
  const [menuOpen, setMenuOpen] = useState(false); // for a mobile burger menu
  const {
    cartOpen,
    setCartOpen,
    cartItems,
    cartCount,
    cartTotal,
    cartRef,
    placeOrder,
    increase,
    decrease
  } = useCart();
  const burgerRef = useRef(null);
  const categoriesRef = useRef(null);

  const location = useLocation();

  const { productId } = useMemo(() => { // caches the result so as not to calculate it unnecessarily for each render
    const pathParts = location.pathname.split("/").filter(Boolean); // delete empty elements
    return {
      categoryName: pathParts[0] || null,
      productId: pathParts[1] || null,
    };
  }, [location.pathname]);


  useEffect(() => {
    if (!productId) {
      setProductCategoryId(null);
      return;
    }

    let cancelled = false;

    fetchProducts()
      .then(products => {
        if (!cancelled) {
          const product = products.find(p => String(p.id) === String(productId));
          setProductCategoryId(product?.category_id || null);
        }
      })
      .catch(err => {
        console.error("Error detecting category:", err);
        if (!cancelled) setProductCategoryId(null);
      });

    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (window.innerWidth > 900) return; // ignore desktop clicks
      const clickedBurger = burgerRef.current?.contains(event.target);
      const clickedCategories = categoriesRef.current?.contains(event.target);
      if (!clickedBurger && !clickedCategories) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [menuOpen]);


  const isCategoryActive = (category) => {
    const pathname = location.pathname.toLowerCase();

    if (productId && productCategoryId) {
      return String(category.id) === String(productCategoryId);
    }

    if (category.name.toLowerCase() === 'all') {
      return pathname === '/' || pathname === '/all' || pathname.startsWith('/all/');
    }

    return pathname.startsWith(`/${category.name.toLowerCase()}`);
  };

  return (
    <>
      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <div
              className={`burger ${menuOpen ? 'open' : ''}`}
              ref={burgerRef}
              onClick={() => {
                setMenuOpen(!menuOpen);
                if (!menuOpen) setCartOpen(false);
              }}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div
              className={`categories ${menuOpen ? 'open' : ''}`}
              ref={categoriesRef}
            >
              {categories.map(c => {
                const path = c.name.toLowerCase() === 'all' ? '/all' : `/${c.name.toLowerCase()}`;
                return (
                  <Link
                    key={c.id}
                    to={path}
                    className={`category ${isCategoryActive(c) ? "active" : ""}`}
                    onClick={() => { if (window.innerWidth <= 900) setMenuOpen(false); }}
                    data-testid={isCategoryActive(c) ? 'active-category-link' : 'category-link'}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="header-logo">
            <Link to="/all" className="logo-box">
              <img src={logo} alt="Logo" className="logo-icon" />
            </Link>
          </div>

          <div className="nav-right">
            <div className="cart-icon" data-testid="cart-btn" onClick={() => { setCartOpen(!cartOpen); if (!cartOpen) setMenuOpen(false); }}>
              <img src={cartIcon} alt="Cart" className="cart-icon"/>
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </nav>
      </header>
      <CartOverlay
        cartOpen={cartOpen}
        cartRef={cartRef}
        cartItems={cartItems}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onClose={() => setCartOpen(false)}
        onIncrease={increase}
        onDecrease={decrease}
        onPlaceOrder={placeOrder}
      />
    </>
  );
}
