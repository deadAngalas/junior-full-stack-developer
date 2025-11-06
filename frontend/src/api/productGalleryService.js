import { FETCH_GALLERIES_QUERY } from "./queries";

export async function fetchProductGallery() {
  try {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: FETCH_GALLERIES_QUERY }),
    });
    const data = await res.json();
    return data.data?.productGallery || [];
  } catch (err) {
    console.error("Error fetching product gallery:", err);
    return [];
  }
}
