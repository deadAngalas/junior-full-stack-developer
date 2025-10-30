import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api/productService';
import parse from 'html-react-parser';
import './ProductDetails.css';

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});



  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const products = await fetchProducts();
      const foundProduct = products.find(p => p.id === productId);
      if (foundProduct) setProduct(foundProduct);
      setLoading(false);
    }
    if (productId) loadProduct();
  }, [productId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  const isClothes = product.category_id === 2 || (product.attributes || []).some(a => a.name.toLowerCase().includes('size') || a.name.toLowerCase().includes('размер'));
  const sizes = product.attributes?.find(a => a.name.toLowerCase().includes('size') || a.name.toLowerCase().includes('размер'))?.items || [];
  const colors = product.attributes?.find(a => a.name.toLowerCase().includes('color') || a.name.toLowerCase().includes('цвет'))?.items || [];
  const otherAttributes = (product.attributes || []).filter(a =>
    !a.name.toLowerCase().includes('size') &&
    !a.name.toLowerCase().includes('color')
  );
  console.log(product.attributes);
  console.log(otherAttributes);

  const gallery = product.gallery || [];
  const mainImage = gallery[activeGalleryIdx]?.image_url || gallery[0]?.image_url;
  const priceObj = product.prices?.[0];
  const priceDisplay = priceObj ? `${priceObj.currency?.symbol || ''}${priceObj.amount?.toFixed(2)}` : '-';
  const inStock = !!product.in_stock;

  const handleSlide = dir => {
    if (!gallery.length) return;
    setActiveGalleryIdx(idx => {
      let nextIdx = idx + dir;
      if (nextIdx < 0) nextIdx = gallery.length - 1;
      if (nextIdx >= gallery.length) nextIdx = 0;
      return nextIdx;
    });
  };

  function handleAddToCart() {
    alert('Added to cart!');
  }

  return (
    <div className="product-details-three-col">
        <div className="gallery-thumbs">
          {gallery.slice(0, 5).map((img, idx) => (
            <img
              key={idx}
              src={img?.image_url || ''}
              alt={product.name || ''}
              className={`gallery-thumb${idx === activeGalleryIdx ? ' active' : ''}`}
              onClick={() => setActiveGalleryIdx(idx)}
            />
          ))}
        </div>
      <div className="product-main-image-col">
        <div className="gallery-main">
          {gallery.length > 0 && (
            <>
              <img
                src={mainImage}
                alt={product.name}
                className=""
              />
              <button className="gallery-arrow left" onClick={() => handleSlide(-1)}>&lt;</button>
              <button className="gallery-arrow right" onClick={() => handleSlide(1)}>&gt;</button>
            </>
          )}
        </div>
      </div>
      <div className="product-info-panel">
        <h1 className="product-title">{product.name}</h1>
        {isClothes && sizes.length > 0 && (
          <div className="product-sizes">
            <div className="attr-title">SIZE:</div>
            <div className="sizes-row">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  className={`size-button${selectedSize === s.value ? ' active' : ''}`}
                  onClick={() => setSelectedSize(s.value)}
                >
                  {s.displayValue || s.value}
                </button>
              ))}
            </div>
          </div>
        )}
        {colors.length > 0 && (
          <div className="product-colors">
            <div className="attr-title">COLOR:</div>
            <div className="colors-row">
            {colors.map((c, index) => (
              <button
                key={`${c.value}-${index}`}
                className={`color-button${selectedColor === c.value ? ' active' : ''}`}
                onClick={() => setSelectedColor(c.value)}
                style={{ background: c.value }}
              />
            ))}
            </div>
          </div>
        )}
        {!isClothes && otherAttributes.length > 0 && (
          <>
            {otherAttributes.map(attr => (
              <div key={attr.id} className="product-attr-block">
                <div className="attr-title">{attr.name}:</div>
                <div className="attr-items-row">
                  {attr.items?.map(item => {
                    const isActive = selectedAttributes[attr.name] === item.value;
                    return (
                      <button
                        key={item.id}
                        className={`attr-item${isActive ? ' active' : ''}`}
                        onClick={() =>
                          setSelectedAttributes(prev => ({
                            ...prev,
                            [attr.name]: item.value
                          }))
                        }
                      >
                        {item.displayValue || item.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
        <div className="product-price-block">
          <div className="attr-title">PRICE:</div>
          <div className="product-price-details">{priceDisplay}</div>
        </div>
        <button className="add-to-cart" disabled={!inStock} onClick={handleAddToCart}>
          {inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>
        <div className="product-desc">
          {product.description 
            ? parse(product.description)
            : <em>No description.</em>
          }
        </div>
      </div>
    </div>
  );
}