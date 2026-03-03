import React, { useState } from "react";

export default function VendorAddProduct({ vendorId, onProductAdded }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    occasion: "",
    description: "",
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
    if (!vendorId) {
      setMessage("Vendor account required.");
      return;
    }
    setLoading(true);
    setMessage("");
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    data.append("vendor_id", vendorId);
    try {
      const res = await fetch("http://3.226.254.81:8080/api/vendor/add_product/", {
        method: "POST",
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setMessage("Product added!");
        setForm({ name: "", price: "", occasion: "", description: "", image: null });
        if (onProductAdded) onProductAdded();
      } else {
        setMessage(result.message || "Failed to add product.");
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
    <section style={{ maxWidth: 450, margin: "2rem auto", background: "#fff", padding: 28, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <h2 style={{ textAlign: "center", color: "#473472", marginBottom: 20 }}>Add New Product</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
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
          placeholder="Describe your product in detail. Include material, fit, care instructions, and unique features. e.g., 'Beautiful floral print dress made from 100% cotton...'" 
          value={form.description} 
          onChange={handleChange} 
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }} 
        />

        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500, color: "#555" }}>
          Product Image
        </label>
        <input 
          name="image" 
          type="file" 
          accept="image/*" 
          onChange={handleChange} 
          style={{ ...inputStyle, padding: 8 }} 
        />
        <span style={{ fontSize: 11, color: "#888", display: "block", marginTop: -8, marginBottom: 12 }}>
          Upload JPG, PNG (max 5MB). Clear product photo recommended.
        </span>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: "100%", 
            padding: 12, 
            background: "#473472", 
            color: "#fff", 
            border: "none", 
            borderRadius: 8, 
            fontWeight: 700, 
            fontSize: 16, 
            marginTop: 8,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Adding Product..." : "Add Product"}
        </button>
      </form>
      {message && (
        <div style={{ 
          marginTop: 16, 
          color: message.includes("added") ? "#2e7d32" : "#c62828", 
          textAlign: "center",
          padding: 10,
          background: message.includes("added") ? "#e8f5e9" : "#ffebee",
          borderRadius: 8,
          fontSize: 14
        }}>
          {message}
        </div>
      )}
    </section>
  );
}
