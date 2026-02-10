import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/accounts/login/admin/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);
        if (data.profile_image) {
          localStorage.setItem("profile_image", data.profile_image);
        }
        setUser({ 
          username: data.username, 
          token: data.token, 
          role: data.role,
          profile_image: data.profile_image 
        });
        navigate("/admin");
      } else {
        // Show clear error message
        if (data.error_code === 'ADMIN_ACCESS_DENIED') {
          setError("⚠️ " + data.message + " Only administrators can access this portal.");
        } else {
          setError(data.message || "Login failed. Please check your credentials.");
        }
      }
    } catch (err) {
      console.error('Admin login failed', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <section style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      padding: "2rem"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px",
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 70,
            height: 70,
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 32
          }}>
            🛡️
          </div>
          <h2 style={{ margin: 0, color: "#1a1a2e", fontSize: 26 }}>Admin Portal</h2>
          <p style={{ color: "#666", margin: "8px 0 0 0", fontSize: 14 }}>
            Secure access for administrators only
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              color: "#333",
              fontSize: 14
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Enter admin username"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={e => e.target.style.borderColor = "#1a1a2e"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              color: "#333",
              fontSize: 14
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter admin password"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={e => e.target.style.borderColor = "#1a1a2e"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#999" : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 15px rgba(26, 26, 46, 0.3)"
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(26, 26, 46, 0.4)";
              }
            }}
            onMouseLeave={e => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(26, 26, 46, 0.3)";
            }}
          >
            {loading ? "Authenticating..." : "🔐 Secure Login"}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          marginTop: 24,
          textAlign: "center",
          paddingTop: 20,
          borderTop: "1px solid #eee"
        }}>
          <Link
            to="/login"
            style={{
              color: "#666",
              textDecoration: "none",
              fontSize: 14
            }}
          >
            ← Back to Login Portal
          </Link>
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: 20,
          padding: "12px 16px",
          background: "#f5f5f5",
          borderRadius: 8,
          fontSize: 12,
          color: "#666",
          textAlign: "center"
        }}>
          🔒 This is a secure area. All access attempts are logged.
        </div>
      </div>
    </section>
  );
}
