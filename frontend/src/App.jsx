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
  const [categories, setCategories] = useState([]);


  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);

        setCategories(categoriesData);

        const productsWithCategory = productsData.map(p => {
          const category = categoriesData.find(c => c.id === p.category_id);
          return {
            ...p,
            categoryName: category?.name || 'All'
          };
        });

        setProducts(productsWithCategory);
      } catch (err) {
        console.error("Error loading products or categories:", err);
        setProducts([]);
      }
    }

    loadData();
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
        const [categories, productsData] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);

        console.log("Fetched categories:", categories);
        console.log("Fetched products:", productsData);

        const currentCategory = categories.find(
          (c) => c.name.toLowerCase() === categoryName?.toLowerCase()
        );

        console.log("Current category:", currentCategory);

        if (currentCategory) setActiveCategory(currentCategory);

        const productsWithCategory = productsData
          .map(p => {
            const cat = categories.find(c => c.id === p.category_id);
            return { ...p, categoryName: cat?.name || 'All' };
          })
          .filter(p => p.category_id === currentCategory?.id);

        console.log("Products for this category:", productsWithCategory);

        setProducts(productsWithCategory);
      } catch (err) {
        console.error("Error loading data:", err);
        setProducts([]);
      }
    }

    if (categoryName) loadData();
  }, [categoryName]);

  return (
    <MainContent 
      activeCategory={activeCategory} 
      products={products} 
    />
  );
}

export default App;