import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProducts } from "../api/productService";
import parse from "html-react-parser";
import { addToCart } from "../utils/cart";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const products = await fetchProducts();
      const found = products.find((p) => String(p.id) === String(productId));
      if (found) setProduct(found);
      setLoading(false);
    }
    if (productId) loadProduct();
  }, [productId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  const gallery = product.gallery || [];
  const mainImage =
    gallery[activeGalleryIdx]?.image_url || gallery[0]?.image_url;
  const priceObj = product.prices?.[0];
  const priceDisplay = priceObj
    ? `${priceObj.currency?.symbol || ""}${priceObj.amount?.toFixed(2)}`
    : "-";
  const inStock = !!product.in_stock;

  const allAttributes = product.attributes || [];
  const allSelected = allAttributes.every(
    (attr) => selectedAttributes[attr.name]
  );
  const canAddToCart = inStock && allSelected;

  const handleSlide = (dir) => {
    if (!gallery.length) return;
    setActiveGalleryIdx((idx) => {
      let nextIdx = idx + dir;
      if (nextIdx < 0) nextIdx = gallery.length - 1;
      if (nextIdx >= gallery.length) nextIdx = 0;
      return nextIdx;
    });
  };

  const handleSelect = (attrName, value) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: value,
    }));
  };

  const handleAddToCart = () => {
    const selected = allAttributes.map((attr) => {
      const items = attr.items || [];
      const selectedValue = selectedAttributes[attr.name];
      const item = items.find((i) => i.value === selectedValue) || items[0];
      return {
        attributeId: attr.id,
        attributeName: attr.name,
        itemId: item?.id,
        value: item?.value,
        displayValue: item?.displayValue || item?.value,
      };
    });

    addToCart(product, selected, 1);
    window.dispatchEvent(new Event("cart.open"));
  };

  return (
    <div className="product-details-three-col">
      {/* Left column — thumbnails */}
      <div className="gallery-thumbs" data-testid="product-gallery">
        {gallery.map((img, idx) => (
          <img
            key={idx}
            src={img?.image_url || ""}
            alt={product.name || ""}
            className={`gallery-thumb${
              idx === activeGalleryIdx ? " active" : ""
            }`}
            onClick={() => setActiveGalleryIdx(idx)}
          />
        ))}
      </div>

      {/* Center column — main image */}
      <div className="product-main-image-col">
        <div className="gallery-main">
          {gallery.length > 0 && (
            <>
              <img src={mainImage} alt={product.name} />
              <button
                className="gallery-arrow left"
                onClick={() => handleSlide(-1)}
              >
                &lt;
              </button>
              <button
                className="gallery-arrow right"
                onClick={() => handleSlide(1)}
              >
                &gt;
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right column — info and attributes */}
      <div className="product-info-panel">
        <h1 className="product-title">{product.name}</h1>

        {/* Dynamic attributes */}
        {allAttributes.map((attr) => {
          const kebab = (attr.name || "").toLowerCase().replace(/\s+/g, "-");
          const isColor =
            attr.type === "swatch" || attr.name.toLowerCase() === "color";
          const items = attr.items || [];

          return (
            <div
              key={attr.id}
              className="product-attr-block"
              data-testid={`product-attribute-${kebab}`}
            >
              <div className="attr-title">{attr.name.toUpperCase()}:</div>
              <div
                className={`attr-items-row ${
                  isColor ? "color-options" : "text-options"
                }`}
              >
                {items.map((item) => {
                  const selected = selectedAttributes[attr.name] === item.value;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(attr.name, item.value)}
                      className={`${isColor ? "color-button" : "size-button"}${
                        selected ? " active" : ""
                      }`}
                      style={isColor ? { backgroundColor: item.value } : {}}
                    >
                      {!isColor && (item.displayValue || item.value)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Price */}
        <div className="product-price-block">
          <div className="attr-title">PRICE:</div>
          <div className="product-price-details">{priceDisplay}</div>
        </div>

        {/* Add to cart */}
        <button
          className="add-to-cart"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
          data-testid="add-to-cart"
        >
          {inStock ? "ADD TO CART" : "OUT OF STOCK"}
        </button>

        {/* Description */}
        <div className="product-desc" data-testid="product-description">
          {product.description ? (
            parse(product.description)
          ) : (
            <em>No description.</em>
          )}
        </div>
      </div>
    </div>
  );
}
