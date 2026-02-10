import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL, API_ENDPOINTS } from "../config/api";
import VendorProfile from "./VendorProfile";
import VendorProducts from "./VendorProducts";
import VendorOrders from "./VendorOrders";
import VendorEarnings from "./VendorEarnings";

export default function VendorDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [vendorData, setVendorData] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalSales: "0.00",
    pendingOrders: 0,
    totalEarnings: "0.00",
    todaySales: "0.00",
    todayOrders: 0,
    weekSales: "0.00",
    weekOrders: 0,
    monthSales: "0.00",
    monthOrders: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  const [stockAlerts, setStockAlerts] = useState({ lowStock: [], outOfStock: [] });
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.vendor_id) {
      navigate("/login");
      return;
    }
    fetchVendorData();
    fetchStats();
  }, [user, navigate]);

  const fetchVendorData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vendor/${user.vendor_id}/profile/`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setVendorData(data.vendor);
      }
    } catch (err) {
      console.error("Error fetching vendor data:", err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vendor/${user.vendor_id}/stats/`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setStockAlerts(data.stockAlerts || { lowStock: [], outOfStock: [] });
        setDailySales(data.dailySales || []);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.logout, {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "products", label: "Products", icon: "👗" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "earnings", label: "Earnings", icon: "💰" },
    { id: "profile", label: "Profile", icon: "⚙️" }
  ];

  const containerStyle = {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7fa"
  };

  const sidebarStyle = {
    width: 260,
    background: "#473472",
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

  if (!user || !user.vendor_id) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>You need to be logged in as a vendor to access this page.</p>
        <Link to="/login" style={{ color: "#473472" }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Vendor Dashboard</h2>
          <p style={{ opacity: 0.7, fontSize: 13 }}>{vendorData?.name || user.username}</p>
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
              display: "block", 
              color: "#fff", 
              opacity: 0.7, 
              marginBottom: 12,
              fontSize: 14,
              textDecoration: "none"
            }}
          >
            ← Back to Store
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
            <h1 style={{ marginBottom: 24, color: "#333" }}>Welcome back, {vendorData?.name || user.username}!</h1>
            
            {/* Stock Alerts Banner */}
            {(stats.outOfStockCount > 0 || stats.lowStockCount > 0) && (
              <div style={{
                background: stats.outOfStockCount > 0 ? "#ffebee" : "#fff3e0",
                border: `1px solid ${stats.outOfStockCount > 0 ? "#ef9a9a" : "#ffcc80"}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>⚠️</span>
                  <div>
                    <strong style={{ color: stats.outOfStockCount > 0 ? "#c62828" : "#e65100" }}>
                      Stock Alert
                    </strong>
                    <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
                      {stats.outOfStockCount > 0 && `${stats.outOfStockCount} product(s) out of stock. `}
                      {stats.lowStockCount > 0 && `${stats.lowStockCount} product(s) running low.`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("products")}
                  style={{
                    padding: "8px 16px",
                    background: stats.outOfStockCount > 0 ? "#c62828" : "#e65100",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  Manage Inventory
                </button>
              </div>
            )}
            
            {/* Time-based Stats Summary */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: 20, 
              marginBottom: 24 
            }}>
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 12,
                padding: 20,
                color: "#fff"
              }}>
                <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 8 }}>Today</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>Rs. {loading ? "..." : stats.todaySales}</div>
                <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                  {loading ? "..." : stats.todayOrders} orders
                </div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                borderRadius: 12,
                padding: 20,
                color: "#fff"
              }}>
                <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 8 }}>This Week</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>Rs. {loading ? "..." : stats.weekSales}</div>
                <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                  {loading ? "..." : stats.weekOrders} orders
                </div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                borderRadius: 12,
                padding: 20,
                color: "#fff"
              }}>
                <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 8 }}>This Month</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>Rs. {loading ? "..." : stats.monthSales}</div>
                <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                  {loading ? "..." : stats.monthOrders} orders
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ 
              display: "flex", 
              gap: 20, 
              marginBottom: 32,
              flexWrap: "wrap"
            }}>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Products</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#473472" }}>
                  {loading ? "..." : stats.totalProducts}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  {stats.activeProducts} active
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Orders</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#2196f3" }}>
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
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Sales</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#4caf50" }}>
                  Rs. {loading ? "..." : stats.totalSales}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Your Earnings</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#9c27b0" }}>
                  Rs. {loading ? "..." : stats.totalEarnings}
                </div>
              </div>
            </div>

            {/* Daily Sales Chart */}
            {dailySales.length > 0 && (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}>
                <h3 style={{ marginBottom: 20, color: "#333" }}>Sales This Week</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 150 }}>
                  {dailySales.map((day, i) => {
                    const maxSales = Math.max(...dailySales.map(d => parseFloat(d.sales) || 1));
                    const height = maxSales > 0 ? (parseFloat(day.sales) / maxSales) * 120 : 0;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{
                          height: Math.max(height, 4),
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.3s"
                        }} />
                        <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>{day.day}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>Rs. {day.sales}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Stock Alerts Section */}
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}>
                <h3 style={{ marginBottom: 16, color: "#333" }}>Stock Alerts</h3>
                {stockAlerts.outOfStock.length === 0 && stockAlerts.lowStock.length === 0 ? (
                  <div style={{ color: "#888", fontSize: 14, textAlign: "center", padding: 20 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                    All products are well stocked!
                  </div>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {stockAlerts.outOfStock.map(p => (
                      <div key={p.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #f0f0f0"
                      }}>
                        <span style={{ fontSize: 14 }}>{p.name}</span>
                        <span style={{
                          background: "#ffebee",
                          color: "#c62828",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}>OUT OF STOCK</span>
                      </div>
                    ))}
                    {stockAlerts.lowStock.map(p => (
                      <div key={p.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #f0f0f0"
                      }}>
                        <span style={{ fontSize: 14 }}>{p.name}</span>
                        <span style={{
                          background: "#fff3e0",
                          color: "#e65100",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}>LOW ({p.stock})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ 
                background: "#fff", 
                borderRadius: 12, 
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
              }}>
                <h3 style={{ marginBottom: 16, color: "#333" }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button
                    onClick={() => setActiveTab("products")}
                    style={{
                      padding: "12px 24px",
                      background: "#473472",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      textAlign: "left"
                    }}
                  >
                    + Add New Product
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    style={{
                      padding: "12px 24px",
                      background: "#fff",
                      color: "#473472",
                      border: "2px solid #473472",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      textAlign: "left"
                    }}
                  >
                    📦 View Orders ({stats.pendingOrders} pending)
                  </button>
                  <button
                    onClick={() => setActiveTab("earnings")}
                    style={{
                      padding: "12px 24px",
                      background: "#fff",
                      color: "#473472",
                      border: "2px solid #473472",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      textAlign: "left"
                    }}
                  >
                    💰 View Earnings Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <VendorProducts vendorId={user.vendor_id} onStatsChange={fetchStats} />
        )}

        {activeTab === "orders" && (
          <VendorOrders vendorId={user.vendor_id} onStatsChange={fetchStats} />
        )}

        {activeTab === "earnings" && (
          <VendorEarnings vendorId={user.vendor_id} />
        )}

        {activeTab === "profile" && (
          <VendorProfile 
            vendorId={user.vendor_id} 
            vendorData={vendorData} 
            onUpdate={fetchVendorData} 
          />
        )}
      </main>
    </div>
  );
}
