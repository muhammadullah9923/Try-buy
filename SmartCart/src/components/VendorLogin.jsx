import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function VendorLogin({ setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'error' or 'success'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));

    try {
      const res = await fetch("http://127.0.0.1:8000/accounts/login/vendor/", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        // Store auth data
        if (data.token) localStorage.setItem('auth_token', data.token);
        if (data.role) localStorage.setItem('user_role', data.role);
        if (data.vendor_id) localStorage.setItem('vendor_id', data.vendor_id);

        const userData = { 
          username: data.username, 
          profile_image: data.profile_image || null, 
          role: data.role || 'vendor',
          vendor_id: data.vendor_id || null
        };
        
        if (setUser) {
          setUser(userData);
        }

        setMessageType("success");
        setMessage("Login successful! Redirecting to dashboard...");

        // Redirect to vendor dashboard
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 1000);

      } else {
        setMessageType("error");
        // Handle wrong portal error with clear message
        if (data.error_code === 'WRONG_LOGIN_PORTAL') {
          setMessage("⚠️ " + data.message + " Please use the User Login portal instead.");
        } else {
          setMessage(data.message || "Login failed. Please check your credentials.");
        }
      }
    } catch (err) {
      console.error('Login request failed', err);
      setMessageType("error");
      // Check if it's actually a network error or a JSON parse error from error response
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setMessage("Network error. Please check your internet connection and try again.");
      } else {
        setMessage("Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #e8eaf6 0%, #7986cb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        padding: '2.5rem 2rem',
        borderRadius: 18,
        boxShadow: '0 4px 24px 0 #3f51b533, 0 1.5px 6px 0 #7986cb33',
        width: 360,
        maxWidth: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Vendor Icon */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: '#e8eaf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <span style={{ fontSize: 28 }}>🏪</span>
        </div>

        <h2 style={{ color: '#473472', fontWeight: 800, marginBottom: 8 }}>Vendor Login</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
          Sign in to manage your products, orders, and sales
        </p>

        <input 
          name="username" 
          placeholder="Username" 
          value={form.username}
          onChange={handleChange} 
          required 
          autoComplete="username"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            marginBottom: 16,
            borderRadius: 12,
            border: '1.5px solid #7986cb',
            fontSize: 16,
            boxSizing: 'border-box'
          }} 
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password" 
          value={form.password}
          onChange={handleChange} 
          required 
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            marginBottom: 24,
            borderRadius: 12,
            border: '1.5px solid #7986cb',
            fontSize: 16,
            boxSizing: 'border-box'
          }} 
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem 0',
            borderRadius: 14,
            border: 'none',
            background: loading ? '#9e9e9e' : '#473472',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            marginBottom: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px #47347222',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Signing in...' : 'Login as Vendor'}
        </button>

        {message && (
          <div style={{ 
            color: messageType === 'success' ? '#2e7d32' : '#c62828', 
            marginTop: 8,
            padding: '10px 14px',
            borderRadius: 8,
            background: messageType === 'success' ? '#e8f5e9' : '#ffebee',
            textAlign: 'center',
            fontSize: 13,
            width: '100%',
            boxSizing: 'border-box',
            lineHeight: 1.4,
            wordWrap: 'break-word'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', width: '100%' }}>
          <span style={{ color: '#666', marginRight: 8 }}>Want to become a vendor?</span>
          <Link to="/vendor/register" style={{ 
            color: '#473472', 
            fontWeight: 600, 
            textDecoration: 'none' 
          }}>
            Register as Vendor
          </Link>
        </div>

        <div style={{ 
          marginTop: 24, 
          paddingTop: 20, 
          borderTop: '1px solid #eee', 
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Are you a customer?</p>
          <Link 
            to="/login/user" 
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Go to User Login →
          </Link>
        </div>
      </form>
    </div>
  );
}
