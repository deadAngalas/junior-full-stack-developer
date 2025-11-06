import { FETCH_PRODUCTS_QUERY } from "./queries";

export async function fetchProducts(categoryId = null) {
  const variables = categoryId ? { categoryId } : {};

  try {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: FETCH_PRODUCTS_QUERY, variables }),
    });

    const json = await res.json();
    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
      return [];
    }

    return (json.data.products || []).map((p) => {
      const price = p.prices?.[0];
      return {
        ...p,
        gallery: p.gallery || [],
        priceDisplay: price
          ? `${price.currency?.symbol || ""}${price.amount.toFixed(2)}`
          : "—",
      };
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}
