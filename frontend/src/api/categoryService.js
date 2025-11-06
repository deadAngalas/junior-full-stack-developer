import { FETCH_CATEGORIES_QUERY } from "./queries";

export async function fetchCategories() {
  try {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: FETCH_CATEGORIES_QUERY }),
    });

    const result = await res.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return [];
    }

    return result.data.categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}
