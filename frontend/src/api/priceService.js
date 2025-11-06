import { FETCH_PRICES_QUERY } from "./queries";

export async function fetchPrices() {

  try {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: FETCH_PRICES_QUERY }),
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
