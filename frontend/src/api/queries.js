export const FETCH_CATEGORIES_QUERY = `
  query {
    categories {
      id
      name
    }
  }
`;

export const FETCH_CURRENCIES_QUERY = `
  query {
    currencies {
      id
      label
      symbol
    }
  }
`;

export const FETCH_PRICES_QUERY = `
  query {
    prices {
      id
      product_id
      currency_id
      amount
  }
`;

export const FETCH_GALLERIES_QUERY = `
  query {
    productGallery {
      id
      product_id
      image_url
    } 
  }
`;

export const FETCH_PRODUCTS_QUERY = `
  query ($categoryId: Int) {
    products(categoryId: $categoryId) {
      id
      name
      description
      in_stock
      brand
      category_id
      gallery {
        id
        image_url
      }
      prices {
        amount
        currency {
          symbol
        }
      }
      attributes {
        id
        name
        type
        items {
         id
          displayValue
          value
        }
      }
    }
  }
`;