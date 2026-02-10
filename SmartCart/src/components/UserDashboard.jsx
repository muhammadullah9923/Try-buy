import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL, API_ENDPOINTS, getImageUrl } from "../config/api";

export default function UserDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: ""
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: "0.00"
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Redirect vendors to their dashboard
    if (user.role === "vendor") {
      navigate("/vendor/dashboard");
      return;
    }
    // Redirect admins to their dashboard
    if (user.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }
    fetchUserData();
    fetchOrders();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem('auth_token');
      if (token) headers['X-Auth-Token'] = token;
      
      const res = await fetch(`${API_URL}/api/user/profile/`, {
        headers,
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setStats(data.stats || stats);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem('auth_token');
      if (token) headers['X-Auth-Token'] = token;
      
      const res = await fetch(`${API_URL}/api/user/orders/`, {
        headers,
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        // Update stats based on orders
        const totalOrders = data.orders.length;
        const pendingOrders = data.orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length;
        const completedOrders = data.orders.filter(o => o.status === 'Delivered').length;
        // Only count paid orders in total spent
        const totalSpent = data.orders
          .filter(o => o.payment_status === 'Paid')
          .reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2);
        setStats({ totalOrders, pendingOrders, completedOrders, totalSpent });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
    setLoading(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    
    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem('auth_token');
      if (token) headers['X-Auth-Token'] = token;
      
      const res = await fetch(`${API_URL}/api/user/profile/update/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setEditingProfile(false);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
  };

  const handleLogout = async () => {
    try {
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem('auth_token');
      if (token) headers['X-Auth-Token'] = token;
      
      await fetch(API_ENDPOINTS.logout, {
        method: "POST",
        headers,
        credentials: "include"
      });
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_role");
      setUser(null);
      navigate("/home");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "orders", label: "My Orders", icon: "📦" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return { bg: "#e8f5e9", color: "#2e7d32" };
      case "shipped": return { bg: "#e3f2fd", color: "#1976d2" };
      case "processing": return { bg: "#fff3e0", color: "#e65100" };
      case "pending": return { bg: "#fce4ec", color: "#c2185b" };
      case "cancelled": return { bg: "#ffebee", color: "#c62828" };
      default: return { bg: "#f5f5f5", color: "#666" };
    }
  };

  const containerStyle = {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7fa"
  };

  const sidebarStyle = {
    width: 260,
    background: "linear-gradient(180deg, #2F8F8F 0%, #1a5f5f 100%)",
    color: "#fff",
    padding: "24px 0",
    display: "flex",
    flexDirection: "column"
  };

  const mainStyle = {
    flex: 1,
    padding: 24,
    overflowY: "auto"
  };

  const tabStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 24px",
    cursor: "pointer",
    background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
    borderLeft: isActive ? "4px solid #fff" : "4px solid transparent",
    transition: "all 0.2s",
    fontSize: 15,
    fontWeight: isActive ? 600 : 400
  });

  const statCardStyle = {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    flex: 1,
    minWidth: 180
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    marginTop: 4,
    boxSizing: "border-box"
  };

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>Please log in to access your dashboard.</p>
        <Link to="/login" style={{ color: "#2F8F8F" }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>My Account</h2>
          <p style={{ opacity: 0.7, fontSize: 13 }}>{user.username}</p>
        </div>

        <nav style={{ flex: 1 }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              style={tabStyle(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: "0 24px", marginTop: "auto" }}>
          <Link 
            to="/home" 
            style={{ 
              display: "flex", 
              alignItems: "center",
              gap: 8,
              color: "#fff", 
              opacity: 0.9, 
              marginBottom: 12,
              fontSize: 14,
              textDecoration: "none",
              padding: "10px 0"
            }}
          >
            🛍️ Continue Shopping
          </Link>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: 10,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={mainStyle}>
        {activeTab === "overview" && (
          <div>
            <h1 style={{ marginBottom: 24, color: "#333" }}>Welcome, {user.username}!</h1>
            
            {/* Stats Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 20, 
              marginBottom: 32
            }}>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Orders</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#2F8F8F" }}>
                  {loading ? "..." : stats.totalOrders}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Pending Orders</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#ff9800" }}>
                  {loading ? "..." : stats.pendingOrders}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Completed</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#4caf50" }}>
                  {loading ? "..." : stats.completedOrders}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Spent</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#9c27b0" }}>
                  ${loading ? "..." : stats.totalSpent}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ 
              background: "#fff", 
              borderRadius: 12, 
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              marginBottom: 24
            }}>
              <h3 style={{ marginBottom: 16, color: "#333" }}>Quick Actions</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/home")}
                  style={{
                    padding: "12px 24px",
                    background: "#2F8F8F",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  🛍️ Shop Now
                </button>
                <button
                  onClick={() => navigate("/cart")}
                  style={{
                    padding: "12px 24px",
                    background: "#fff",
                    color: "#2F8F8F",
                    border: "2px solid #2F8F8F",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  🛒 View Cart
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  style={{
                    padding: "12px 24px",
                    background: "#fff",
                    color: "#2F8F8F",
                    border: "2px solid #2F8F8F",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  📦 Track Orders
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div style={{ 
              background: "#fff", 
              borderRadius: 12, 
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: "#333" }}>Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2F8F8F",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  View All →
                </button>
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: 20, color: "#888" }}>Loading...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <p>No orders yet. Start shopping!</p>
                  <button
                    onClick={() => navigate("/home")}
                    style={{
                      marginTop: 12,
                      padding: "10px 20px",
                      background: "#2F8F8F",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div>
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom: "1px solid #f0f0f0"
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#333" }}>Order #{order.id}</div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{order.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          ...getStatusColor(order.status),
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-block"
                        }}>
                          {order.status}
                        </span>
                        <div style={{ fontWeight: 600, color: "#333", marginTop: 4 }}>Rs. {order.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h1 style={{ marginBottom: 24, color: "#333" }}>My Orders</h1>
            
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: 60,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
                <h3 style={{ color: "#333", marginBottom: 8 }}>No Orders Yet</h3>
                <p style={{ color: "#888", marginBottom: 20 }}>Start shopping to see your orders here.</p>
                <button
                  onClick={() => navigate("/home")}
                  style={{
                    padding: "12px 28px",
                    background: "#2F8F8F",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}>
                {orders.map(order => (
                  <div key={order.id} style={{
                    padding: 20,
                    borderBottom: "1px solid #f0f0f0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#333" }}>Order #{order.id}</div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Placed on {order.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          background: getStatusColor(order.status).bg,
                          color: getStatusColor(order.status).color,
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 600
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div style={{ marginBottom: 16 }}>
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 0",
                          borderTop: idx > 0 ? "1px solid #f5f5f5" : "none"
                        }}>
                          {item.image && (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6 }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: "#333" }}>{item.name}</div>
                            <div style={{ fontSize: 13, color: "#888" }}>Qty: {item.quantity} × Rs. {item.price}</div>
                          </div>
                          <div style={{ fontWeight: 600, color: "#333" }}>
                            Rs. {(item.quantity * parseFloat(item.price)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Total */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 12,
                      borderTop: "1px solid #f0f0f0"
                    }}>
                      <div style={{ color: "#888" }}>
                        {order.items?.length || 0} item(s)
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: "#2F8F8F" }}>
                        Total: Rs. {order.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h1 style={{ marginBottom: 24, color: "#333" }}>My Profile</h1>
            
            {message.text && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
                background: message.type === "success" ? "#e8f5e9" : "#ffebee",
                color: message.type === "success" ? "#2e7d32" : "#c62828",
                fontSize: 14
              }}>
                {message.text}
              </div>
            )}
            
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}>Personal Information</h3>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    style={{
                      padding: "8px 16px",
                      background: "#2F8F8F",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              
              {editingProfile ? (
                <form onSubmit={handleProfileUpdate}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#666" }}>First Name</span>
                      <input
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#666" }}>Last Name</span>
                      <input
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#666" }}>Email</span>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#666" }}>Phone</span>
                      <input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: "block", gridColumn: "span 2" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#666" }}>Address</span>
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        rows={2}
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    </label>
                  </div>
                  <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 24px",
                        background: "#2F8F8F",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingProfile(false); fetchUserData(); }}
                      style={{
                        padding: "10px 24px",
                        background: "#f5f5f5",
                        color: "#333",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Username</div>
                    <div style={{ fontWeight: 500, color: "#333" }}>{profile.username || user.username}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Email</div>
                    <div style={{ fontWeight: 500, color: "#333" }}>{profile.email || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>First Name</div>
                    <div style={{ fontWeight: 500, color: "#333" }}>{profile.first_name || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Last Name</div>
                    <div style={{ fontWeight: 500, color: "#333" }}>{profile.last_name || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Phone</div>
                    <div style={{ fontWeight: 500, color: "#333" }}>{profile.phone || "-"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Address</div>
                    <div style={{ fontWeight: 500, color: "#333" }}>{profile.address || "-"}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Account Actions */}
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              marginTop: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <h3 style={{ marginBottom: 16 }}>Account Settings</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {user.role === "customer" && (
                  <button
                    onClick={() => navigate("/vendor/upgrade")}
                    style={{
                      padding: "10px 20px",
                      background: "#5C5470",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    🏪 Become a Vendor
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "10px 20px",
                    background: "#ffebee",
                    color: "#c62828",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
