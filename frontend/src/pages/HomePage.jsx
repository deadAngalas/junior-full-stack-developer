import MainContent from "../components/MainContent";

export default function HomePage({ products, categories }) {
  const productsWithCategory = products.map(p => {
    const category = categories.find(c => c.id === p.category_id);
    return {
      ...p,
      categoryName: category?.name || "All",
    };
  });

  return (
    <MainContent
      activeCategory={{ name: "All" }}
      products={productsWithCategory}
    />
  );
}
