import { FETCH_GALLERIES_QUERY } from "./queries";
import { fetchGraphQL } from "../utils/graphql";

export async function fetchProductGallery() {
  return fetchGraphQL(FETCH_GALLERIES_QUERY, {}, data => data.productGallery || []);
}
