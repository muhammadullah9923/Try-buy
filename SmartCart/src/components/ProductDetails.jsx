import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "./Toast";
import VirtualTryOn from "./VirtualTryOn";

export default function ProductDetails({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const product = location.state?.product;
  const [tryingProduct, setTryingProduct] = useState(null);
  if (!product) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #D6F4ED 0%, #87BAC3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: 18, boxShadow: '0 4px 24px 0 #53629E33, 0 1.5px 6px 0 #87BAC333', minWidth: 340, textAlign: 'center' }}>
          <h2 style={{ color: '#473472', fontWeight: 800, marginBottom: 24 }}>Product not found</h2>
          <button onClick={() => navigate("/home")}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: 14,
              border: 'none',
              background: '#53629E',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #53629E22',
              transition: 'background 0.2s'
            }}
          >Back to Home</button>
        </div>
      </div>
    );
  }

  const isLoggedIn = Boolean(user);

  const handleAddToCart = async () => {
    // Validate product
    if (!product || !product.id) {
      toast.error('Invalid product. Please try again.');
      return;
    }

    // Restrict vendors and admins from adding to cart
    if (user && user.role === 'vendor') {
      toast.warning('Vendors cannot add items to cart. Please use a customer account.');
      return;
    }
    if (user && user.role === 'admin') {
      toast.warning('Admins cannot add items to cart. Please use a customer account.');
      return;
    }

    // Check authentication - redirect if not logged in
    if (!isLoggedIn) {
      localStorage.setItem('post_login_action', JSON.stringify({ 
        type: 'add_to_cart', 
        product_id: product.id,
        product_name: product.name || ''
      }));
      navigate(`/login?next=/product/${product.id}`);
      return;
    }

    // Prepare request
    const headers = { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['X-Auth-Token'] = token;
    }

    try {
      // Send request to backend
      const res = await fetch("http://127.0.0.1:8000/api/cart/add/", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      // Parse response
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }

      // Handle response
      if (data.success) {
        toast.success("Added to cart successfully!");
      } else {
        const errorMsg = data.message || 'Failed to add to cart';
        
        // Check if authentication error
        if (res.status === 401 || errorMsg.toLowerCase().includes('authentication') || errorMsg.toLowerCase().includes('log in')) {
          localStorage.setItem('post_login_action', JSON.stringify({ 
            type: 'add_to_cart', 
            product_id: product.id,
            product_name: product.name || ''
          }));
          navigate(`/login?next=/product/${product.id}`);
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      // Handle network errors and other failures
      console.error('Add to cart error:', error);
      
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Network request failed')) {
        toast.error('Network error: Please check your internet connection.');
      } else if (error.message.includes('401') || error.message.toLowerCase().includes('authentication')) {
        // Authentication expired
        localStorage.setItem('post_login_action', JSON.stringify({ 
          type: 'add_to_cart', 
          product_id: product.id,
          product_name: product.name || ''
        }));
        navigate(`/login?next=/product/${product.id}`);
      } else {
        toast.error(error.message || 'Failed to add to cart. Please try again.');
      }
    }
  };

  const handleTryOn = () => {
    // Restrict vendors and admins from using try-on
    if (user && user.role === 'vendor') {
      toast.warning('Vendors cannot use virtual try-on. Please use a customer account.');
      return;
    }
    if (user && user.role === 'admin') {
      toast.warning('Admins cannot use virtual try-on. Please use a customer account.');
      return;
    }
    
    if (!isLoggedIn) {
      localStorage.setItem('post_login_action', JSON.stringify({ 
        type: 'try_on', 
        product_id: product.id 
      }));
      navigate(`/login?next=/product/${product.id}`);
      return;
    }
    setTryingProduct(product);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #D6F4ED 0%, #87BAC3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        padding: '2.5rem 2rem',
        borderRadius: 18,
        boxShadow: '0 4px 24px 0 #53629E33, 0 1.5px 6px 0 #87BAC333',
        minWidth: 340,
        maxWidth: 500,
        width: '100%',
        textAlign: 'center'
      }}>
        <img src={product.image ? (product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`) : ''} alt={product.name} style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, boxShadow: '0 2px 12px #87BAC322', marginBottom: 18 }} />
        <h2 style={{ margin: '1rem 0 0.5rem 0', fontWeight: 700, fontSize: 28, color: '#473472' }}>{product.name}</h2>
        <p style={{ fontWeight: 700, color: '#53629E', fontSize: 20, marginBottom: 18 }}>{product.price}</p>
        <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center', gap: 18 }}>
          <button style={{
            padding: '0.7rem 1.5rem',
            borderRadius: 14,
            border: 'none',
            background: '#53629E',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #53629E22',
            transition: 'background 0.2s'
          }} onClick={handleAddToCart}>Add to Cart</button>
          <button style={{
            padding: '0.7rem 1.5rem',
            borderRadius: 14,
            border: 'none',
            background: '#473472',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #53629E22',
            transition: 'background 0.2s'
          }} onClick={handleTryOn}>Try On</button>
        </div>
        <button onClick={() => navigate(-1)} style={{
          padding: '0.5rem 1.2rem',
          borderRadius: 12,
          border: 'none',
          background: '#D6F4ED',
          color: '#473472',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 1px 4px #87BAC322',
          marginTop: 10
        }}>Back</button>
      </div>

      {/* Try-On Modal */}
      {tryingProduct && (
        <VirtualTryOn
          product={tryingProduct}
          onClose={() => setTryingProduct(null)}
          onAddToCart={handleAddToCart}
          user={user}
        />
      )}
    </div>
  );
}
