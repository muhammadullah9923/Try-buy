import React, { useState, useEffect } from "react";

export default function VendorOrders({ vendorId, onStatsChange }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });

  const statusColors = {
    pending: { bg: "#fff3e0", text: "#e65100" },
    processing: { bg: "#e3f2fd", text: "#1565c0" },
    shipped: { bg: "#e8f5e9", text: "#2e7d32" },
    delivered: { bg: "#e8f5e9", text: "#1b5e20" },
    cancelled: { bg: "#ffebee", text: "#c62828" }
  };

  useEffect(() => {
    fetchOrders();
  }, [vendorId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/orders/`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, itemId, newStatus) => {
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/order/update_status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          order_id: orderId, 
          item_id: itemId,
          status: newStatus 
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Order status updated!" });
        fetchOrders();
        if (onStatsChange) onStatsChange();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update status." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error." });
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    return order.status?.toLowerCase() === filter;
  });

  const orderStats = {
    all: orders.length,
    pending: orders.filter(o => o.status?.toLowerCase() === "pending").length,
    processing: orders.filter(o => o.status?.toLowerCase() === "processing").length,
    shipped: orders.filter(o => o.status?.toLowerCase() === "shipped").length,
    delivered: orders.filter(o => o.status?.toLowerCase() === "delivered").length,
    cancelled: orders.filter(o => o.status?.toLowerCase() === "cancelled").length
  };

  const filterButtonStyle = (isActive) => ({
    padding: "8px 16px",
    background: isActive ? "#473472" : "#f5f5f5",
    color: isActive ? "#fff" : "#666",
    border: "none",
    borderRadius: 20,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
    transition: "all 0.2s"
  });

  return (
    <div>
      <h1 style={{ marginBottom: 24, color: "#333" }}>Order Management</h1>

      {message.text && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          background: message.type === "success" ? "#e8f5e9" : "#ffebee",
          color: message.type === "success" ? "#2e7d32" : "#c62828",
          fontSize: 14
        }}>
          {message.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        gap: 10,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setFilter("all")}
          style={filterButtonStyle(filter === "all")}
        >
          All Orders ({orderStats.all})
        </button>
        <button
          onClick={() => setFilter("pending")}
          style={filterButtonStyle(filter === "pending")}
        >
          Pending ({orderStats.pending})
        </button>
        <button
          onClick={() => setFilter("processing")}
          style={filterButtonStyle(filter === "processing")}
        >
          Processing ({orderStats.processing})
        </button>
        <button
          onClick={() => setFilter("shipped")}
          style={filterButtonStyle(filter === "shipped")}
        >
          Shipped ({orderStats.shipped})
        </button>
        <button
          onClick={() => setFilter("delivered")}
          style={filterButtonStyle(filter === "delivered")}
        >
          Delivered ({orderStats.delivered})
        </button>
        <button
          onClick={() => setFilter("cancelled")}
          style={filterButtonStyle(filter === "cancelled")}
        >
          Cancelled ({orderStats.cancelled})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ color: "#333", marginBottom: 8 }}>No Orders Found</h3>
          <p style={{ color: "#888" }}>
            {filter === "all" 
              ? "You haven't received any orders yet." 
              : `No ${filter} orders at the moment.`}
          </p>
        </div>
      ) : (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          {filteredOrders.map((order) => (
            <div
              key={`${order.order_id}-${order.item_id}`}
              style={{
                padding: 20,
                borderBottom: "1px solid #eee",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 20,
                alignItems: "center"
              }}
            >
              {/* Product Image */}
              <div>
                {order.product_image ? (
                  <img
                    src={order.product_image.startsWith('http') ? order.product_image : `http://3.226.254.81:8080${order.product_image}`}
                    alt={order.product_name}
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div style={{
                    width: 80,
                    height: 80,
                    background: "#f5f5f5",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ccc"
                  }}>
                    No img
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12,
                  marginBottom: 8 
                }}>
                  <span style={{ fontWeight: 700, color: "#333" }}>
                    Order #{order.order_id}
                  </span>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: statusColors[order.status?.toLowerCase()]?.bg || "#f5f5f5",
                    color: statusColors[order.status?.toLowerCase()]?.text || "#666"
                  }}>
                    {order.status || "Pending"}
                  </span>
                </div>

                <div style={{ color: "#333", fontWeight: 500, marginBottom: 4 }}>
                  {order.product_name}
                </div>

                <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                  Qty: {order.quantity} × Rs. {order.price} = 
                  <span style={{ color: "#473472", fontWeight: 600 }}> Rs. {(order.quantity * parseFloat(order.price)).toFixed(2)}</span>
                </div>

                <div style={{ fontSize: 13, color: "#888" }}>
                  <strong>Customer:</strong> {order.customer_name || "N/A"} | 
                  <strong> Date:</strong> {order.date}
                </div>

                {order.shipping_address && (
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    <strong>Ship to:</strong> {order.shipping_address}
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div style={{ textAlign: "right" }}>
                <select
                  value={order.status || "pending"}
                  onChange={(e) => updateOrderStatus(order.order_id, order.item_id, e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 13,
                    cursor: "pointer",
                    background: "#fff"
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div style={{ 
                  marginTop: 8, 
                  fontSize: 12, 
                  color: "#888" 
                }}>
                  Commission: Rs. {order.commission || "0.00"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
