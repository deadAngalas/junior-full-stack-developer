export default function CartOverlay({
  cartOpen,
  cartRef,
  cartItems,
  cartCount,
  cartTotal,
  onClose,
  onIncrease,
  onDecrease,
  onPlaceOrder,
}) {
  if (!cartOpen) return null;

  const itemLabel =
    cartCount === 1 ? `${cartCount} item` : `${cartCount} items`;

  return (
    <>
      <div className="overlay" onClick={onClose}></div>

      <div className="cart-dropdown" ref={cartRef}>
        <div className="cart-content">
          <h2 className="cart-title">
            <span className="cart-title-main">My Bag,</span>
            <span className="cart-title-count">{itemLabel}</span>
          </h2>

          <div className="cart-items">
            {cartItems.length === 0 && (
              <div className="loading">Cart is empty</div>
            )}

            {cartItems.map((item, idx) => (
              <div
                className="cart-item"
                key={`${item.productId}-${idx}`}
                data-testid="cart-item"
              >
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">
                    { (item.price || 0).toFixed
                      ? `$${item.price.toFixed(2)}`
                      : `$${Number(item.price || 0).toFixed(2)}`
                    }
                  </div>

                  {(item.attributeSets || []).map((attrSet) => {
                    const kebabName = (attrSet.name || "")
                      .toLowerCase()
                      .replace(/\s+/g, "-");

                    const current = (item.attributes || []).find(
                      (a) =>
                        String(a.attributeId) === String(attrSet.id) ||
                        String(a.attributeId) === String(attrSet.attribute_set_id) ||
                        String(a.attributeName) === String(attrSet.name)
                    );

                    return (
                      <div
                        className="attr-block"
                        key={attrSet.id || attrSet.name}
                        data-testid={`cart-item-attribute-${kebabName}`}
                      >
                        <div className="attr-title">{attrSet.name}:</div>

                        <div className="attr-items-row">
                          {(attrSet.items || []).map((it) => {
                            const isColor = attrSet.name
                              .toLowerCase()
                              .includes("color");

                            const isActive =
                              current &&
                              (String(current.itemId) === String(it.id) ||
                                String(current.value) === String(it.value));

                            return isColor ? (
                              <div
                                key={it.id}
                                className={`color-option ${
                                  isActive ? "active" : ""
                                }`}
                                style={{
                                  background:
                                    it.value || it.displayValue,
                                }}
                              />
                            ) : (
                              <div
                                key={it.id}
                                className={`attr-item ${
                                  isActive ? "active" : ""
                                }`}
                              >
                                {it.value}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}ун
                </div>

                <div className="cart-item-qty">
                  <button
                    className="qty-btn"
                    data-testid="cart-item-amount-increase"
                    onClick={() => onIncrease(idx)}
                  >
                    +
                  </button>

                  <div
                    className="qty-count"
                    data-testid="cart-item-amount"
                  >
                    {item.quantity || 1}
                  </div>

                  <button
                    className="qty-btn"
                    data-testid="cart-item-amount-decrease"
                    onClick={() => onDecrease(idx)}
                  >
                    -
                  </button>
                </div>

                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total" data-testid="cart-total">
            <span>Total</span>
            <span>${cartTotal}</span>
          </div>

          <button
            className={`cart-button ${
              cartItems.length === 0 ? "disabled" : ""
            }`}
            onClick={onPlaceOrder}
            disabled={cartItems.length === 0}
          >
            PLACE ORDER
          </button>
        </div>
      </div>
    </>
  );
}
