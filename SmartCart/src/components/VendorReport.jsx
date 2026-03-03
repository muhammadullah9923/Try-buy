import React, { useState } from "react";

export default function VendorReport({ vendorId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/report/`);
      const data = await res.json();
      if (data.success) setReport(data);
      else setError(data.message || "Failed to load report.");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  };

  return (
    <section style={{ maxWidth: 700, margin: "2rem auto", background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <h2 style={{ color: "#473472" }}>Vendor Sales & Commission Report</h2>
      <button onClick={fetchReport} style={{ marginBottom: 16, background: '#473472', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Load Report</button>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#c00' }}>{error}</div>}
      {report && (
        <div>
          <div><b>Total Sales:</b> ${report.total_sales}</div>
          <div><b>Total Commission:</b> ${report.total_commission}</div>
          <div><b>Orders:</b> {report.orders.length}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th>Order ID</th>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              {report.orders.map(o => (
                <tr key={o.order_id}>
                  <td>{o.order_id}</td>
                  <td>{o.date}</td>
                  <td>{o.product}</td>
                  <td>{o.quantity}</td>
                  <td>Rs. {o.price}</td>
                  <td>Rs. {o.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
