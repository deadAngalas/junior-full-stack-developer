import { FETCH_CATEGORIES_QUERY } from "./queries";
import { fetchGraphQL } from "../utils/graphql";

let cachedCategories = null;

export async function fetchCategories() {
  if (cachedCategories) return cachedCategories;

  cachedCategories = await fetchGraphQL(
    FETCH_CATEGORIES_QUERY,
    {},
    data => data.categories
  );

  return cachedCategories;
}
