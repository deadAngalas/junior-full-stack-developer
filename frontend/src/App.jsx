import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from "./components/Header";
import ProductDetails from "./components/ProductDetails";
import { useEffect, useState } from 'react'
import { fetchProducts } from './api/productService';
import { fetchCategories } from './api/categoryService';
import CategoryPage from './pages/CategoryPage';
import './App.css'

function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProducts()]) // simultaneously executes and waits
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch(console.error);
  }, []);

  return (
    <Router>
      <Header categories={categories} />
      <Routes>
        <Route path="/" element={<Navigate to="/all" replace />} />
        <Route path="/:categoryName" element={<CategoryPage categories={categories} products={products} />} />
        <Route path="/:categoryName/:productId" element={<ProductDetails />} />
      </Routes>
    </Router>
  );
}

export default App;