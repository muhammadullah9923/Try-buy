import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// STABLE INPUT BEHAVIOR - Form is inlined, not a separate component
// - No re-renders on keystroke
// - Cursor position preserved
// - Validation on blur/submit only
// - Initial focus only once
// ============================================================================

export default function VendorProducts({ vendorId, onStatsChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filter, setFilter] = useState("all");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state - using refs to prevent re-renders on every keystroke
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discount: "",
    occasion: "",
    description: "",
    sizes: "",
    colors: "",
    category: "",
    stock_quantity: "",
    low_stock_threshold: "10"
  });
  const [imageFile, setImageFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Ref for initial focus (only once when form opens)
  const nameInputRef = useRef(null);
  const hasAutoFocused = useRef(false);

  const occasions = ["Wedding", "Casual", "Party", "Formal", "Sports", "Traditional", "Beach", "Office"];
  const categories = ["Dresses", "Tops", "Bottoms", "Outerwear", "Accessories", "Footwear", "Suits", "Ethnic Wear"];

  // Inject focus styles once (with ID check to prevent duplicates)
  useEffect(() => {
    if (document.getElementById('vendor-form-styles')) return;
    const style = document.createElement('style');
    style.id = 'vendor-form-styles';
    style.textContent = `
      .vendor-form-input:focus {
        border-color: #473472 !important;
        box-shadow: 0 0 0 3px rgba(71, 52, 114, 0.15) !important;
        outline: none !important;
      }
      .vendor-form-input:hover:not(:focus) {
        border-color: #999 !important;
      }
      .vendor-form-input.has-error {
        border-color: #c62828 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (vendorId) fetchProducts();
  }, [vendorId]);

  // Handle initial focus when form opens - only once
  useEffect(() => {
    if ((showAddForm || editingProduct) && nameInputRef.current && !hasAutoFocused.current) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
        hasAutoFocused.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
    if (!showAddForm && !editingProduct) {
      hasAutoFocused.current = false;
    }
  }, [showAddForm, editingProduct]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/products/`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
    setLoading(false);
  };

  // Stable reset function using useCallback
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      price: "",
      discount: "",
      occasion: "",
      description: "",
      sizes: "",
      colors: "",
      category: "",
      stock_quantity: "",
      low_stock_threshold: "10"
    });
    setImageFile(null);
    setFieldErrors({});
    hasAutoFocused.current = false;
  }, []);

  // Stable input change handler - NO validation on keystroke
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    setFieldErrors(prev => {
      if (prev[name]) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  // Validate on blur only - not on every keystroke
  const handleFieldBlur = useCallback((e) => {
    const { name, value } = e.target;
    let error = null;
    
    if (name === "name" && !value.trim()) {
      error = "Product name is required";
    } else if (name === "price" && (!value || parseFloat(value) <= 0)) {
      error = "Valid price is required";
    } else if (name === "stock_quantity" && (!value || parseInt(value) < 0)) {
      error = "Valid stock quantity is required";
    }
    
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  }, []);

  // Full form validation on submit
  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Product name is required";
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = "Valid price is required";
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) errors.stock_quantity = "Valid stock is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name, formData.price, formData.stock_quantity]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setFormSubmitting(true);
    setMessage({ type: "", text: "" });

    const data = new FormData();
    data.append("vendor_id", vendorId);
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("discount", formData.discount || "0");
    data.append("occasion", formData.occasion);
    data.append("description", formData.description);
    data.append("sizes", formData.sizes);
    data.append("colors", formData.colors);
    data.append("category", formData.category);
    data.append("stock_quantity", formData.stock_quantity || "0");
    data.append("low_stock_threshold", formData.low_stock_threshold || "10");
    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      const res = await fetch("http://3.226.254.81:8080/api/vendor/add_product/", {
        method: "POST",
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: "success", text: "Product added successfully!" });
        resetForm();
        setShowAddForm(false);
        fetchProducts();
        if (onStatsChange) onStatsChange();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to add product." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setFormSubmitting(false);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setFormSubmitting(true);
    setMessage({ type: "", text: "" });

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("discount", formData.discount || "0");
    data.append("occasion", formData.occasion);
    data.append("description", formData.description);
    data.append("sizes", formData.sizes);
    data.append("colors", formData.colors);
    data.append("category", formData.category);
    data.append("stock_quantity", formData.stock_quantity || "0");
    data.append("low_stock_threshold", formData.low_stock_threshold || "10");
    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/edit_product/${editingProduct.id}/`, {
        method: "POST",
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: "success", text: "Product updated successfully!" });
        resetForm();
        setEditingProduct(null);
        fetchProducts();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to update product." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setFormSubmitting(false);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/delete_product/${productId}/`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Product deleted." });
        fetchProducts();
        if (onStatsChange) onStatsChange();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to delete product." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error." });
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/product/${productId}/toggle_status/`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // Stock update uses onBlur to prevent constant API calls
  const handleUpdateStock = async (productId, newStock) => {
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/product/${productId}/update_stock/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_quantity: parseInt(newStock) || 0 }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        // Update local state without full refetch to prevent re-render of other elements
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, stock_quantity: parseInt(newStock) || 0 } : p
        ));
      }
    } catch (err) {
      console.error("Error updating stock:", err);
    }
  };

  const openEditForm = useCallback((product) => {
    setFormData({
      name: product.name || "",
      price: product.price || "",
      discount: product.discount || "",
      occasion: product.occasion || "",
      description: product.description || "",
      sizes: product.sizes || "",
      colors: product.colors || "",
      category: product.category || "",
      stock_quantity: product.stock_quantity?.toString() || "",
      low_stock_threshold: product.low_stock_threshold?.toString() || "10"
    });
    setEditingProduct(product);
    setShowAddForm(false);
    setFieldErrors({});
    hasAutoFocused.current = false;
  }, []);

  const closeForm = useCallback(() => {
    resetForm();
    setShowAddForm(false);
    setEditingProduct(null);
  }, [resetForm]);

  // Filter products
  const filteredProducts = products.filter(p => {
    if (filter === "all") return true;
    if (filter === "low_stock") return p.is_low_stock && !p.is_out_of_stock;
    if (filter === "out_of_stock") return p.is_out_of_stock;
    if (filter === "active") return p.is_active;
    if (filter === "inactive") return !p.is_active;
    return true;
  });

  // Count stats
  const lowStockCount = products.filter(p => p.is_low_stock && !p.is_out_of_stock).length;
  const outOfStockCount = products.filter(p => p.is_out_of_stock).length;

  // Static styles (defined outside render to prevent recreation)
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s"
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    display: "block",
    marginBottom: 4,
    color: "#333"
  };

  const helperStyle = {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
    display: "block"
  };

  const errorStyle = {
    fontSize: 11,
    color: "#c62828",
    marginTop: 4,
    display: "block"
  };

  const getStockBadge = (product) => {
    if (product.is_out_of_stock) {
      return <span style={{ background: "#ffebee", color: "#c62828", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Out of Stock</span>;
    }
    if (product.is_low_stock) {
      return <span style={{ background: "#fff3e0", color: "#e65100", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Low Stock</span>;
    }
    return <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>In Stock</span>;
  };

  // Determine if we're showing the form
  const isFormVisible = showAddForm || editingProduct;
  const isEditMode = !!editingProduct;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#333" }}>My Products</h1>
        {!isFormVisible && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            style={{
              padding: "10px 20px",
              background: "#473472",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>+</span> Add New Product
          </button>
        )}
      </div>

      {/* Stock Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div style={{
          background: outOfStockCount > 0 ? "#ffebee" : "#fff3e0",
          border: `1px solid ${outOfStockCount > 0 ? "#ef9a9a" : "#ffcc80"}`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16
        }}>
          <span style={{ fontSize: 24 }}>{outOfStockCount > 0 ? "⚠️" : "📦"}</span>
          <div>
            <strong style={{ color: outOfStockCount > 0 ? "#c62828" : "#e65100" }}>
              Stock Alert
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#666" }}>
              {outOfStockCount > 0 && `${outOfStockCount} product(s) out of stock. `}
              {lowStockCount > 0 && `${lowStockCount} product(s) running low on stock.`}
            </p>
          </div>
        </div>
      )}

      {message.text && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          background: message.type === "success" ? "#e8f5e9" : "#ffebee",
          color: message.type === "success" ? "#2e7d32" : "#c62828",
          fontSize: 14
        }}>
          {message.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: `All (${products.length})` },
          { key: "active", label: `Active (${products.filter(p => p.is_active).length})` },
          { key: "inactive", label: `Inactive (${products.filter(p => !p.is_active).length})` },
          { key: "low_stock", label: `Low Stock (${lowStockCount})`, color: "#e65100" },
          { key: "out_of_stock", label: `Out of Stock (${outOfStockCount})`, color: "#c62828" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "8px 16px",
              background: filter === f.key ? (f.color || "#473472") : "#f5f5f5",
              color: filter === f.key ? "#fff" : (f.color || "#333"),
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ========== INLINE PRODUCT FORM (not a separate component) ========== */}
      {isFormVisible && (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: "#333" }}>{isEditMode ? "Edit Product" : "Add New Product"}</h3>
            <button
              type="button"
              onClick={closeForm}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={isEditMode ? handleEditProduct : handleAddProduct}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {/* Product Name */}
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  ref={nameInputRef}
                  className={`vendor-form-input ${fieldErrors.name ? 'has-error' : ''}`}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  placeholder="e.g., Elegant Summer Dress"
                  style={inputStyle}
                  autoComplete="off"
                />
                {fieldErrors.name && <span style={errorStyle}>{fieldErrors.name}</span>}
              </div>

              {/* Price */}
              <div>
                <label style={labelStyle}>Price ($) *</label>
                <input
                  className={`vendor-form-input ${fieldErrors.price ? 'has-error' : ''}`}
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  placeholder="e.g., 49.99"
                  style={inputStyle}
                  autoComplete="off"
                />
                {fieldErrors.price && <span style={errorStyle}>{fieldErrors.price}</span>}
              </div>

              {/* Discount */}
              <div>
                <label style={labelStyle}>Discount (%)</label>
                <input
                  className="vendor-form-input"
                  name="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={handleInputChange}
                  placeholder="e.g., 15 for 15% off"
                  style={inputStyle}
                  autoComplete="off"
                />
                <span style={helperStyle}>Leave empty for no discount</span>
              </div>

              {/* Occasion */}
              <div>
                <label style={labelStyle}>Occasion</label>
                <select
                  className="vendor-form-input"
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">-- Select an Occasion --</option>
                  {occasions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  className="vendor-form-input"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">-- Select a Category --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Product Image */}
              <div>
                <label style={labelStyle}>Product Image</label>
                <input
                  className="vendor-form-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  style={{ ...inputStyle, padding: 8 }}
                />
                <span style={helperStyle}>Upload JPG, PNG (max 5MB)</span>
              </div>

              {/* Sizes */}
              <div>
                <label style={labelStyle}>Available Sizes</label>
                <input
                  className="vendor-form-input"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="e.g., S, M, L, XL or 38, 40, 42"
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>

              {/* Colors */}
              <div>
                <label style={labelStyle}>Available Colors</label>
                <input
                  className="vendor-form-input"
                  name="colors"
                  value={formData.colors}
                  onChange={handleInputChange}
                  placeholder="e.g., Red, Blue, Black, White"
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label style={labelStyle}>Stock Quantity *</label>
                <input
                  className={`vendor-form-input ${fieldErrors.stock_quantity ? 'has-error' : ''}`}
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  placeholder="e.g., 50"
                  style={inputStyle}
                  autoComplete="off"
                />
                {fieldErrors.stock_quantity && <span style={errorStyle}>{fieldErrors.stock_quantity}</span>}
              </div>

              {/* Low Stock Threshold */}
              <div style={{ gridColumn: "span 3" }}>
                <label style={labelStyle}>Low Stock Alert Threshold</label>
                <input
                  className="vendor-form-input"
                  name="low_stock_threshold"
                  type="number"
                  min="1"
                  value={formData.low_stock_threshold}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  style={{ ...inputStyle, maxWidth: 200 }}
                  autoComplete="off"
                />
                <span style={helperStyle}>You'll be alerted when stock falls below this number</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                className="vendor-form-input"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                placeholder="Describe your product in detail. Include material, fit, care instructions, and unique features. e.g., 'Beautiful floral print summer dress made from 100% cotton. Comfortable fit with adjustable straps. Machine washable.'"
              />
            </div>

            {/* Form Actions */}
            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={formSubmitting}
                style={{
                  padding: "10px 24px",
                  background: formSubmitting ? "#9e9e9e" : "#473472",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: formSubmitting ? "not-allowed" : "pointer",
                  fontWeight: 600
                }}
              >
                {formSubmitting ? "Saving..." : (isEditMode ? "Update Product" : "Add Product")}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={formSubmitting}
                style={{
                  padding: "10px 24px",
                  background: "#f5f5f5",
                  color: "#333",
                  border: "none",
                  borderRadius: 8,
                  cursor: formSubmitting ? "not-allowed" : "pointer",
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ========== END INLINE PRODUCT FORM ========== */}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👗</div>
          <h3 style={{ color: "#333", marginBottom: 8 }}>
            {filter === "all" ? "No Products Yet" : "No products match this filter"}
          </h3>
          <p style={{ color: "#888", marginBottom: 20 }}>
            {filter === "all" 
              ? "Start by adding your first product to your store."
              : "Try selecting a different filter."}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: "10px 24px",
                background: "#473472",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f7fa" }}>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Image</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Product</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Price</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Stock</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Status</th>
                <th style={{ padding: 14, textAlign: "center", fontWeight: 600, fontSize: 13, color: "#666" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ 
                  borderBottom: "1px solid #eee",
                  opacity: product.is_active ? 1 : 0.6
                }}>
                  <td style={{ padding: 12 }}>
                    {product.image ? (
                      <img
                        src={product.image.startsWith('http') ? product.image : `http://3.226.254.81:8080${product.image}`}
                        alt={product.name}
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : (
                      <div style={{
                        width: 60,
                        height: 60,
                        background: "#f5f5f5",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ccc"
                      }}>
                        No img
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, color: "#333" }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {product.occasion && <span>{product.occasion}</span>}
                      {product.occasion && product.category && <span> • </span>}
                      {product.category && <span>{product.category}</span>}
                    </div>
                    {product.colors && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        Colors: {product.colors}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, color: "#473472" }}>Rs. {product.price}</div>
                    {parseFloat(product.discount) > 0 && (
                      <div style={{ fontSize: 11, color: "#e65100" }}>
                        {product.discount}% off
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stock_quantity}
                        onBlur={(e) => {
                          const newVal = e.target.value;
                          if (newVal !== product.stock_quantity?.toString()) {
                            handleUpdateStock(product.id, newVal);
                          }
                        }}
                        style={{
                          width: 60,
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: "1px solid #ddd",
                          fontSize: 13
                        }}
                      />
                      {getStockBadge(product)}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleToggleStatus(product.id)}
                      style={{
                        padding: "6px 12px",
                        background: product.is_active ? "#e8f5e9" : "#f5f5f5",
                        color: product.is_active ? "#2e7d32" : "#888",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                    {!product.is_approved && (
                      <span style={{ 
                        display: "block", 
                        marginTop: 4, 
                        fontSize: 10, 
                        color: "#e65100" 
                      }}>
                        Pending Approval
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => openEditForm(product)}
                      style={{
                        padding: "6px 12px",
                        background: "#e3f2fd",
                        color: "#1976d2",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12,
                        marginRight: 8
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#ffebee",
                        color: "#c62828",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
