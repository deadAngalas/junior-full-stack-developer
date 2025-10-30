export async function fetchPrices() {
  const query = `
    query {
      prices {
        id
        product_id
        currency_id
        amount
      }
    }
  `;

  try {
    const res = await fetch("/api/graphql.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const result = await res.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return [];
    }

    return result.data.prices;
  } catch (err) {
    console.error("Error fetching prices:", err);
    return [];
  }
}
