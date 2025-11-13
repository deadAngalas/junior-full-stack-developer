import { FETCH_PRODUCTS_QUERY } from "./queries";
import { fetchGraphQL } from "../utils/graphql";

export async function fetchProducts(categoryId = null) {
  return fetchGraphQL(
    FETCH_PRODUCTS_QUERY,
    categoryId ? { categoryId } : {},
    data =>
      (data.products || []).map(p => {
        const price = p.prices?.[0];
        return {
          ...p,
          gallery: p.gallery || [],
          priceDisplay: price
            ? `${price.currency?.symbol || ""}${price.amount.toFixed(2)}`
            : "—",
        };
      })
  );
}
