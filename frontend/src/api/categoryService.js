export async function fetchCategories() {
  const query = `
    query {
      categories {
        id
        name
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

    return result.data.categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
}
