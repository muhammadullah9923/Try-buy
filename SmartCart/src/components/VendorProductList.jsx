
import React, { useState, useEffect } from "react";
import VendorAddProduct from "./VendorAddProduct";
import VendorEditProduct from "./VendorEditProduct";
import VendorReport from "./VendorReport";

export default function VendorProductList({ vendorId }) {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/products/`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          setError(data.message || "Failed to load products.");
        }
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (!vendorId) return <div>Please log in as a vendor.</div>;
  if (loading) return <div>Loading products...</div>;
  if (error) return <div style={{ color: "#c00" }}>{error}</div>;

  return (
    <section style={{ maxWidth: 900, margin: "2rem auto", background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <h2 style={{ color: "#473472" }}>Your Products</h2>
      <VendorAddProduct vendorId={vendorId} onProductAdded={() => {
        // Refresh product list after adding
        setLoading(true);
        fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/products/`)
          .then(r => r.json())
          .then(data => {
            if (data.success && data.products) {
              setProducts(data.products);
            }
          })
          .finally(() => setLoading(false));
      }} />
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
            <VendorEditProduct product={editingProduct} onUpdated={() => {
              setEditingProduct(null);
              setLoading(true);
              fetch(`http://3.226.254.81:8080/api/vendor/${vendorId}/products/`)
                .then(r => r.json())
                .then(data => {
                  if (data.success && data.products) {
                    setProducts(data.products);
                  }
                })
                .finally(() => setLoading(false));
            }} />
            <button onClick={() => setEditingProduct(null)} style={{ marginTop: 8, background: '#eee', border: 'none', borderRadius: 6, padding: 8, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      {products.length === 0 ? (
        <div>No products listed yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th>Name</th>
              <th>Price</th>
              <th>Occasion</th>
              <th>Description</th>
              <th>Image</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>Rs. {p.price}</td>
                <td>{p.occasion || "-"}</td>
                <td>{p.description}</td>
                <td>{p.image ? <img src={p.image.startsWith('http') ? p.image : `http://3.226.254.81:8080${p.image}`} alt={p.name} style={{ width: 60, borderRadius: 6 }} /> : "-"}</td>
                <td><button onClick={() => setEditingProduct(p)} style={{ background: '#473472', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <hr style={{ margin: '2rem 0' }} />
      <VendorReport vendorId={vendorId} />
    </section>
  );
}
