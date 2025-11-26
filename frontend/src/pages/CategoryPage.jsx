import { useParams } from "react-router-dom";
import MainContent from "../components/MainContent";

export default function CategoryPage({ products, categories }) {
  const { categoryName } = useParams();

  const activeCategory =
    categories.find(
      (c) => c.name.toLowerCase() === categoryName?.toLowerCase()
    ) || { id: null, name: "All" };

  const filteredProducts = products
    .map((p) => {
      const cat = categories.find((c) => c.id === p.category_id);
      return {
        ...p,
        categoryName: cat?.name || "All",
      };
    })
    .filter((p) => p.category_id === activeCategory?.id);

  return (
    <MainContent
      activeCategory={activeCategory}
      products={filteredProducts}
    />
  );
}
