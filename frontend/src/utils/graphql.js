export async function fetchGraphQL(query, variables = {}, extractData = data => data) {
    try {
        const res = await fetch("/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
        });

        const json = await res.json();

        if (json.errors) {
            console.error("GraphQL errors:", json.errors);
            return [];
        }

        return extractData(json.data);
    } catch (err) {
        console.error("GraphQL request failed:", err);
        return [];
    }
}
