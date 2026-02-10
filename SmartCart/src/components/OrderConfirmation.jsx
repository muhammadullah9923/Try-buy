import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function OrderConfirmation() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #D6F4ED 0%, #87BAC3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            padding: '2rem'
        }}>
            <div style={{
                background: '#fff',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ color: '#473472', fontSize: '2rem', marginBottom: '0.5rem' }}>Order Confirmed!</h2>
                <p style={{ color: '#53629E', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Thank you for your purchase. Your order <strong>#{orderId}</strong> has been placed successfully.
                </p>

                <div style={{ background: '#F9FBFD', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <p style={{ margin: 0, color: '#473472', fontWeight: 600 }}>Estimated Delivery</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', color: '#2F8F8F', fontWeight: 700 }}>3-5 Business Days</p>
                </div>

                <button
                    onClick={() => navigate('/home')}
                    style={{
                        padding: '1rem 3rem',
                        borderRadius: '30px',
                        border: 'none',
                        background: '#473472',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(71, 52, 114, 0.3)',
                        transition: 'transform 0.2s'
                    }}
                >
                    Continue Shopping
                </button>
            </div>
        </div>
    );
}
