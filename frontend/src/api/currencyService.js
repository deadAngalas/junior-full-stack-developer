export async function fetchCurrencies() {
  const query = `
    query {
      currencies {
        id
        label
        symbol
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

    return result.data.currencies;
  } catch (err) {
    console.error("Error fetching currencies:", err);
    return [];
  }
}
