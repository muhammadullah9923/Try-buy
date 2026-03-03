import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function UpgradeToVendor({ user, setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("http://3.226.254.81:8080/accounts/upgrade_to_vendor/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Successfully upgraded to vendor! Redirecting..." });
        // Update user state with new role and vendor_id
        setUser({
          ...user,
          role: "vendor",
          vendor_id: data.vendor_id
        });
        setTimeout(() => {
          navigate("/vendor/dashboard");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to upgrade." });
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

  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: "2rem auto", padding: 32, textAlign: "center" }}>
        <h2>Please Log In</h2>
        <p>You need to be logged in to upgrade to a vendor account.</p>
        <Link to="/login" style={{ color: "#473472" }}>Go to Login</Link>
      </div>
    );
  }

  if (user.role === "vendor") {
    return (
      <div style={{ maxWidth: 480, margin: "2rem auto", padding: 32, textAlign: "center" }}>
        <h2>Already a Vendor</h2>
        <p>Your account is already a vendor account.</p>
        <Link to="/vendor/dashboard" style={{ color: "#473472" }}>Go to Vendor Dashboard</Link>
      </div>
    );
  }

  return (
    <section style={{ 
      maxWidth: 480, 
      margin: "2rem auto", 
      background: "#fff", 
      padding: 32, 
      borderRadius: 16, 
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)" 
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#473472", marginBottom: 8 }}>Upgrade to Vendor</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Hello <strong>{user.username}</strong>! Set up your vendor profile to start selling.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>Store/Brand Name *</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter your store name"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>Business Phone</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Contact number"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>Business Address</span>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Your business address"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>About Your Brand</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Tell customers about your brand..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        {message.text && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            background: message.type === "success" ? "#e8f5e9" : "#ffebee",
            color: message.type === "success" ? "#2e7d32" : "#c62828",
            fontSize: 14,
            textAlign: "center"
          }}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            background: loading ? "#9e9e9e" : "#473472",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 16
          }}
        >
          {loading ? "Processing..." : "Become a Vendor"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/home" style={{ color: "#666", fontSize: 14 }}>
            ← Back to Home
          </Link>
        </div>
      </form>
    </section>
  );
}
