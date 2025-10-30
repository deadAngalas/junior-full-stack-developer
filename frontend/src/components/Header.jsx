import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import './Header.css';
import logo from "../assets/logo.svg";
import cartIcon from "../assets/cart-icon.svg";
import { fetchCategories } from "../api/categoryService";
import { fetchProducts } from "../api/productService";

export default function Header() {
  const [categories, setCategories] = useState([]);
  const [productCategoryId, setProductCategoryId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
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
          <div className="cart-icon">
            <img src={cartIcon} alt="Cart" className="cart-icon" />
          </div>
        </div>
      </nav>
    </header>
  );
}
