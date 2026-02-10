import React, { useState, useEffect } from "react";

export default function VendorEarnings({ vendorId }) {
  const [earnings, setEarnings] = useState({
    totalSales: 0,
    totalCommission: 0,
    netEarnings: 0,
    pendingPayout: 0,
    paidOut: 0,
    commissionRate: 10
  });
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchEarnings();
    fetchPayouts();
  }, [vendorId, period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/vendor/${vendorId}/earnings/?period=${period}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setEarnings(data.earnings);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching earnings:", err);
    }
    setLoading(false);
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/vendor/${vendorId}/payouts/`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
    }
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    flex: 1,
    minWidth: 200
  };

  const tabStyle = (isActive) => ({
    padding: "10px 20px",
    background: isActive ? "#473472" : "transparent",
    color: isActive ? "#fff" : "#666",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s"
  });

  const periodStyle = (isActive) => ({
    padding: "6px 14px",
    background: isActive ? "#e8e0f3" : "#f5f5f5",
    color: isActive ? "#473472" : "#666",
    border: "none",
    borderRadius: 20,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 12
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#333" }}>Earnings & Payouts</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPeriod("today")} style={periodStyle(period === "today")}>Today</button>
          <button onClick={() => setPeriod("week")} style={periodStyle(period === "week")}>This Week</button>
          <button onClick={() => setPeriod("month")} style={periodStyle(period === "month")}>This Month</button>
          <button onClick={() => setPeriod("all")} style={periodStyle(period === "all")}>All Time</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Sales</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#333" }}>
            Rs. {loading ? "..." : earnings.totalSales}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Platform Commission ({earnings.commissionRate}%)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#c62828" }}>
            -Rs. {loading ? "..." : earnings.totalCommission}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Net Earnings</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#4caf50" }}>
            Rs. {loading ? "..." : earnings.netEarnings}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Pending Payout</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#ff9800" }}>
            Rs. {loading ? "..." : earnings.pendingPayout}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Total Paid Out</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#2196f3" }}>
            Rs. {loading ? "..." : earnings.paidOut}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 24, display: "flex", gap: 8 }}>
        <button onClick={() => setActiveTab("overview")} style={tabStyle(activeTab === "overview")}>
          Sales Overview
        </button>
        <button onClick={() => setActiveTab("transactions")} style={tabStyle(activeTab === "transactions")}>
          Transaction History
        </button>
        <button onClick={() => setActiveTab("payouts")} style={tabStyle(activeTab === "payouts")}>
          Payout History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <h3 style={{ marginBottom: 20, color: "#333" }}>Earnings Breakdown</h3>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#666" }}>Gross Sales</span>
              <span style={{ fontWeight: 600 }}>Rs. {earnings.totalSales}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#666" }}>Platform Commission ({earnings.commissionRate}%)</span>
              <span style={{ fontWeight: 600, color: "#c62828" }}>-Rs. {earnings.totalCommission}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: "#333" }}>Your Earnings</span>
              <span style={{ fontWeight: 700, color: "#4caf50", fontSize: 18 }}>Rs. {earnings.netEarnings}</span>
            </div>
          </div>

          <div style={{ 
            background: "#f5f7fa", 
            borderRadius: 8, 
            padding: 16,
            fontSize: 14,
            color: "#666"
          }}>
            <strong>💡 Payout Information:</strong> Payouts are processed weekly on Mondays. 
            Minimum payout threshold is $50. Contact admin for any payout queries.
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <p style={{ color: "#888" }}>No transactions found for this period.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f7fa" }}>
                  <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Date</th>
                  <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Order #</th>
                  <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Product</th>
                  <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 13, color: "#666" }}>Sale Amount</th>
                  <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 13, color: "#666" }}>Commission</th>
                  <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 13, color: "#666" }}>Your Earning</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 14, color: "#666" }}>{tx.date}</td>
                    <td style={{ padding: 14, fontWeight: 600 }}>#{tx.order_id}</td>
                    <td style={{ padding: 14 }}>{tx.product_name}</td>
                    <td style={{ padding: 14, textAlign: "right" }}>Rs. {tx.sale_amount}</td>
                    <td style={{ padding: 14, textAlign: "right", color: "#c62828" }}>-Rs. {tx.commission}</td>
                    <td style={{ padding: 14, textAlign: "right", color: "#4caf50", fontWeight: 600 }}>Rs. {tx.net_earning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "payouts" && (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          {payouts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <p style={{ color: "#888" }}>No payouts have been processed yet.</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>Payouts are processed weekly once you reach the minimum threshold.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f7fa" }}>
                  <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Date</th>
                  <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Payout ID</th>
                  <th style={{ padding: 14, textAlign: "right", fontWeight: 600, fontSize: 13, color: "#666" }}>Amount</th>
                  <th style={{ padding: 14, textAlign: "center", fontWeight: 600, fontSize: 13, color: "#666" }}>Status</th>
                  <th style={{ padding: 14, textAlign: "left", fontWeight: 600, fontSize: 13, color: "#666" }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 14, color: "#666" }}>{payout.date}</td>
                    <td style={{ padding: 14, fontWeight: 600 }}>#{payout.payout_id}</td>
                    <td style={{ padding: 14, textAlign: "right", fontWeight: 600, color: "#4caf50" }}>Rs. {payout.amount}</td>
                    <td style={{ padding: 14, textAlign: "center" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: payout.status === "completed" ? "#e8f5e9" : "#fff3e0",
                        color: payout.status === "completed" ? "#2e7d32" : "#e65100"
                      }}>
                        {payout.status}
                      </span>
                    </td>
                    <td style={{ padding: 14, color: "#666" }}>{payout.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
