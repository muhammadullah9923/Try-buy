import React, { useState } from "react";

export default function VendorEditProduct({ product, onUpdated }) {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price,
    occasion: product.occasion || "",
    description: product.description || "",
    image: null
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const occasions = ["Wedding", "Casual", "Party", "Formal", "Sports", "Traditional", "Beach", "Office"];

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/edit_product/${product.id}/`, {
        method: "POST",
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setMessage("Product updated!");
        if (onUpdated) onUpdated();
      } else {
        setMessage(result.message || "Failed to update product.");
      }
    } catch {
      setMessage("Network error.");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    boxSizing: "border-box"
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginBottom: 24, background: "#f9f9f9", padding: 20, borderRadius: 10 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, color: "#473472" }}>Edit Product</h3>
      
      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" }}>
        Product Name *
      </label>
      <input 
        name="name" 
        placeholder="e.g., Elegant Summer Dress" 
        value={form.name} 
        onChange={handleChange} 
        required 
        style={inputStyle} 
      />

      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" }}>
        Price ($) *
      </label>
      <input 
        name="price" 
        type="number" 
        step="0.01"
        placeholder="e.g., 49.99" 
        value={form.price} 
        onChange={handleChange} 
        required 
        style={inputStyle} 
      />

      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" }}>
        Occasion
      </label>
      <select 
        name="occasion" 
        value={form.occasion} 
        onChange={handleChange} 
        style={inputStyle}
      >
        <option value="">-- Select an Occasion --</option>
        {occasions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>

      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" }}>
        Description
      </label>
      <textarea 
        name="description" 
        placeholder="Describe your product in detail. Include material, fit, care instructions, and unique features." 
        value={form.description} 
        onChange={handleChange} 
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }} 
      />

      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" }}>
        Update Product Image (optional)
      </label>
      <input 
        name="image" 
        type="file" 
        accept="image/*" 
        onChange={handleChange} 
        style={{ ...inputStyle, padding: 8 }} 
      />
      <span style={{ fontSize: 11, color: "#888", display: "block", marginTop: -8, marginBottom: 12 }}>
        Leave empty to keep current image. Upload JPG, PNG (max 5MB).
      </span>

      <button 
        type="submit" 
        disabled={loading} 
        style={{ 
          padding: "10px 20px", 
          background: "#473472", 
          color: "#fff", 
          border: "none", 
          borderRadius: 8, 
          fontWeight: 700, 
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Updating..." : "Update Product"}
      </button>
      {message && (
        <div style={{ 
          marginTop: 12, 
          color: message.includes("updated") ? "#2e7d32" : "#c62828",
          padding: 8,
          background: message.includes("updated") ? "#e8f5e9" : "#ffebee",
          borderRadius: 6,
          fontSize: 13
        }}>
          {message}
        </div>
      )}
    </form>
  );
}
