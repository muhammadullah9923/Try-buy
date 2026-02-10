import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Stripe Elements styling
const cardStyle = {
  style: {
    base: {
      color: '#333',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#aab7c4' }
    },
    invalid: { color: '#fa755a', iconColor: '#fa755a' }
  },
  hidePostalCode: true  // Hide postal code since we collect it in shipping form
};

// Stripe Payment Form Component
function StripePaymentForm({ formData, cart, onSuccess, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent when component mounts
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem('auth_token');
    if (token) headers['X-Auth-Token'] = token;
    
    fetch("http://127.0.0.1:8000/api/stripe/create-payment-intent/", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({})
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClientSecret(data.client_secret);
        } else {
          toast.error(data.message || 'Failed to initialize payment');
        }
      })
      .catch(() => toast.error('Failed to connect to payment service'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    
    setProcessing(true);
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: formData.full_name,
          address: {
            line1: formData.address,
            city: formData.city,
            postal_code: formData.zip_code,
            country: formData.country.substring(0, 2).toUpperCase() || 'US'
          }
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Confirm payment on backend and create order
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem('auth_token');
      if (token) headers['X-Auth-Token'] = token;
      
      const res = await fetch("http://127.0.0.1:8000/api/stripe/confirm-payment/", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          ...formData
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Payment successful!');
        onSuccess(data.order_id);
      } else {
        toast.error(data.message || 'Failed to create order');
      }
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4 style={{ color: '#53629E', marginBottom: '1rem' }}>Payment Details</h4>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Shipping:</strong> {formData.full_name}, {formData.address}, {formData.city}, {formData.zip_code}, {formData.country}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Cart Total:</strong> Rs. {cart.total}
      </div>
      <div style={{ padding: '1rem', border: '1.5px solid #87BAC3', borderRadius: 12, marginBottom: '1rem', background: '#fafbfc' }}>
        <CardElement options={cardStyle} />
      </div>
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
        🔒 Secured by Stripe. Your card details are encrypted.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onBack} style={buttonStyle} disabled={processing}>Back</button>
        <button type="submit" style={{ ...buttonStyle, background: processing ? '#999' : '#28a745' }} disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Pay Rs. ${cart.total}`}
        </button>
      </div>
    </form>
  );
}

export default function Checkout({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [formData, setFormData] = useState({
    full_name: '', address: '', city: '', zip_code: '', country: ''
  });
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?next=/checkout');
      return;
    }
    
    // Fetch Stripe config
    fetch("http://127.0.0.1:8000/api/stripe/config/")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStripePromise(loadStripe(data.publishable_key));
        }
      })
      .catch(() => {});
    
    // Fetch cart
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem('auth_token');
    if (token) headers['X-Auth-Token'] = token;
    fetch("http://127.0.0.1:8000/api/cart/", { headers, credentials: "include" })
      .then(res => res.json())
      .then(data => { if (data.success) setCart(data.cart); })
      .catch(() => { });
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };
  
  const handleBack = () => {
    setStep(1);
  };

  const handlePaymentSuccess = (orderId) => {
    navigate(`/order-confirmation/${orderId}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', padding: '2rem', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Multi-step Form Section */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#473472', marginBottom: '1.5rem' }}>Checkout</h2>
          
          {/* Progress indicator */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#53629E' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: step >= 2 ? '#53629E' : '#ddd' }} />
          </div>
          
          {step === 1 && (
            <form onSubmit={handleNext}>
              <h4 style={{ color: '#53629E', marginBottom: '1rem' }}>Shipping Details</h4>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <input name="full_name" placeholder="Full Name" value={formData.full_name} required onChange={handleChange} style={inputStyle} />
                <input name="address" placeholder="Address" value={formData.address} required onChange={handleChange} style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input name="city" placeholder="City" value={formData.city} required onChange={handleChange} style={inputStyle} />
                  <input name="zip_code" placeholder="Zip Code" value={formData.zip_code} required onChange={handleChange} style={inputStyle} />
                </div>
                <input name="country" placeholder="Country" value={formData.country} required onChange={handleChange} style={inputStyle} />
              </div>
              <button type="submit" style={{ ...buttonStyle, marginTop: '1.5rem' }}>Continue to Payment</button>
            </form>
          )}
          
          {step === 2 && stripePromise && (
            <Elements stripe={stripePromise}>
              <StripePaymentForm 
                formData={formData} 
                cart={cart} 
                onSuccess={handlePaymentSuccess}
                onBack={handleBack}
              />
            </Elements>
          )}
        </div>
        
        {/* Order Summary */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h3 style={{ color: '#473472', marginBottom: '1.5rem' }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={item.product.image ? (item.product.image.startsWith('http') ? item.product.image : `http://127.0.0.1:8000${item.product.image}`) : ''} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#777' }}>Qty: {item.quantity}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: '#473472' }}>Rs. {(parseFloat(item.product.price) * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #eee', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: '#473472' }}>
            <span>Total</span>
            <span>Rs. {cart.total}</span>
          </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: 8, fontSize: '0.85rem', color: '#0369a1' }}>
            💳 Secure checkout powered by Stripe
          </div>
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: 12, border: '1.5px solid #87BAC3', fontSize: 16
};
const buttonStyle = {
  padding: '0.7rem 1.5rem', borderRadius: 14, border: 'none', background: '#53629E', color: '#fff', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #53629E22', transition: 'background 0.2s'
};
