import React, { useState } from 'react';
import { useToast } from './Toast';

export default function VirtualTryOn({ product, onClose, onAddToCart, user }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: processing, 3: result
  const toast = useToast();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResultImage(null);
      setStep(1); // Reset to upload step
    }
  };

  const handleTryOn = async () => {
    if (!user) {
      localStorage.setItem('post_login_action', JSON.stringify({ type: 'try_on', product_id: product.id }));
      window.location.href = '/login?next=/home';
      return;
    }
    if (!image) return;
    setLoading(true);
    setStep(2); // Show processing step
    const formData = new FormData();
    formData.append('image', image);
    formData.append('product_id', product.id);

    try {
      console.log('🔄 Sending try-on request...');
      const res = await fetch('http://127.0.0.1:8000/api/try-on/', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      // Check if response is ok
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Ensure URL is absolute
        let imageUrl = data.result_image;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `http://127.0.0.1:8000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
        }
        console.log('✓ Try-on successful! Result URL:', imageUrl);
        setResultImage(imageUrl);
        setStep(3); // Show result step
      } else {
        const errorMsg = data.message || 'Try-on failed. Please try again.';
        console.error('❌ Try-on error:', errorMsg);
        toast.error(errorMsg);
        setStep(1); // Go back to upload
      }
    } catch (e) {
      console.error('❌ Try-on network error:', e);
      const errorMsg = e.message || 'Unknown error';
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        toast.error('Network error: Please check server connection');
      } else {
        toast.error('Error: ' + errorMsg);
      }
      setStep(1); // Go back to upload
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
          setResultImage(null);
    setStep(1);
  };

          return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem'
          }}>
            <div style={{
        background: '#fff', 
        padding: '2.5rem', 
        borderRadius: '20px', 
        maxWidth: '90%', 
        width: step === 3 ? '700px' : '550px',
        maxHeight: '90vh',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', 
        position: 'relative',
        overflow: 'auto'
      }}>
        {/* Close Button */}
              <button onClick={onClose} style={{
          position: 'absolute', 
          top: 15, 
          right: 15, 
          background: '#f5f5f5', 
          border: 'none', 
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          fontSize: '20px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => { e.target.style.background = '#e0e0e0'; }}
        onMouseOut={(e) => { e.target.style.background = '#f5f5f5'; }}
        >&times;</button>

        {/* Product Info Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '1.5rem' }}>
          <h2 style={{ color: '#473472', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
            Virtual Try-On
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#53629E', fontSize: '1.1rem' }}>{product.name}</span>
            <span style={{ fontWeight: 700, color: '#473472', fontSize: '1.2rem' }}>Rs. {product.price}</span>
            {product.occasion && (
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '15px', 
                background: '#e2e6f7', 
                color: '#444', 
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                {product.occasion}
              </span>
            )}
          </div>
        </div>

        {/* Step 1: Upload Image */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1.5rem' }}>
                Upload your photo to see how this looks on you!
              </p>
              <label style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#53629E',
                color: '#fff',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(83, 98, 158, 0.3)'
              }}
              onMouseOver={(e) => { e.target.style.background = '#473472'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.target.style.background = '#53629E'; e.target.style.transform = 'none'; }}
              >
                Choose Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              </div>

              {preview && (
              <div style={{ 
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#f9f9f9',
                borderRadius: '12px',
                border: '2px dashed #ddd'
              }}>
                <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#473472' }}>Preview:</p>
                <img 
                  src={preview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
                <button 
                  onClick={handleTryOn} 
                  disabled={loading}
                  style={{
                    padding: '1rem 3rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: loading ? '#ccc' : '#473472',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    transition: 'all 0.2s',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(71, 52, 114, 0.4)',
                    minWidth: '200px'
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.background = '#53629E';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(71, 52, 114, 0.5)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.target.style.background = '#473472';
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = '0 4px 16px rgba(71, 52, 114, 0.4)';
                    }
                  }}
                >
                  {loading ? 'Processing...' : '✨ Try It On'}
                </button>
              </div>
            )}
                </div>
              )}

        {/* Step 2: Processing */}
        {step === 2 && loading && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #473472',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 2rem'
            }}></div>
            <p style={{ fontSize: '1.2rem', color: '#473472', fontWeight: 600, marginBottom: '0.5rem' }}>
              Processing Your Try-On...
            </p>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
              This may take a few seconds
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
                </div>
              )}

        {/* Step 3: Result */}
        {step === 3 && resultImage && (
          <div>
          <div style={{
              marginBottom: '2rem', 
              textAlign: 'center',
              padding: '1.5rem',
              background: '#f9f9f9',
              borderRadius: '12px'
            }}>
              <p style={{ fontWeight: 'bold', color: '#53629E', fontSize: '1.1rem', marginBottom: '1rem' }}>
                Your Try-On Result:
              </p>
              <img 
                src={resultImage} 
                alt="Try-On Result" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '500px', 
                  borderRadius: '12px', 
                  border: '3px solid #53629E',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}
                onError={(e) => {
                  console.error('Image load error:', e);
                  toast.error('Failed to load result image.');
                }}
              />
              </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handleReset}
                style={{ 
                  padding: '0.8rem 2rem', 
                  borderRadius: '12px', 
                  border: '2px solid #473472', 
                  background: '#fff', 
                  color: '#473472', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#f5f5f5';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.transform = 'none';
                }}
              >
                Try Another Photo
              </button>
              <button 
                onClick={() => { onAddToCart(); onClose(); }} 
                style={{ 
                  padding: '0.8rem 2.5rem', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: '#473472', 
                  color: '#fff', 
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(71, 52, 114, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#53629E';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(71, 52, 114, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#473472';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = '0 4px 12px rgba(71, 52, 114, 0.3)';
                }}
              >
                Add to Cart
              </button>
            </div>
              </div>
        )}
            </div>
          </div>
          );
}
