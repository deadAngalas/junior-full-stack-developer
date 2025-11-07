import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import ProductDetails from "./components/ProductDetails";
import { useEffect, useState } from 'react'
import { fetchProducts } from './api/productService';
import { fetchCategories } from './api/categoryService';
import './App.css'

function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
    }
    loadData();
  }, []);


  return (
    <Router>
      <Header categories={categories}/>
      <Routes>
        <Route path="/" element={<HomePage categories={categories} products={products} />} />
        <Route path="/:categoryName" element={<CategoryPage categories={categories} products={products} />} />
        <Route path="/:categoryName/:productId" element={<ProductDetails />} />
      </Routes>
    </Router>
  );
}

function HomePage({ products, categories }) {
  const productsWithCategory = products.map(p => {
    const category = categories.find(c => c.id === p.category_id);
    return {
      ...p,
      categoryName: category?.name || 'All'
    };
  });

  return (
    <MainContent
      activeCategory={{ name: "All" }}
      products={productsWithCategory}
    />
  );
}

function CategoryPage({ products, categories }) {
  const { categoryName } = useParams();

  const activeCategory = categories.find(
    (c) => c.name.toLowerCase() === categoryName?.toLowerCase()
  );

  const filteredProducts = products
    .map(p => {
      const cat = categories.find(c => c.id === p.category_id);
      return { ...p, categoryName: cat?.name || 'All' };
    })
    .filter(p => p.category_id === activeCategory?.id);

  return (
    <MainContent 
      activeCategory={activeCategory} 
      products={filteredProducts} 
    />
  );
}


export default App;