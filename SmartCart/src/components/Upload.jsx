import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

export default function Upload() {
    const { occasionId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleContinue = () => {
        if (!image) {
            toast.warning('Please upload an image first.');
            return;
        }
        // Store preview in localStorage to pass to Recommendations page (simulating state persistence)
        try {
            localStorage.setItem('uploaded_preview', preview);
        } catch (e) { }
        navigate(`/recommendations/${occasionId}`);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #D6F4ED 0%, #87BAC3 100%)',
            display: 'flex',
            flexDirection: 'column',
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
                maxWidth: '600px',
                width: '100%',
                position: 'relative'
            }}>
                <button onClick={() => navigate('/home')} style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: '#473472',
                    fontWeight: 'bold'
                }}>
                    ← Back
                </button>

                <h2 style={{ color: '#473472', fontSize: '2rem', marginBottom: '1rem' }}>Upload Your Photo</h2>
                <p style={{ color: '#53629E', marginBottom: '2rem' }}>We'll show you how the outfits look on you!</p>

                <div
                    style={{
                        border: '3px dashed #87BAC3',
                        borderRadius: '16px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        cursor: 'pointer',
                        background: '#F9FBFD',
                        transition: 'background 0.2s'
                    }}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    {preview ? (
                        <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ color: '#87BAC3' }}>
                            <p style={{ fontSize: '3rem', margin: 0 }}>📷</p>
                            <p style={{ fontWeight: 600 }}>Click or Drag & Drop to Upload</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleContinue}
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
                        transition: 'transform 0.2s',
                        opacity: image ? 1 : 0.6,
                        pointerEvents: image ? 'auto' : 'none'
                    }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
