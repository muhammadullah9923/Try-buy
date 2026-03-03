import React, { useState, useEffect } from "react";

export default function VendorProfile({ vendorId, vendorData, onUpdate }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (vendorData) {
      setForm({
        name: vendorData.name || "",
        email: vendorData.email || "",
        phone: vendorData.phone || "",
        address: vendorData.address || "",
        description: vendorData.description || ""
      });
    }
  }, [vendorData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/update_profile/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        if (onUpdate) onUpdate();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    marginTop: 6,
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    marginBottom: 16,
    color: "#333",
    fontSize: 14,
    fontWeight: 500
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24, color: "#333" }}>Business Profile</h1>

      <div style={{ 
        background: "#fff", 
        borderRadius: 12, 
        padding: 32,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        maxWidth: 600
      }}>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Store/Brand Name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Business Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Business Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Business Address
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Brand Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Tell customers about your brand..."
            />
          </label>

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

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 32px",
              background: loading ? "#9e9e9e" : "#473472",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 15
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Commission Info */}
        <div style={{ 
          marginTop: 32, 
          padding: 20, 
          background: "#f5f7fa", 
          borderRadius: 8 
        }}>
          <h4 style={{ marginBottom: 12, color: "#333" }}>Commission Information</h4>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
            <strong>Commission Rate:</strong> {vendorData?.commission_rate || 10}%
          </p>
          <p style={{ color: "#888", fontSize: 13 }}>
            This is the platform fee deducted from each sale. Contact admin to discuss rate changes.
          </p>
        </div>
      </div>
    </div>
  );
}
