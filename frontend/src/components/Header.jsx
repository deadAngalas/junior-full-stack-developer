import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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

  const navigate = useNavigate();
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


  // Category navigation
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

  return (
    <>
      <header className="header">
        <nav className="nav">
          <div className="nav-left">
            <div
              className={`burger ${menuOpen ? 'open' : ''}`}
              onClick={() => {
                setMenuOpen(!menuOpen);
                if (!menuOpen) setCartOpen(false);
              }}
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
                  data-testid={isCategoryActive(c) ? 'active-category-link' : 'category-link'}
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
            <div className="cart-icon" onClick={() => { setCartOpen(!cartOpen); if (!cartOpen) setMenuOpen(false); }}>
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
