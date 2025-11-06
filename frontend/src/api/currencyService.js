import { FETCH_CURRENCIES_QUERY } from "./queries";

export async function fetchCurrencies() {

  try {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: FETCH_CURRENCIES_QUERY }),
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
