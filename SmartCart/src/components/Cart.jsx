import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

export default function Cart({ user }) {
  const [cart, setCart] = useState({ items: [], total: "0" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    const headers = {};
    try { const t = localStorage.getItem('auth_token'); if (t) headers['X-Auth-Token'] = t; } catch (e) { }
    const res = await fetch("http://3.226.254.81:8080/api/cart/", { credentials: "include", headers });
    const data = await res.json();
    if (data.success) setCart(data.cart);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId, qty) => {
    const headers = { "Content-Type": "application/json" };
    try { const t = localStorage.getItem('auth_token'); if (t) headers['X-Auth-Token'] = t; } catch (e) { }
    await fetch("http://3.226.254.81:8080/api/cart/update/", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ item_id: itemId, quantity: qty }),
    });
    fetchCart();
  };

  const removeItem = async (itemId) => {
    const headers = { "Content-Type": "application/json" };
    try { const t = localStorage.getItem('auth_token'); if (t) headers['X-Auth-Token'] = t; } catch (e) { }
    await fetch("http://3.226.254.81:8080/api/cart/remove/", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ item_id: itemId }),
    });
    fetchCart();
  };

  if (!user) {
    return (
      <div className="cart-page">
        <div className="cart-container empty">
          <h3>Please login to view your cart.</h3>
          <button onClick={() => navigate('/login?next=/cart')} style={{
            padding: '0.7rem 1.5rem',
            borderRadius: 14,
            border: 'none',
            background: '#53629E',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #53629E22',
            transition: 'background 0.2s',
            marginTop: 16
          }}>Login</button>
        </div>
      </div>
    );
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h2>Your Cart</h2>
        </div>

        {loading ? (
          <div className="cart-loading">Loading...</div>
        ) : cart.items.length === 0 ? (
          <div className="cart-empty">Your cart is empty.</div>
        ) : (
          <div className="cart-items">
            {cart.items.map((it) => (
              <div key={it.id} className="cart-item">
                <div className="item-image">
                  <img src={it.product.image ? (it.product.image.startsWith('http') ? it.product.image : `http://3.226.254.81:8080${it.product.image}`) : ''} alt={it.product.name} />
                </div>
                <div className="item-info">
                  <div className="item-title">{it.product.name}</div>
                  <div className="item-price">Rs. {parseFloat(it.product.price).toFixed(2)}</div>
                  <div className="item-actions">
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => updateQuantity(it.id, Math.max(1, it.quantity - 1))}>-</button>
                      <div className="qty-count">{it.quantity}</div>
                      <button className="qty-btn" onClick={() => updateQuantity(it.id, it.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeItem(it.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}

            <div className="cart-footer">
              <div className="cart-total">Total: <span className="total-amount">Rs. {parseFloat(cart.total).toFixed(2)}</span></div>
              <div>
                <button className="buy-btn" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
