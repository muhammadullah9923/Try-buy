import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VirtualTryOn from "./VirtualTryOn";
import styles from "./Home.module.css";
import { useRef } from "react";
import { useToast } from "./Toast";

export default function Home({ user }) {
  const [occasions, setOccasions] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState("All");
  const [occasionSearch, setOccasionSearch] = useState("");
  const occasionInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [tryingProduct, setTryingProduct] = useState(null);
  const [cartMessage, setCartMessage] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Fetch Occasions
    fetch('http://127.0.0.1:8000/api/occasions/')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.occasions) {
          console.log('✓ Loaded occasions:', data.occasions.length);
          setOccasions(data.occasions);
        } else {
          console.error('Failed to load occasions:', data);
        }
      })
      .catch((error) => {
        console.error('Error fetching occasions:', error);
      });

    // Fetch All Products
    fetch('http://127.0.0.1:8000/api/products/')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.products) {
          console.log('✓ Loaded products:', data.products.length);
          setProducts(data.products);
        } else {
          console.error('Failed to load products:', data);
        }
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  // On mount, replay post-login add-to-cart action if found
  useEffect(() => {
    // Only replay if user is logged in and products are loaded
    if (!user || products.length === 0) {
      return;
    }

    const action = localStorage.getItem('post_login_action');
    if (action) {
      try {
        const ctx = JSON.parse(action);
        
        // Replay add to cart action
        if (ctx.type === 'add_to_cart' && ctx.product_id) {
          const product = products.find(p => p.id === ctx.product_id);
          if (product) {
            // Small delay to ensure user state is fully set
            setTimeout(() => {
              handleAddToCart(product);
              localStorage.removeItem('post_login_action');
            }, 500);
          } else {
            console.warn('Product not found for post-login action:', ctx.product_id);
            localStorage.removeItem('post_login_action');
          }
        }
        
        // Replay try on action
        if (ctx.type === 'try_on' && ctx.product_id) {
          const product = products.find(p => p.id === ctx.product_id);
          if (product) {
            setTimeout(() => {
              setTryingProduct(product);
              localStorage.removeItem('post_login_action');
            }, 500);
          } else {
            console.warn('Product not found for post-login try-on:', ctx.product_id);
            localStorage.removeItem('post_login_action');
          }
        }
      } catch (error) {
        console.error('Error replaying post-login action:', error);
        localStorage.removeItem('post_login_action');
      }
    }
  }, [products, user]);

  // Filter products based on selected occasion
  const filteredProducts = selectedOccasion === "All"
    ? products
    : products.filter(p => p.occasion === selectedOccasion);

  const handleOccasionClick = (occasionName) => {
    setSelectedOccasion(occasionName);
    // Smooth scroll to products section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered occasions for search
  const filteredOccasions = occasionSearch.trim() === "" ? occasions : occasions.filter(occ => occ.name.toLowerCase().includes(occasionSearch.toLowerCase()));

  const handleAddToCart = (product) => {
    // Validate product
    if (!product || !product.id) {
      toast.error('Invalid product. Please try again.');
      return;
    }

    // Restrict vendors and admins from adding to cart
    if (user && user.role === 'vendor') {
      toast.warning('Vendors cannot add items to cart. Please use a customer account for shopping.');
      return;
    }
    if (user && user.role === 'admin') {
      toast.warning('Admins cannot add items to cart. Please use a customer account for shopping.');
      return;
    }

    // Check authentication - redirect if not logged in
    if (!user) {
      // Save context for post-login action
      localStorage.setItem('post_login_action', JSON.stringify({ 
        type: 'add_to_cart', 
        product_id: product.id,
        product_name: product.name || ''
      }));
      navigate(`/login?next=/home`);
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

    // Send request to backend
    const requestBody = { 
      product_id: product.id, 
      quantity: 1 
    };
    
    console.log('🛒 Sending add to cart request:', {
      url: "http://127.0.0.1:8000/api/cart/add/",
      method: "POST",
      headers,
      body: requestBody,
      credentials: "include"
    });
    
    fetch("http://127.0.0.1:8000/api/cart/add/", {
      method: "POST",
      headers,
      credentials: "include",
      mode: "cors",
      body: JSON.stringify(requestBody),
    })
      .then(async (res) => {
        // Store status code for later use
        const statusCode = res.status;
        
        // Try to parse response as JSON
        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          // If JSON parsing fails, create error response
          throw new Error(`Server error: ${statusCode} ${res.statusText}`);
        }

        // Check if response is ok
        if (!res.ok) {
          const errorMsg = data.message || `Server error: ${statusCode}`;
          throw new Error(errorMsg);
        }

        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response from server');
        }

        // Handle success response
        if (data.success) {
          // Show success message
          setCartMessage('✓ Added to cart!');
          setTimeout(() => setCartMessage(''), 3000);
        } else {
          // Handle error response
          const errorMsg = data.message || 'Failed to add to cart';
          
          // Check if authentication error
          if (statusCode === 401 || errorMsg.toLowerCase().includes('authentication') || errorMsg.toLowerCase().includes('log in')) {
            localStorage.setItem('post_login_action', JSON.stringify({ 
              type: 'add_to_cart', 
              product_id: product.id,
              product_name: product.name || ''
            }));
            navigate(`/login?next=/home`);
          } else {
            toast.error(errorMsg);
          }
        }
      })
      .catch((error) => {
        // Handle network errors and other failures
        console.error('❌ Add to cart error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Check if it's a network error
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Network request failed') || error.name === 'TypeError') {
          toast.error('Network error: Please check server connection');
        } else if (error.message.includes('401') || error.message.toLowerCase().includes('authentication')) {
          // Authentication expired
          localStorage.setItem('post_login_action', JSON.stringify({ 
            type: 'add_to_cart', 
            product_id: product.id,
            product_name: product.name || ''
          }));
          navigate(`/login?next=/home`);
        } else {
          toast.error(error.message || 'Failed to add to cart. Please try again.');
        }
      });
  };

  const handleTryOn = (product) => {
    // Restrict vendors and admins from using try-on
    if (user && user.role === 'vendor') {
      toast.warning('Vendors cannot use virtual try-on. Please use a customer account for shopping.');
      return;
    }
    if (user && user.role === 'admin') {
      toast.warning('Admins cannot use virtual try-on. Please use a customer account for shopping.');
      return;
    }
    
    if (!user) {
      localStorage.setItem('post_login_action', JSON.stringify({ 
        type: 'try_on', 
        product_id: product.id 
      }));
      navigate(`/login?next=/home`);
      return;
    }
    setTryingProduct(product);
  };

  return (
    <section id="home" className={styles.home}>
      {/* Sticky Occasion Navigation Bar */}
      <div className={styles.occasionBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: 8 }}>
          <input
            ref={occasionInputRef}
            type="text"
            placeholder="Search occasions..."
            value={occasionSearch}
            onChange={e => setOccasionSearch(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 20,
              border: '1px solid #ccc',
              fontSize: 'clamp(13px, 2vw, 15px)',
              outline: 'none',
              minWidth: 180,
              background: '#f9f9f9'
            }}
            aria-label="Search occasions"
          />
          <button
            onClick={() => { setOccasionSearch(""); occasionInputRef.current && occasionInputRef.current.focus(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: 20, border: 'none', background: '#eee', color: '#473472', fontWeight: 600, cursor: 'pointer', fontSize: 'clamp(13px, 2vw, 15px)' }}
            aria-label="Clear search"
          >Clear</button>
        </div>
        <div className={styles.occasionList}>
          <button
            onClick={() => handleOccasionClick("All")}
            style={{
              padding: "clamp(0.5rem, 1.5vw, 0.7rem) clamp(1rem, 3vw, 1.5rem)",
              borderRadius: "30px",
              border: selectedOccasion === "All" ? "2px solid #473472" : "1px solid #ddd",
              background: selectedOccasion === "All" ? "#53629E" : "#fff",
              color: selectedOccasion === "All" ? "#fff" : "#473472",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              fontSize: 'clamp(13px, 2vw, 15px)',
              minWidth: 'fit-content',
              outline: selectedOccasion === "All" ? '2px solid #473472' : 'none',
            }}
            aria-pressed={selectedOccasion === "All"}
          >
            All
          </button>
          {filteredOccasions && filteredOccasions.length > 0 ? (
            filteredOccasions.map(occ => (
              <button
                key={occ.id}
                onClick={() => handleOccasionClick(occ.name)}
                style={{
                  padding: "clamp(0.5rem, 1.5vw, 0.7rem) clamp(1rem, 3vw, 1.5rem)",
                  borderRadius: "30px",
                  border: selectedOccasion === occ.name ? "2px solid #473472" : "1px solid #ddd",
                  background: selectedOccasion === occ.name ? "#53629E" : "#fff",
                  color: selectedOccasion === occ.name ? "#fff" : "#473472",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  fontSize: 'clamp(13px, 2vw, 15px)',
                  minWidth: 'fit-content',
                  outline: selectedOccasion === occ.name ? '2px solid #473472' : 'none',
                }}
                aria-pressed={selectedOccasion === occ.name}
              >
                {occ.name}
              </button>
            ))
          ) : (
            !loading && (
              <div style={{ padding: "1rem", color: "#666", fontStyle: "italic" }}>
                No occasions found
              </div>
            )
          )}
        </div>
      </div>

      {/* Product Grid - Single Page View */}
      <div style={{
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(2rem, 5vw, 3vw)",
        maxWidth: 1400,
        margin: "0 auto"
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: '#53629E' }}>Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
            {selectedOccasion === "All" 
              ? "No products available" 
              : `No products found for ${selectedOccasion}`}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div style={{
              marginBottom: "1.5rem",
              color: "#53629E",
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              fontWeight: 500
            }}>
              {selectedOccasion === "All" 
                ? `Showing all ${filteredProducts.length} products`
                : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} for ${selectedOccasion}`}
            </div>

            {/* Responsive Product Grid */}
            <div className={styles.productGrid}>
              {filteredProducts.map(product => (
                <div key={product.id} className={styles.productCard}
                  onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                >
                  <div className={styles.productImage}>
                    <img 
                      src={product.image ? (product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`) : 'https://via.placeholder.com/280x220?text=No+Image'}
                      alt={product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/280x220?text=No+Image';
                      }}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>
                      {product.name}
                    </h3>
                    {product.occasion ? (
                      <span className={styles.occasionBadge}>
                        {product.occasion}
                      </span>
                    ) : (
                      <span className={styles.noBadge}></span>
                    )}
                    <p className={styles.productPrice}>
                      Rs. {parseFloat(product.price).toFixed(2)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.actionButtons} onClick={e => e.stopPropagation()}>
                    <button 
                      className={styles.addToCartBtn}
                      onClick={() => handleAddToCart(product)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      Add to Cart
                    </button>
                    <button 
                      className={styles.tryOnBtn}
                      onClick={() => handleTryOn(product)}
                      aria-label={`Try on ${product.name}`}
                    >
                      Try On
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Try-On Modal */}
      {tryingProduct && (
        <VirtualTryOn
          product={tryingProduct}
          onClose={() => setTryingProduct(null)}
          onAddToCart={() => handleAddToCart(tryingProduct)}
          user={user}
        />
      )}

      {/* Cart Message */}
      {cartMessage && (
        <div className={styles.cartMessage}>
          {cartMessage}
        </div>
      )}
    </section>
  );
}
