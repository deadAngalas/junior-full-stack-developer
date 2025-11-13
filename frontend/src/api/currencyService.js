import { FETCH_CURRENCIES_QUERY } from "./queries";
import { fetchGraphQL } from "../utils/graphql";

export async function fetchCurrencies() {
  return fetchGraphQL(FETCH_CURRENCIES_QUERY, {}, data => data.currencies);
}
