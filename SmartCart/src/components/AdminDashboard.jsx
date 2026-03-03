import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./Toast";

const API_BASE = "http://3.226.254.81:8080/api";

// Stats Card Component
const StatsCard = ({ title, value, subtitle, color = "#473472", icon }) => (
  <div style={{
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    flex: 1,
    minWidth: 200
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {icon && <span style={{ fontSize: 28 }}>{icon}</span>}
      <div>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
        {subtitle && <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  </div>
);

// Table Component
const DataTable = ({ columns, data, loading, onRowClick, actions }) => (
  <div style={{ overflowX: "auto", background: "#fff", borderRadius: 8 }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, color: "#333" }}>
      <thead>
        <tr style={{ background: "#f8f9fa" }}>
          {columns.map((col, i) => (
            <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, borderBottom: "2px solid #e0e0e0", color: "#333" }}>
              {col.header}
            </th>
          ))}
          {actions && <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, borderBottom: "2px solid #e0e0e0", color: "#333" }}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading...</td></tr>
        ) : !data || data.length === 0 ? (
          <tr><td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 40, textAlign: "center", color: "#666" }}>No data found</td></tr>
        ) : (
          data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? "pointer" : "default", borderBottom: "1px solid #eee", background: "#fff" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9f9f9"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{ padding: "12px 16px", color: "#333" }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "-")}
                </td>
              ))}
              {actions && (
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// Action Button Component
const ActionButton = ({ onClick, color = "#473472", children, small, disabled }) => (
  <button
    onClick={e => { e.stopPropagation(); onClick?.(); }}
    disabled={disabled}
    style={{
      padding: small ? "4px 10px" : "8px 16px",
      border: "none",
      background: disabled ? "#ccc" : color,
      color: "#fff",
      fontWeight: 600,
      fontSize: small ? 12 : 14,
      cursor: disabled ? "not-allowed" : "pointer",
      borderRadius: 6,
      transition: "opacity 0.2s"
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
  >
    {children}
  </button>
);

// Status Badge Component
const StatusBadge = ({ status, type = "default" }) => {
  const colors = {
    active: { bg: "#e8f5e9", text: "#2e7d32" },
    inactive: { bg: "#ffebee", text: "#c62828" },
    pending: { bg: "#fff3e0", text: "#ef6c00" },
    approved: { bg: "#e8f5e9", text: "#2e7d32" },
    rejected: { bg: "#ffebee", text: "#c62828" },
    processing: { bg: "#e3f2fd", text: "#1565c0" },
    shipped: { bg: "#f3e5f5", text: "#7b1fa2" },
    delivered: { bg: "#e8f5e9", text: "#2e7d32" },
    cancelled: { bg: "#ffebee", text: "#c62828" },
    customer: { bg: "#e3f2fd", text: "#1565c0" },
    vendor: { bg: "#f3e5f5", text: "#7b1fa2" },
    admin: { bg: "#fff3e0", text: "#ef6c00" },
    paid: { bg: "#e8f5e9", text: "#2e7d32" },
    unpaid: { bg: "#ffebee", text: "#c62828" },
    default: { bg: "#f5f5f5", text: "#666" }
  };
  const color = colors[status?.toLowerCase()] || colors.default;
  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: color.bg,
      color: color.text,
      textTransform: "capitalize"
    }}>
      {status || "-"}
    </span>
  );
};

// Modal Component
const Modal = ({ open, onClose, title, children, width = 600 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        width: "90%",
        maxWidth: width,
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ margin: 0, color: "#473472" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: "#666"
          }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

// Filter Bar Component
const FilterBar = ({ filters, onFilterChange, onSearch }) => (
  <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
    {filters.map((filter, idx) => (
      <select
        key={idx}
        value={filter.value}
        onChange={e => onFilterChange(filter.key, e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 14
        }}
      >
        {filter.options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ))}
    {onSearch && (
      <input
        type="text"
        placeholder="Search..."
        onChange={e => onSearch(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 14,
          minWidth: 200
        }}
      />
    )}
  </div>
);

export default function AdminDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Data states
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  
  // Filter states
  const [vendorFilter, setVendorFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewOccasionModal, setShowNewOccasionModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  // Sidebar tabs
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "vendors", label: "Vendors", icon: "🏪", badge: stats?.vendors?.pending || 0 },
    { id: "products", label: "Products", icon: "📦", badge: stats?.products?.pending || 0 },
    { id: "users", label: "Users", icon: "👥" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "categories", label: "Categories", icon: "🏷️" },
    { id: "reports", label: "Reports", icon: "📈" }
  ];

  // Styles matching VendorDashboard
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
    fontWeight: isActive ? 600 : 400,
    position: "relative"
  });

  const handleLogout = async () => {
    try {
      await fetch("http://3.226.254.81:8080/accounts/logout/", {
        method: "POST",
        credentials: "include"
      });
      if (setUser) setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem('auth_token');
    if (token) headers['X-Auth-Token'] = token;
    return headers;
  };

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/stats/`, { 
        headers: getAuthHeaders(),
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (vendorFilter !== "all") params.append("status", vendorFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const res = await fetch(`${API_BASE}/admin/vendors/?${params}`, { 
        headers: getAuthHeaders(),
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) setVendors(data.vendors);
    } catch (err) {
      setError("Failed to fetch vendors");
    }
    setLoading(false);
  }, [vendorFilter, searchTerm]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (productFilter !== "all") params.append("status", productFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const res = await fetch(`${API_BASE}/admin/products/?${params}`, { 
        headers: getAuthHeaders(),
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      setError("Failed to fetch products");
    }
    setLoading(false);
  }, [productFilter, searchTerm]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userFilter !== "all") params.append("role", userFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const res = await fetch(`${API_BASE}/admin/users/?${params}`, { 
        headers: getAuthHeaders(),
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      setError("Failed to fetch users");
    }
    setLoading(false);
  }, [userFilter, searchTerm]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderFilter !== "all") params.append("status", orderFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const res = await fetch(`${API_BASE}/admin/orders/?${params}`, { 
        headers: getAuthHeaders(),
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      setError("Failed to fetch orders");
    }
    setLoading(false);
  }, [orderFilter, searchTerm]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/categories/`, { 
        headers: getAuthHeaders(),
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  // Fetch occasions
  const fetchOccasions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/occasions/`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setOccasions(data.occasions);
    } catch (err) {
      console.error("Failed to fetch occasions:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchOccasions();
  }, [fetchStats]);

  // Fetch data based on active tab
  useEffect(() => {
    setSearchTerm("");
    if (activeTab === "vendors") fetchVendors();
    else if (activeTab === "products") fetchProducts();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "orders") fetchOrders();
  }, [activeTab, fetchVendors, fetchProducts, fetchUsers, fetchOrders]);

  // Re-fetch when filters change
  useEffect(() => {
    if (activeTab === "vendors") fetchVendors();
  }, [vendorFilter, fetchVendors]);

  useEffect(() => {
    if (activeTab === "products") fetchProducts();
  }, [productFilter, fetchProducts]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [userFilter, fetchUsers]);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
  }, [orderFilter, fetchOrders]);

  // Action handlers
  const handleVendorAction = async (vendorId, action) => {
    try {
      let url = `${API_BASE}/admin/vendors/${vendorId}/`;
      let body = {};
      
      if (action === "approve") url += "approve/";
      else if (action === "reject") {
        url += "reject/";
        body = { reason: rejectionReason };
      }
      else if (action === "toggle") url += "toggle-status/";
      else if (action === "commission") {
        url += "commission/";
        body = { commission_rate: parseFloat(commissionRate) };
      }
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchVendors();
        fetchStats();
        setModalType(null);
        setSelectedItem(null);
        setRejectionReason("");
        setCommissionRate("");
        toast.success(data.message);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Action failed: " + err.message);
    }
  };

  const handleProductAction = async (productId, action) => {
    try {
      let url = `${API_BASE}/admin/products/${productId}/`;
      let body = {};
      
      if (action === "approve") url += "approve/";
      else if (action === "reject") {
        url += "reject/";
        body = { reason: rejectionReason };
      }
      else if (action === "toggle") url += "toggle-status/";
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchProducts();
        fetchStats();
        setModalType(null);
        setSelectedItem(null);
        setRejectionReason("");
        toast.success(data.message);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Action failed: " + err.message);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchUsers();
        toast.success(data.message);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Action failed: " + err.message);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/update-status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchOrders();
        toast.success(data.message);
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Action failed: " + err.message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newItemName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName }),
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchCategories();
        setShowNewCategoryModal(false);
        setNewItemName("");
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to create category");
      }
    } catch (err) {
      toast.error("Failed to create category: " + err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${categoryId}/delete/`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchCategories();
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (err) {
      toast.error("Failed to delete category: " + err.message);
    }
  };

  const handleCreateOccasion = async () => {
    if (!newItemName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/admin/occasions/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName }),
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchOccasions();
        setShowNewOccasionModal(false);
        setNewItemName("");
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to create occasion");
      }
    } catch (err) {
      toast.error("Failed to create occasion: " + err.message);
    }
  };

  const handleDeleteOccasion = async (occasionId) => {
    if (!confirm("Are you sure you want to delete this occasion?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/occasions/${occasionId}/delete/`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        fetchOccasions();
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to delete occasion");
      }
    } catch (err) {
      toast.error("Failed to delete occasion: " + err.message);
    }
  };

  const handleExportReport = async (reportType) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/export/?type=${reportType}`, { credentials: "include" });
      const data = await res.json();
      
      if (data.success) {
        // Create and download CSV file
        const blob = new Blob([data.csv_content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast.error(data.message || "Export failed");
      }
    } catch (err) {
      toast.error("Export failed: " + err.message);
    }
  };

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>📊 Dashboard Overview</h3>
      
      {stats ? (
        <>
          {/* Quick Stats Row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatsCard title="Total Users" value={stats.users?.total || 0} icon="👥" />
            <StatsCard title="Total Vendors" value={stats.vendors?.total || 0} icon="🏪" subtitle={`${stats.vendors?.pending || 0} pending`} />
            <StatsCard title="Total Products" value={stats.products?.total || 0} icon="📦" subtitle={`${stats.products?.pending || 0} pending approval`} />
            <StatsCard title="Total Orders" value={stats.orders?.total || 0} icon="🛒" subtitle={`${stats.orders?.today || 0} today`} />
          </div>

          {/* Revenue Row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatsCard title="Total Revenue" value={`Rs. ${stats.revenue?.total || "0.00"}`} color="#2e7d32" icon="💰" />
            <StatsCard title="Commission Earned" value={`Rs. ${stats.revenue?.commission || "0.00"}`} color="#1565c0" icon="💵" />
            <StatsCard title="This Month Revenue" value={`Rs. ${stats.revenue?.monthRevenue || "0.00"}`} color="#7b1fa2" icon="📈" />
            <StatsCard title="This Month Commission" value={`Rs. ${stats.revenue?.monthCommission || "0.00"}`} color="#ef6c00" icon="📊" />
          </div>

          {/* Order Status Row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <StatsCard title="Pending Orders" value={stats.orders?.pending || 0} color="#ef6c00" icon="⏳" />
            <StatsCard title="Processing" value={stats.orders?.processing || 0} color="#1565c0" icon="🔄" />
            <StatsCard title="Completed" value={stats.orders?.completed || 0} color="#2e7d32" icon="✅" />
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 12, marginBottom: 24 }}>
            <h4 style={{ margin: "0 0 16px 0", color: "#333" }}>⚡ Quick Actions</h4>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <ActionButton onClick={() => setActiveTab("vendors")} color="#7b1fa2">
                📋 Review Pending Vendors ({stats.vendors?.pending || 0})
              </ActionButton>
              <ActionButton onClick={() => setActiveTab("products")} color="#ef6c00">
                📦 Moderate Products ({stats.products?.pending || 0})
              </ActionButton>
              <ActionButton onClick={() => setActiveTab("orders")} color="#1565c0">
                🛒 View All Orders
              </ActionButton>
              <ActionButton onClick={() => handleExportReport("sales")} color="#2e7d32">
                📥 Export Sales Report
              </ActionButton>
            </div>
          </div>

          {/* Daily Stats Chart (Simple) */}
          {stats.dailyStats && stats.dailyStats.length > 0 && (
            <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h4 style={{ margin: "0 0 16px 0", color: "#333" }}>📈 Last 7 Days Performance</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 150 }}>
                {stats.dailyStats.map((day, idx) => {
                  const maxRevenue = Math.max(...stats.dailyStats.map(d => parseFloat(d.revenue) || 1));
                  const height = ((parseFloat(day.revenue) || 0) / maxRevenue) * 100;
                  return (
                    <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{
                        background: "#473472",
                        height: `${Math.max(height, 5)}%`,
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.3s"
                      }} title={`Rs. ${day.revenue}`}></div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{day.day}</div>
                      <div style={{ fontSize: 10, color: "#999" }}>Rs. {day.revenue}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>Loading dashboard...</div>
      )}
    </div>
  );

  // Render Vendors Tab
  const renderVendors = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>🏪 Vendor Management</h3>
      
      <FilterBar
        filters={[{
          key: "status",
          value: vendorFilter,
          options: [
            { value: "all", label: "All Vendors" },
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending/Inactive" }
          ]
        }]}
        onFilterChange={(key, value) => setVendorFilter(value)}
        onSearch={setSearchTerm}
      />

      <DataTable
        loading={loading}
        columns={[
          { key: "name", header: "Vendor Name", render: v => v || "-" },
          { key: "username", header: "Username", render: v => v || "-" },
          { key: "email", header: "Email", render: v => v || "-" },
          { key: "phone", header: "Phone", render: v => v || "-" },
          { key: "commission_rate", header: "Commission", render: v => v ? `${v}%` : "10%" },
          { key: "product_count", header: "Products", render: v => v ?? 0 },
          { key: "total_sales", header: "Sales", render: v => v ? `Rs. ${v}` : "Rs. 0.00" },
          { key: "is_active", header: "Status", render: v => <StatusBadge status={v ? "active" : "inactive"} /> }
        ]}
        data={vendors}
        actions={(row) => (
          <>
            {!row.is_active && (
              <ActionButton small color="#2e7d32" onClick={() => handleVendorAction(row.id, "approve")}>
                ✓ Approve
              </ActionButton>
            )}
            <ActionButton small color={row.is_active ? "#c62828" : "#2e7d32"} onClick={() => handleVendorAction(row.id, "toggle")}>
              {row.is_active ? "Block" : "Unblock"}
            </ActionButton>
            <ActionButton small color="#1565c0" onClick={() => { setSelectedItem(row); setModalType("vendor-commission"); setCommissionRate(row.commission_rate); }}>
              Commission
            </ActionButton>
          </>
        )}
      />
    </div>
  );

  // Render Products Tab
  const renderProducts = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>📦 Product Moderation</h3>
      
      <FilterBar
        filters={[{
          key: "status",
          value: productFilter,
          options: [
            { value: "all", label: "All Products" },
            { value: "pending", label: "Pending Approval" },
            { value: "approved", label: "Approved" }
          ]
        }]}
        onFilterChange={(key, value) => setProductFilter(value)}
        onSearch={setSearchTerm}
      />

      <DataTable
        loading={loading}
        columns={[
          { key: "image", header: "Image", render: (v, row) => v ? (
            <img src={`http://3.226.254.81:8080${v}`} alt={row.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6 }} />
          ) : <span style={{ color: "#999" }}>No image</span> },
          { key: "name", header: "Product Name", render: v => v || "-" },
          { key: "vendor_name", header: "Vendor", render: v => v || "No Vendor" },
          { key: "category", header: "Category", render: v => v || "-" },
          { key: "price", header: "Price", render: v => v ? `Rs. ${v}` : "-" },
          { key: "stock_quantity", header: "Stock", render: v => v ?? 0 },
          { key: "is_approved", header: "Approved", render: v => <StatusBadge status={v ? "approved" : "pending"} /> },
          { key: "is_active", header: "Status", render: v => <StatusBadge status={v ? "active" : "inactive"} /> }
        ]}
        data={products}
        actions={(row) => (
          <>
            {!row.is_approved && (
              <>
                <ActionButton small color="#2e7d32" onClick={() => handleProductAction(row.id, "approve")}>
                  ✓ Approve
                </ActionButton>
                <ActionButton small color="#c62828" onClick={() => { setSelectedItem(row); setModalType("product-reject"); }}>
                  ✗ Reject
                </ActionButton>
              </>
            )}
            <ActionButton small color={row.is_active ? "#ef6c00" : "#2e7d32"} onClick={() => handleProductAction(row.id, "toggle")}>
              {row.is_active ? "Suspend" : "Activate"}
            </ActionButton>
          </>
        )}
      />
    </div>
  );

  // Render Users Tab
  const renderUsers = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>👥 User Management</h3>
      
      <FilterBar
        filters={[{
          key: "role",
          value: userFilter,
          options: [
            { value: "all", label: "All Users" },
            { value: "customer", label: "Customers" },
            { value: "vendor", label: "Vendors" },
            { value: "admin", label: "Admins" }
          ]
        }]}
        onFilterChange={(key, value) => setUserFilter(value)}
        onSearch={setSearchTerm}
      />

      <DataTable
        loading={loading}
        columns={[
          { key: "username", header: "Username", render: v => v || "-" },
          { key: "email", header: "Email", render: v => v || "-" },
          { key: "first_name", header: "First Name", render: v => v || "-" },
          { key: "last_name", header: "Last Name", render: v => v || "-" },
          { key: "role", header: "Role", render: v => <StatusBadge status={v || "customer"} /> },
          { key: "order_count", header: "Orders", render: v => v ?? 0 },
          { key: "date_joined", header: "Joined", render: v => v || "-" },
          { key: "is_active", header: "Status", render: v => <StatusBadge status={v ? "active" : "inactive"} /> }
        ]}
        data={users}
        actions={(row) => (
          row.role !== "admin" && (
            <ActionButton small color={row.is_active ? "#c62828" : "#2e7d32"} onClick={() => handleUserAction(row.id, "toggle")}>
              {row.is_active ? "Block" : "Unblock"}
            </ActionButton>
          )
        )}
      />
    </div>
  );

  // Render Orders Tab
  const renderOrders = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>🛒 Order Management</h3>
      
      <FilterBar
        filters={[{
          key: "status",
          value: orderFilter,
          options: [
            { value: "all", label: "All Orders" },
            { value: "pending", label: "Pending" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" }
          ]
        }]}
        onFilterChange={(key, value) => setOrderFilter(value)}
        onSearch={setSearchTerm}
      />

      <div style={{ marginBottom: 16 }}>
        <ActionButton onClick={() => handleExportReport("orders")} color="#2e7d32">
          📥 Export Orders CSV
        </ActionButton>
      </div>

      <DataTable
        loading={loading}
        columns={[
          { key: "id", header: "Order #", render: v => v ? `#${v}` : "-" },
          { key: "username", header: "Customer", render: v => v || "Guest" },
          { key: "email", header: "Email", render: v => v || "-" },
          { key: "vendors", header: "Vendor(s)", render: v => v && v.length > 0 ? v.join(", ") : "No vendor" },
          { key: "items_count", header: "Items", render: v => v ?? 0 },
          { key: "total_amount", header: "Total", render: v => v ? `Rs. ${v}` : "Rs. 0.00" },
          { key: "payment_status", header: "Payment", render: v => <StatusBadge status={v || "pending"} /> },
          { key: "status", header: "Order Status", render: v => <StatusBadge status={v || "pending"} /> },
          { key: "created_at", header: "Date", render: v => v || "-" }
        ]}
        data={orders}
        actions={(row) => (
          <select
            value={row.status}
            onChange={e => handleOrderStatusUpdate(row.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd" }}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      />
    </div>
  );

  // Render Categories & Occasions Tab
  const renderCategoriesOccasions = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>🏷️ Categories & Occasions</h3>
      
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Categories */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Categories</h4>
            <ActionButton small onClick={() => setShowNewCategoryModal(true)}>+ Add Category</ActionButton>
          </div>
          <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16 }}>
            {categories.length === 0 ? (
              <div style={{ color: "#666", textAlign: "center" }}>No categories found</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#fff",
                  borderRadius: 6,
                  marginBottom: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  <div>
                    <strong>{cat.name}</strong>
                    <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>({cat.product_count} products)</span>
                  </div>
                  <ActionButton small color="#c62828" onClick={() => handleDeleteCategory(cat.id)} disabled={cat.product_count > 0}>
                    Delete
                  </ActionButton>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Occasions */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Occasions</h4>
            <ActionButton small onClick={() => setShowNewOccasionModal(true)}>+ Add Occasion</ActionButton>
          </div>
          <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16 }}>
            {occasions.length === 0 ? (
              <div style={{ color: "#666", textAlign: "center" }}>No occasions found</div>
            ) : (
              occasions.map(occ => (
                <div key={occ.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#fff",
                  borderRadius: 6,
                  marginBottom: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  <div>
                    <strong>{occ.name}</strong>
                    <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>({occ.product_count} products)</span>
                  </div>
                  <ActionButton small color="#c62828" onClick={() => handleDeleteOccasion(occ.id)} disabled={occ.product_count > 0}>
                    Delete
                  </ActionButton>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Reports Tab
  const renderReports = () => (
    <div>
      <h3 style={{ color: "#473472", marginBottom: 20 }}>📊 Reports & Analytics</h3>
      
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <ActionButton onClick={() => handleExportReport("sales")} color="#2e7d32">📥 Export Sales Report (CSV)</ActionButton>
        <ActionButton onClick={() => handleExportReport("orders")} color="#1565c0">📥 Export Orders (CSV)</ActionButton>
        <ActionButton onClick={() => handleExportReport("vendors")} color="#7b1fa2">📥 Export Vendors (CSV)</ActionButton>
        <ActionButton onClick={() => handleExportReport("products")} color="#ef6c00">📥 Export Products (CSV)</ActionButton>
      </div>

      {stats && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Summary Card */}
          <div style={{ flex: 1, minWidth: 300, background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h4 style={{ margin: "0 0 16px 0", color: "#473472" }}>📈 Platform Summary</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Revenue:</span>
                <strong style={{ color: "#2e7d32" }}>Rs. {stats.revenue?.total || "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Commission:</span>
                <strong style={{ color: "#1565c0" }}>Rs. {stats.revenue?.commission || "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Orders:</span>
                <strong>{stats.orders?.total || 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Active Vendors:</span>
                <strong>{stats.vendors?.active || 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Active Products:</span>
                <strong>{stats.products?.active || 0}</strong>
              </div>
            </div>
          </div>

          {/* Commission Card */}
          <div style={{ flex: 1, minWidth: 300, background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h4 style={{ margin: "0 0 16px 0", color: "#473472" }}>💰 Commission Analytics</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>This Month Commission:</span>
                <strong style={{ color: "#2e7d32" }}>Rs. {stats.revenue?.monthCommission || "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Vendors with Custom Rate:</span>
                <strong>{vendors.filter(v => v.commission_rate !== "10.00").length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Default Rate:</span>
                <strong>10%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>🛠️ Admin Panel</h2>
          <p style={{ opacity: 0.7, fontSize: 13 }}>{user?.username || "Administrator"}</p>
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
              {tab.badge > 0 && (
                <span style={{
                  position: "absolute",
                  right: 16,
                  background: "#e53935",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  minWidth: 18,
                  textAlign: "center"
                }}>{tab.badge}</span>
              )}
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
        {error && <div style={{ color: "#c62828", marginBottom: 16, padding: 12, background: "#ffebee", borderRadius: 8 }}>{error}</div>}
        
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "vendors" && renderVendors()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "categories" && renderCategoriesOccasions()}
        {activeTab === "reports" && renderReports()}
      </main>

      {/* Commission Modal */}
      <Modal
        open={modalType === "vendor-commission"}
        onClose={() => { setModalType(null); setSelectedItem(null); setCommissionRate(""); }}
        title={`Update Commission Rate - ${selectedItem?.name}`}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Commission Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={commissionRate}
            onChange={e => setCommissionRate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <ActionButton color="#666" onClick={() => { setModalType(null); setSelectedItem(null); setCommissionRate(""); }}>
            Cancel
          </ActionButton>
          <ActionButton onClick={() => handleVendorAction(selectedItem?.id, "commission")}>
            Update Commission
          </ActionButton>
        </div>
      </Modal>

      {/* Reject Product Modal */}
      <Modal
        open={modalType === "product-reject"}
        onClose={() => { setModalType(null); setSelectedItem(null); setRejectionReason(""); }}
        title={`Reject Product - ${selectedItem?.name}`}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Rejection Reason</label>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, minHeight: 100, resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <ActionButton color="#666" onClick={() => { setModalType(null); setSelectedItem(null); setRejectionReason(""); }}>
            Cancel
          </ActionButton>
          <ActionButton color="#c62828" onClick={() => handleProductAction(selectedItem?.id, "reject")}>
            Reject Product
          </ActionButton>
        </div>
      </Modal>

      {/* New Category Modal */}
      <Modal
        open={showNewCategoryModal}
        onClose={() => { setShowNewCategoryModal(false); setNewItemName(""); }}
        title="Add New Category"
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Category Name</label>
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Enter category name..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <ActionButton color="#666" onClick={() => { setShowNewCategoryModal(false); setNewItemName(""); }}>
            Cancel
          </ActionButton>
          <ActionButton onClick={handleCreateCategory}>
            Create Category
          </ActionButton>
        </div>
      </Modal>

      {/* New Occasion Modal */}
      <Modal
        open={showNewOccasionModal}
        onClose={() => { setShowNewOccasionModal(false); setNewItemName(""); }}
        title="Add New Occasion"
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Occasion Name</label>
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Enter occasion name..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <ActionButton color="#666" onClick={() => { setShowNewOccasionModal(false); setNewItemName(""); }}>
            Cancel
          </ActionButton>
          <ActionButton onClick={handleCreateOccasion}>
            Create Occasion
          </ActionButton>
        </div>
      </Modal>
    </div>
  );
}

