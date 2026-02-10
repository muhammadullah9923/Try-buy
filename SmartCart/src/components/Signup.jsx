import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Signup.css"; // separate CSS file
import { useToast } from "./Toast";

export default function Signup({ setUser }) {
  const [registerType, setRegisterType] = useState("customer"); // "customer" or "vendor"
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    // Vendor-specific fields
    name: "",
    phone: "",
    address: "",
    description: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const getQueryParam = (name) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate passwords match
    if (form.password !== form.password2) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (registerType === "vendor") {
        // Vendor registration
        const res = await fetch("http://127.0.0.1:8000/accounts/register_vendor/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
            confirmPassword: form.password2,
            name: form.name,
            phone: form.phone,
            address: form.address,
            description: form.description
          })
        });
        const data = await res.json();
        if (data.success) {
          // Handle auto-login if backend supports it
          if (data.auto_login && data.token) {
            // Store auth data
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_role', data.role);
            if (data.vendor_id) localStorage.setItem('vendor_id', data.vendor_id);
            
            // Set user state
            if (setUser) {
              setUser({
                username: data.username,
                profile_image: data.profile_image || null,
                role: data.role || 'vendor',
                vendor_id: data.vendor_id || null
              });
            }
            
            toast.success("Vendor registration successful! Redirecting to dashboard...");
            setTimeout(() => navigate("/vendor/dashboard"), 1500);
          } else {
            // Fallback to login redirect if auto-login not supported
            toast.success("Vendor registration successful! Please login.");
            setTimeout(() => navigate("/login/vendor"), 1500);
          }
        } else {
          setMessage(data.message || "Registration failed.");
        }
      } else {
        // Customer registration
        const formData = new FormData();
        formData.append("username", form.username);
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("password2", form.password2);

        const res = await fetch("http://127.0.0.1:8000/accounts/signup/", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await res.json();
        
        if (data.success) {
          // Handle auto-login if backend supports it
          if (data.auto_login && data.token) {
            // Store auth data
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_role', data.role);
            
            // Set user state
            if (setUser) {
              setUser({
                username: data.username,
                profile_image: data.profile_image || null,
                role: data.role || 'customer',
                vendor_id: null
              });
            }
            
            toast.success("Account created successfully! Redirecting to dashboard...");
            const next = getQueryParam('next') || '/user/dashboard';
            setTimeout(() => navigate(next), 1500);
          } else {
            // Fallback: Try manual auto-login
            try {
              const loginForm = new FormData();
              loginForm.append('username', form.username);
              loginForm.append('password', form.password);
              const loginRes = await fetch('http://127.0.0.1:8000/accounts/login/', {
                method: 'POST',
                body: loginForm,
                credentials: 'include',
              });
              const loginData = await loginRes.json();
              if (loginData && loginData.success) {
                if (loginData.token) localStorage.setItem('auth_token', loginData.token);
                if (setUser) {
                  setUser({ 
                    username: loginData.username, 
                    profile_image: loginData.profile_image || null, 
                    role: loginData.role || 'customer',
                    vendor_id: null
                  });
                }
                toast.success("Account created successfully!");
                const next = getQueryParam('next') || '/user/dashboard';
                navigate(next);
                return;
              }
            } catch (err) {
              console.error('Auto-login failed', err);
            }
            // Final fallback to login page
            toast.success("Account created! Please login.");
            navigate('/login/user');
          }
        } else {
          setMessage(data.message || "Registration failed.");
        }
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong!");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 1rem',
    marginBottom: 14,
    borderRadius: 12,
    border: '1.5px solid #87BAC3',
    fontSize: 15,
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #D6F4ED 0%, #87BAC3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      padding: '2rem'
    }}>
      <form className="signup-form" onSubmit={handleSubmit} style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: 18,
        boxShadow: '0 4px 24px 0 #53629E33, 0 1.5px 6px 0 #87BAC333',
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: registerType === 'vendor' ? '#e8eaf6' : '#e8f5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12
        }}>
          <span style={{ fontSize: 28 }}>{registerType === 'vendor' ? '🏪' : '👤'}</span>
        </div>
        
        <h2 style={{ color: '#473472', fontWeight: 800, marginBottom: 6 }}>Create Account</h2>
        
        {/* Registration Type Toggle */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: 20,
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px solid #473472',
          width: '100%'
        }}>
          <button
            type="button"
            onClick={() => setRegisterType('customer')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: registerType === 'customer' ? '#473472' : '#fff',
              color: registerType === 'customer' ? '#fff' : '#473472',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            👤 Customer
          </button>
          <button
            type="button"
            onClick={() => setRegisterType('vendor')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderLeft: '2px solid #473472',
              background: registerType === 'vendor' ? '#473472' : '#fff',
              color: registerType === 'vendor' ? '#fff' : '#473472',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🏪 Vendor
          </button>
        </div>

        <p style={{ color: '#666', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {registerType === 'vendor' 
            ? 'Register your business and start selling on SmartCart'
            : 'Sign up as a customer to start shopping'}
        </p>

        {/* Common Fields */}
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
          placeholder="Email *"
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
          name="password2"
          type="password"
          placeholder="Confirm Password *"
          value={form.password2}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        {/* Vendor-specific Fields */}
        {registerType === 'vendor' && (
          <>
            <div style={{ width: '100%', borderTop: '1px solid #eee', margin: '8px 0 16px 0', paddingTop: 16 }}>
              <p style={{ color: '#473472', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Business Information</p>
            </div>
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
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            />
          </>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem 0',
            borderRadius: 14,
            border: 'none',
            background: loading ? '#9e9e9e' : (registerType === 'vendor' ? '#473472' : '#2e7d32'),
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            marginTop: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Creating Account...' : (registerType === 'vendor' ? 'Register as Vendor' : 'Create Account')}
        </button>

        {message && (
          <p style={{ 
            color: message.toLowerCase().includes('success') ? '#2e7d32' : '#c62828', 
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: message.toLowerCase().includes('success') ? '#e8f5e9' : '#ffebee',
            textAlign: 'center',
            fontSize: 14,
            width: '100%'
          }}>{message}</p>
        )}
        
        <div style={{ marginTop: 16, textAlign: 'center', width: '100%' }}>
          <span style={{ color: '#666', marginRight: 8 }}>Already have an account?</span>
          <Link to="/login" style={{ 
            color: '#473472', 
            fontWeight: 600, 
            textDecoration: 'none' 
          }}>
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
