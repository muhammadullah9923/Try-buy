import React from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.jpg"; // Add your logo image to src/assets/

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://3.226.254.81:8080/accounts/logout/", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("profile_image");
    if (setUser) setUser(null);
    navigate("/home");
  };

  const navStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "#473472",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000
  };

  const logoStyle = {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 8
  };

  const navLinksStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  };

  const linkStyle = {
    color: "#fff",
    textDecoration: "none",
    padding: "8px 16px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    transition: "background 0.2s",
    background: "rgba(255,255,255,0.1)"
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: 20,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s"
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: "#2F8F8F",
    color: "#fff"
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "rgba(255,255,255,0.2)",
    color: "#fff"
  };

  const userRole = user?.role || "guest";

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <Link to="/home" style={logoStyle}>
        <img 
          src={logo} 
          alt="Try & Buy Logo" 
          style={{ height: 40, width: "auto", borderRadius: "50%" }} 
        />
        Try & Buy
      </Link>

      {/* Navigation Links */}
      <div style={navLinksStyle}>
        {/* Home - Always visible */}
        <Link to="/home" style={linkStyle}>
          🏠 Home
        </Link>

        {/* Cart - For customers and guests only */}
        {userRole !== "vendor" && userRole !== "admin" && (
          <Link to="/cart" style={linkStyle}>
            🛒 Cart
          </Link>
        )}

        {/* Role-specific navigation */}
        {userRole === "customer" && (
          <>
            <Link to="/user/dashboard" style={linkStyle}>
              👤 My Account
            </Link>
            <Link to="/vendor/upgrade" style={{...linkStyle, background: "#5C5470"}}>
              🏪 Become Vendor
            </Link>
          </>
        )}

        {userRole === "vendor" && (
          <Link to="/vendor/dashboard" style={{...linkStyle, background: "#38405F"}}>
            📊 Vendor Dashboard
          </Link>
        )}

        {userRole === "admin" && (
          <Link to="/admin/dashboard" style={{...linkStyle, background: "#1C2541"}}>
            🛠️ Admin Panel
          </Link>
        )}

        {/* Auth buttons */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, opacity: 0.9 }}>
              👋 {user.username}
              {userRole !== "guest" && (
                <span style={{ 
                  marginLeft: 8, 
                  padding: "2px 8px", 
                  background: "rgba(255,255,255,0.2)", 
                  borderRadius: 10, 
                  fontSize: 11,
                  textTransform: "capitalize"
                }}>
                  {userRole}
                </span>
              )}
            </span>
            <button onClick={handleLogout} style={secondaryButtonStyle}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/login")} style={primaryButtonStyle}>
              Login
            </button>
            <button onClick={() => navigate("/signup")} style={secondaryButtonStyle}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
