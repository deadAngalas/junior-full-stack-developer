export const PLACE_ORDER_MUTATION = `
mutation PlaceOrder($items: [OrderItemInput!]!) {
  placeOrder(items: $items) {
    id
    total
    created_at
  }
}
`;
