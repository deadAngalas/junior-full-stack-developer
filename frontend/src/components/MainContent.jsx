import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainContent.css";
import { addToCart } from '../utils/cart';

export default function MainContent({ activeCategory, products }) {
  const navigate = useNavigate();

  const handleProductClick = (product) => {
  const categoryPart = product.categoryName.toLowerCase() !== 'all'
    ? `/${product.categoryName.toLowerCase()}`
    : '';

  navigate(`${categoryPart}/${product.id}`);
  };

  const formatCategoryName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <main className="main-content">
      <h1 className="category-title">{formatCategoryName(activeCategory?.name)}</h1>

      {products.length === 0 && <p>No products found</p>}

      <div className="products-list">
        {products.map((p) => (
          <div
            key={p.id}
            className={`product-card ${!p.in_stock ? "out-of-stock" : ""}`}
            onClick={() => handleProductClick(p)}
            data-testid={`product-${(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            <div className="product-gallery">
              {p.gallery?.length > 0 && (
                <img src={p.gallery[0].image_url} alt={p.name} />
              )}

              {!p.in_stock && (
                <div className="out-of-stock-label">OUT OF STOCK</div>
              )}
            </div>

            <div className="product-info">
              <p className="product-name">{p.name}</p>
              <p className={`product-price ${!p.in_stock ? "out-of-stock" : ""}`}>
                {p.priceDisplay}
              </p>
            </div>

            {p.in_stock && (
              <div
                className="hover-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  const defaultAttributes = (p.attributes || []).map((aset) => {
                    const first = aset.items && aset.items.length ? aset.items[0] : null;
                    return first
                      ? {
                          attributeId: aset.id,
                          attributeName: aset.name,
                          itemId: first.id,
                          value: first.value,
                          displayValue: first.displayValue || first.value,
                        }
                      : {
                          attributeId: aset.id,
                          attributeName: aset.name,
                          itemId: null,
                          value: null,
                          displayValue: null,
                        };
                  });

                  addToCart(p, defaultAttributes, 1);
                  window.dispatchEvent(new Event('cart.open'));
                }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
