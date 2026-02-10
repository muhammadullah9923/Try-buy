import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function VendorRegister({ onRegistered, setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    address: "",
    description: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/accounts/register_vendor/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        
        // Handle auto-login if backend supports it
        if (data.auto_login && data.token) {
          // Store auth data
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_role', data.role);
          if (data.vendor_id) localStorage.setItem('vendor_id', data.vendor_id);
          
          // Set user state if setUser is available
          if (setUser) {
            setUser({
              username: data.username,
              profile_image: data.profile_image || null,
              role: data.role || 'vendor',
              vendor_id: data.vendor_id || null
            });
          }
          
          setMessage("Registration successful! Redirecting to your dashboard...");
          if (onRegistered) onRegistered();
          
          // Redirect to vendor dashboard
          setTimeout(() => {
            navigate("/vendor/dashboard");
          }, 1500);
        } else {
          // Fallback to login redirect if auto-login not supported
          setMessage("Registration successful! Redirecting to login...");
          if (onRegistered) onRegistered();
          setTimeout(() => {
            navigate("/login/vendor");
          }, 2000);
        }
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  };

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
        <h2 style={{ color: "#473472", marginBottom: 8 }}>Become a Vendor</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Register your brand and start selling on our platform
        </p>
      </div>

      {success ? (
        <div style={{ 
          textAlign: "center", 
          padding: 24, 
          background: "#e8f5e9", 
          borderRadius: 12 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h3 style={{ color: "#2e7d32", marginBottom: 8 }}>Registration Successful!</h3>
          <p style={{ color: "#666" }}>{message || "Redirecting to your dashboard..."}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: "#473472", marginBottom: 12, fontSize: 14 }}>Account Information</h4>
            <input 
              name="username" 
              placeholder="Username *" 
              value={form.username} 
              onChange={handleChange} 
              required 
              style={inputStyle} 
            />
            <input 
              name="email" 
              type="email" 
              placeholder="Email Address *" 
              value={form.email} 
              onChange={handleChange} 
              required 
              style={inputStyle} 
            />
            <input 
              name="password" 
              type="password" 
              placeholder="Password *" 
              value={form.password} 
              onChange={handleChange} 
              required 
              style={inputStyle} 
            />
            <input 
              name="confirmPassword" 
              type="password" 
              placeholder="Confirm Password *" 
              value={form.confirmPassword} 
              onChange={handleChange} 
              required 
              style={inputStyle} 
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ color: "#473472", marginBottom: 12, fontSize: 14 }}>Business Information</h4>
            <input 
              name="name" 
              placeholder="Store/Brand Name *" 
              value={form.name} 
              onChange={handleChange} 
              required 
              style={inputStyle} 
            />
            <input 
              name="phone" 
              placeholder="Business Phone" 
              value={form.phone} 
              onChange={handleChange} 
              style={inputStyle} 
            />
            <input 
              name="address" 
              placeholder="Business Address" 
              value={form.address} 
              onChange={handleChange} 
              style={inputStyle} 
            />
            <textarea 
              name="description" 
              placeholder="Tell us about your brand (optional)" 
              value={form.description} 
              onChange={handleChange} 
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} 
            />
          </div>

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
              fontWeight: 700, 
              fontSize: 16, 
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Creating Account..." : "Register as Vendor"}
          </button>

          <div style={{ 
            marginTop: 20, 
            textAlign: "center", 
            fontSize: 14, 
            color: "#666" 
          }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#473472", fontWeight: 600 }}>
              Login here
            </Link>
          </div>
        </form>
      )}

      {message && !success && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          borderRadius: 8, 
          background: "#ffebee", 
          color: "#c62828", 
          textAlign: "center",
          fontSize: 14
        }}>
          {message}
        </div>
      )}
    </section>
  );
}
