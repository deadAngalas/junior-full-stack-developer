import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import ProductDetails from "./components/ProductDetails";
import { useEffect, useState } from 'react'
import { fetchProducts } from './api/productService';
import { fetchCategories } from './api/categoryService';
import './App.css'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:categoryName" element={<CategoryPage />} />
        <Route path="/:categoryName/:productId" element={<ProductDetails />} />
      </Routes>
    </Router>
  );
}

function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const productsData = await fetchProducts();
        setProducts(productsData);
      } catch (err) {
        console.error("Error loading products:", err);
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  return (
    <MainContent 
      activeCategory={{ name: "All" }} 
      products={products}
    />
  );
}

function CategoryPage() {
  const { categoryName } = useParams();
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const categories = await fetchCategories();
         const currentCategory = categories.find(
          (c) => c.name.toLowerCase() === categoryName?.toLowerCase()
        );
        
        if (currentCategory) {
          setActiveCategory(currentCategory);
        }

        const productsData = await fetchProducts(currentCategory.id);
        setProducts(productsData);
      } catch (err) {
        console.error("Error loading data:", err);
        setProducts([]);
      }
    }

    if (categoryName) {
      loadData();
    }
  }, [categoryName]);

  return (
    <MainContent 
      activeCategory={activeCategory} 
      products={products}
    />
  );
}

export default App;