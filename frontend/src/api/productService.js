const GRAPHQL_URL = "/api/graphql.php";

export async function fetchProducts(categoryId = null) {
  const query = `
    query ($categoryId: Int) {
      products(categoryId: $categoryId) {
        id
        name
        description
        in_stock
        brand
        category_id
        gallery {
          id
          image_url
        }
        prices {
          amount
          currency {
            symbol
          }
        }
        attributes {
          id
          name
          type
          items {
            id
            displayValue
            value
          }
        }
      }
    }
  `;

  const variables = categoryId ? { categoryId } : {};

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
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
