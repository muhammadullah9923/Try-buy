import React from "react";
import { Link, Navigate } from "react-router-dom";

export default function LoginPortal({ user }) {
  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    if (user.role === 'vendor' && user.vendor_id) {
      return <Navigate to="/vendor/dashboard" />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/user/dashboard" />;
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        padding: '3rem 2.5rem',
        borderRadius: 24,
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: '#333', 
          fontWeight: 800, 
          marginBottom: 8,
          fontSize: 28
        }}>
          Welcome to SmartCart
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: 15, 
          marginBottom: 40 
        }}>
          Please select how you want to log in
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 20 
        }}>
          {/* User Login Card */}
          <Link 
            to="/login/user" 
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              borderRadius: 16,
              padding: '30px 20px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 125, 50, 0.2)';
              e.currentTarget.style.borderColor = '#2e7d32';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            >
              <div style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <span style={{ fontSize: 36 }}>👤</span>
              </div>
              <h3 style={{ 
                color: '#2e7d32', 
                fontWeight: 700, 
                marginBottom: 8,
                fontSize: 18
              }}>
                User Login
              </h3>
              <p style={{ 
                color: '#558b2f', 
                fontSize: 13,
                lineHeight: 1.4
              }}>
                Shop products, try-on virtually, and manage orders
              </p>
            </div>
          </Link>

          {/* Vendor Login Card */}
          <Link 
            to="/login/vendor" 
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
              borderRadius: 16,
              padding: '30px 20px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(71, 52, 114, 0.2)';
              e.currentTarget.style.borderColor = '#473472';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            >
              <div style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <span style={{ fontSize: 36 }}>🏪</span>
              </div>
              <h3 style={{ 
                color: '#473472', 
                fontWeight: 700, 
                marginBottom: 8,
                fontSize: 18
              }}>
                Vendor Login
              </h3>
              <p style={{ 
                color: '#5e35b1', 
                fontSize: 13,
                lineHeight: 1.4
              }}>
                Manage products, inventory, and track sales
              </p>
            </div>
          </Link>
        </div>

        {/* Admin Login Link */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link 
            to="/login/admin" 
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            🛡️ Admin Access
          </Link>
        </div>

        <div style={{ 
          marginTop: 24, 
          paddingTop: 24, 
          borderTop: '1px solid #eee' 
        }}>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>
            Don't have an account?
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link 
              to="/signup" 
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#333',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Sign up as User
            </Link>
            <Link 
              to="/vendor/register" 
              style={{
                padding: '10px 20px',
                background: '#473472',
                color: '#fff',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Register as Vendor
            </Link>
          </div>
        </div>

        <p style={{ 
          color: '#aaa', 
          fontSize: 12, 
          marginTop: 24 
        }}>
          🔒 Secure login with role-based access
        </p>
      </div>
    </div>
  );
}
