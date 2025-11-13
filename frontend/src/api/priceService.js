import { FETCH_PRICES_QUERY } from "./queries";
import { fetchGraphQL } from "../utils/graphql";

export async function fetchPrices() {
  return fetchGraphQL(FETCH_PRICES_QUERY, {}, data => data.prices);
}
