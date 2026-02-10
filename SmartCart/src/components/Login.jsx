import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast";

export default function Login({ setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getQueryParam = (name) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    let data = null;
    let res = null;
    try {
      res = await fetch("http://127.0.0.1:8000/accounts/login/", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    } catch (err) {
      console.error('Login request failed', err);
      toast.error('Network error while trying to login');
      return;
    }

    try {
      data = await res.json();
    } catch (err) {
      console.error('Login response is not valid JSON', err, await res.text());
      toast.error('Unexpected response from server');
      return;
    }

    console.log('login response', res.status, data);
    setMessage(data.message || (res.status === 200 ? 'Login completed' : 'Login failed'));
    if (data.success) {
      // Store token for API calls
      try { if (data.token) localStorage.setItem('auth_token', data.token); } catch(e) {}
      // Store user role for routing
      try { if (data.role) localStorage.setItem('user_role', data.role); } catch(e) {}
      // Store vendor_id if present
      try { if (data.vendor_id) localStorage.setItem('vendor_id', data.vendor_id); } catch(e) {}

      // Set user state with all data including vendor_id
      const userData = { 
        username: data.username, 
        profile_image: data.profile_image || null, 
        role: data.role || 'customer',
        vendor_id: data.vendor_id || null
      };
      
      if (setUser) {
        setUser(userData);
      }

      // Redirect based on user role
      // Vendors go to their dashboard, admins go to admin dashboard
      const next = getQueryParam('next');
      let targetPath = '/home';
      
      if (next) {
        targetPath = next;
      } else if (data.role === 'vendor' && data.vendor_id) {
        targetPath = '/vendor/dashboard';
      } else if (data.role === 'admin') {
        targetPath = '/admin/dashboard';
      }
      
      toast.success('Login successful');
      navigate(targetPath);

    }
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
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        padding: '2.5rem 2rem',
        borderRadius: 18,
        boxShadow: '0 4px 24px 0 #53629E33, 0 1.5px 6px 0 #87BAC333',
        minWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{ color: '#473472', fontWeight: 800, marginBottom: 24 }}>Login</h2>
        <input name="username" placeholder="Username" onChange={handleChange} required style={{
          width: '100%',
          padding: '0.7rem 1rem',
          marginBottom: 18,
          borderRadius: 12,
          border: '1.5px solid #87BAC3',
          fontSize: 16
        }} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{
          width: '100%',
          padding: '0.7rem 1rem',
          marginBottom: 24,
          borderRadius: 12,
          border: '1.5px solid #87BAC3',
          fontSize: 16
        }} />
        <button type="submit" style={{
          width: '100%',
          padding: '0.7rem 0',
          borderRadius: 14,
          border: 'none',
          background: '#53629E',
          color: '#fff',
          fontWeight: 700,
          fontSize: 17,
          marginBottom: 12,
          cursor: 'pointer',
          boxShadow: '0 2px 8px #53629E22',
          transition: 'background 0.2s'
        }}>Login</button>
        {message && <p style={{ color: '#473472', marginTop: 8 }}>{message}</p>}
        <div style={{ marginTop: 12, textAlign: 'center', width: '100%' }}>
          <span style={{ color: '#53629E', marginRight: 8 }}>Don't have an account?</span>
          <button type="button" onClick={() => {
            const next = getQueryParam('next') || '/home';
            navigate(`/signup?next=${encodeURIComponent(next)}`);
          }} style={{ background: '#473472', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Sign up</button>
        </div>
      </form>
    </div>
  );
}
