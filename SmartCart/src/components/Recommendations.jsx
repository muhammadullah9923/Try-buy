import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VirtualTryOn from './VirtualTryOn';
import { useToast } from './Toast';

export default function Recommendations({ user }) {
    const { occasionId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProductForTryOn, setSelectedProductForTryOn] = useState(null);
    const [uploadedPreview, setUploadedPreview] = useState(null);

    useEffect(() => {
        // Retrieve uploaded preview from localStorage
        const preview = localStorage.getItem('uploaded_preview');
        if (preview) setUploadedPreview(preview);

        fetch(`http://3.226.254.81:8080/api/recommendations/${occasionId}/`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.products);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [occasionId]);

    const handleAddToCart = (product) => {
        if (!user) {
            navigate(`/login?next=/recommendations/${occasionId}`);
            return;
        }
        // Restrict vendors and admins from adding to cart
        if (user.role === 'vendor') {
            toast.warning('Vendors cannot add items to cart. Please use a customer account.');
            return;
        }
        if (user.role === 'admin') {
            toast.warning('Admins cannot add items to cart. Please use a customer account.');
            return;
        }

        const headers = { "Content-Type": "application/json" };
        const token = localStorage.getItem('auth_token');
        if (token) headers['X-Auth-Token'] = token;

        fetch("http://3.226.254.81:8080/api/cart/add/", {
            method: "POST",
            headers,
            body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    toast.success('Added to cart!');
                } else {
                    toast.error(data.message || 'Failed to add to cart');
                }
            })
            .catch(() => toast.error('Network error'));
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading recommendations...</div>;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #D6F4ED 0%, #87BAC3 100%)',
            padding: '2rem',
            fontFamily: 'Segoe UI, Arial, sans-serif'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate(`/upload/${occasionId}`)} style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#473472'
                }}>← Back to Upload</button>
                <button onClick={() => navigate('/cart')} style={{
                    padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', background: '#2F8F8F', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}>Cart</button>
            </div>

            <h2 style={{ color: '#473472', textAlign: 'center', marginBottom: '1rem' }}>Recommended for You</h2>

            {uploadedPreview && (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ color: '#53629E', fontWeight: 600, marginBottom: '0.5rem' }}>Based on your upload:</p>
                    <img src={uploadedPreview} alt="Your upload" style={{ height: '100px', borderRadius: '12px', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </div>
            )}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2rem",
                maxWidth: 1200,
                margin: '0 auto'
            }}>
                {products.map(product => (
                    <div key={product.id} style={{
                        background: "#fff",
                        borderRadius: "20px",
                        padding: "1.5rem",
                        textAlign: "center",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Mock "Try-On" Result: Overlay the uploaded image on the product image (simplified) */}
                        <div style={{ position: 'relative', height: '220px', marginBottom: '1rem' }}>
                            <img src={product.image ? (product.image.startsWith('http') ? product.image : `http://3.226.254.81:8080${product.image}`) : ''}
                                alt={product.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                            />
                            {uploadedPreview && (
                                <div style={{
                                    position: 'absolute', bottom: 10, right: 10, width: 60, height: 60,
                                    borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}>
                                    <img src={uploadedPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>

                        <h3 style={{ color: '#473472', margin: '0.5rem 0', fontSize: '1.2rem' }}>{product.name}</h3>
                        <p style={{ color: "#53629E", fontWeight: 'bold', fontSize: '1.3rem' }}>{product.price}</p>

                        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1.2rem' }}>
                            <button onClick={() => handleAddToCart(product)} style={{
                                flex: 1, padding: '0.7rem', borderRadius: '12px', border: 'none', background: '#473472', color: '#fff', cursor: 'pointer', fontWeight: 700
                            }}>Add to Cart</button>
                            <button onClick={() => setSelectedProductForTryOn(product)} style={{
                                padding: '0.7rem', borderRadius: '12px', border: 'none', background: '#E0E7FF', color: '#473472', cursor: 'pointer', fontWeight: 600
                            }}>Try On</button>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && <p style={{ textAlign: 'center', color: '#473472' }}>No products found for this occasion.</p>}

            {selectedProductForTryOn && (
                <VirtualTryOn product={selectedProductForTryOn} onClose={() => setSelectedProductForTryOn(null)} />
            )}
        </div>
    );
}
