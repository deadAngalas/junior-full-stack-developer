export async function fetchProductGallery() {
  try {
    const res = await fetch("/api/graphql.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
            productGallery {
              id
              product_id
              image_url
            }
          }
        `,
      }),
    });
    const data = await res.json();
    return data.data?.productGallery || [];
  } catch (err) {
    console.error("Error fetching product gallery:", err);
    return [];
  }
}
