import { FETCH_CATEGORIES_QUERY } from "./queries";

let cachedCategories = null;

export async function fetchCategories() {
  if (cachedCategories) {
    return cachedCategories;
  }

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
    
    cachedCategories = result.data.categories;
    return cachedCategories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}
