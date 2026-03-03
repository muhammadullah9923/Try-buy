import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Signup from "./components/Signup";
import Login from "./components/Login";
import LoginPortal from "./components/LoginPortal";
import UserLogin from "./components/UserLogin";
import VendorLogin from "./components/VendorLogin";
import AdminLogin from "./components/AdminLogin";
import Home from "./components/Home";
import Cart from "./components/Cart";
import ProductDetails from "./components/ProductDetails";
import Recommendations from "./components/Recommendations";
import Upload from "./components/Upload";
import Checkout from "./components/Checkout";
import OrderConfirmation from "./components/OrderConfirmation";
import VendorRegister from "./components/VendorRegister";
import VendorDashboard from "./components/VendorDashboard";
import UpgradeToVendor from "./components/UpgradeToVendor";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/Toast";

// ============================================================================
// ROLE-BASED ACCESS CONTROL COMPONENTS
// ============================================================================

// Helper component for role-based access
const RoleProtectedRoute = ({ user, authChecked, allowedRoles, children, redirectTo = "/home" }) => {
  if (!authChecked) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} />;
  }
  return children;
};

// Restrict vendors from user shopping features (cart, checkout, try-on)
const CustomerOnlyRoute = ({ user, authChecked, children }) => {
  if (!authChecked) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  // If user is a vendor, block access and show message
  if (user && user.role === 'vendor' && user.vendor_id) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: '#c62828', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            As a Vendor, you cannot access shopping features like cart, checkout, or virtual try-on.
          </p>
          <a 
            href="/vendor/dashboard" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#473472',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Go to Vendor Dashboard
          </a>
        </div>
      </div>
    );
  }
  // Allow customers and guests
  return children;
};

// Vendor-only route guard
const VendorOnlyRoute = ({ user, authChecked, children }) => {
  if (!authChecked) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login/vendor" />;
  }
  // If user is not a vendor, block access
  if (user.role !== 'vendor' || !user.vendor_id) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: '#c62828', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            You are not authorized to access the Vendor Dashboard. This area is for registered vendors only.
          </p>
          <a 
            href="/user/dashboard" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#2e7d32',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Go to User Dashboard
          </a>
        </div>
      </div>
    );
  }
  return children;
};

// User/Customer-only route guard (for user dashboard)
const UserOnlyRoute = ({ user, authChecked, children }) => {
  if (!authChecked) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login/user" />;
  }
  // If user is a vendor, block access to user dashboard
  if (user.role === 'vendor' && user.vendor_id) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#f5f5f5',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ color: '#c62828', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            As a Vendor, you cannot access the User Dashboard. Please use your Vendor Dashboard instead.
          </p>
          <a 
            href="/vendor/dashboard" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#473472',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Go to Vendor Dashboard
          </a>
        </div>
      </div>
    );
  }
  return children;
};

// Admin-only route guard
const AdminOnlyRoute = ({ user, authChecked, children }) => {
  if (!authChecked) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login/admin" />;
  }
  // If user is not an admin, block access
  if (user.role !== 'admin') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
          <h2 style={{ color: '#c62828', marginBottom: 12 }}>Admin Access Required</h2>
          <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            You do not have administrator privileges to access this area.
          </p>
          <a 
            href="/home" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#1a1a2e',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }
  return children;
};

// Navbar Wrapper - conditionally shows navbar based on route
const NavbarWrapper = ({ user, setUser, shouldShowNavbar }) => {
  const location = useLocation();
  
  if (!shouldShowNavbar(location.pathname)) {
    return null;
  }
  
  return <Navbar user={user} setUser={setUser} />;
};

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("http://3.226.254.81:8080/accounts/current-user/", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.is_authenticated) {
          setUser({
            username: data.username,
            profile_image: data.profile_image,
            role: data.role,
            vendor_id: data.vendor_id
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Pages that should NOT show the navbar (full-screen layouts)
  const noNavbarRoutes = [
    "/login", "/login/user", "/login/vendor", "/login/admin",
    "/signup", "/vendor/register",
    "/vendor/dashboard", "/admin/dashboard", "/admin"
  ];

  // Check if current path should hide navbar
  const shouldShowNavbar = (pathname) => {
    return !noNavbarRoutes.some(route => pathname.startsWith(route));
  };

  return (
    <ToastProvider>
      <Router>
        {/* Global Navbar - shown on most pages except dashboards and login */}
        <NavbarWrapper user={user} setUser={setUser} shouldShowNavbar={shouldShowNavbar} />
        
        <Routes>
        {/* ================================================================ */}
        {/* AUTHENTICATION ROUTES - Separate portals for User and Vendor */}
        {/* ================================================================ */}

        {/* Login Portal - Choose between User or Vendor login */}
        <Route
          path="/login"
          element={<LoginPortal user={user} />}
        />

        {/* User Login - Only for customers/buyers */}
        <Route
          path="/login/user"
          element={
            user ? (
              user.role === 'vendor' && user.vendor_id ? (
                <Navigate to="/vendor/dashboard" />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <Navigate to="/user/dashboard" />
              )
            ) : (
              <UserLogin setUser={setUser} />
            )
          }
        />

        {/* Vendor Login - Only for sellers */}
        <Route
          path="/login/vendor"
          element={
            user ? (
              user.role === 'vendor' && user.vendor_id ? (
                <Navigate to="/vendor/dashboard" />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <Navigate to="/user/dashboard" />
              )
            ) : (
              <VendorLogin setUser={setUser} />
            )
          }
        />

        {/* Admin Login - Only for administrators */}
        <Route
          path="/login/admin"
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin/dashboard" />
              ) : user.role === 'vendor' && user.vendor_id ? (
                <Navigate to="/vendor/dashboard" />
              ) : (
                <Navigate to="/user/dashboard" />
              )
            ) : (
              <AdminLogin setUser={setUser} />
            )
          }
        />

        {/* Signup page - Only for customers (vendors use /vendor/register) */}
        <Route
          path="/signup"
          element={
            user ? (
              user.role === 'vendor' && user.vendor_id ? (
                <Navigate to="/vendor/dashboard" />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <Navigate to="/user/dashboard" />
              )
            ) : (
              <Signup setUser={setUser} />
            )
          }
        />

        {/* ================================================================ */}
        {/* PUBLIC ROUTES - Accessible to all */}
        {/* ================================================================ */}

        {/* Home page - Product browsing (accessible to all) */}
        <Route
          path="/home"
          element={
            !authChecked ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Checking authentication...</div>
            ) : (
              <Home user={user} setUser={setUser} />
            )
          }
        />

        {/* Product Details page - View product info */}
        <Route path="/product/:id" element={<ProductDetails user={user} />} />

        {/* ================================================================ */}
        {/* CUSTOMER-ONLY ROUTES - Shopping features blocked for vendors */}
        {/* ================================================================ */}

        {/* Upload page for try-on - Customer only */}
        <Route 
          path="/upload/:occasionId" 
          element={
            <CustomerOnlyRoute user={user} authChecked={authChecked}>
              <Upload />
            </CustomerOnlyRoute>
          } 
        />

        {/* Recommendations page */}
        <Route 
          path="/recommendations/:occasionId" 
          element={
            <CustomerOnlyRoute user={user} authChecked={authChecked}>
              <Recommendations user={user} />
            </CustomerOnlyRoute>
          } 
        />

        {/* Cart page - Customer only */}
        <Route 
          path="/cart" 
          element={
            <CustomerOnlyRoute user={user} authChecked={authChecked}>
              <Cart user={user} />
            </CustomerOnlyRoute>
          } 
        />

        {/* Checkout page - Customer only */}
        <Route 
          path="/checkout" 
          element={
            <CustomerOnlyRoute user={user} authChecked={authChecked}>
              <Checkout user={user} />
            </CustomerOnlyRoute>
          } 
        />

        {/* ================================================================ */}
        {/* USER DASHBOARD - Customers only (vendors cannot access) */}
        {/* ================================================================ */}
        <Route 
          path="/user/dashboard" 
          element={
            <UserOnlyRoute user={user} authChecked={authChecked}>
              <UserDashboard user={user} setUser={setUser} />
            </UserOnlyRoute>
          } 
        />

        {/* ================================================================ */}
        {/* VENDOR ROUTES - Vendors only (customers cannot access) */}
        {/* ================================================================ */}

        {/* Vendor Registration */}
        <Route path="/vendor/register" element={<VendorRegister setUser={setUser} />} />

        {/* Upgrade to Vendor - For existing customers */}
        <Route 
          path="/vendor/upgrade" 
          element={<UpgradeToVendor user={user} setUser={setUser} />} 
        />

        {/* Vendor Dashboard - Vendors only */}
        <Route 
          path="/vendor/dashboard" 
          element={
            <VendorOnlyRoute user={user} authChecked={authChecked}>
              <VendorDashboard user={user} setUser={setUser} />
            </VendorOnlyRoute>
          } 
        />

        {/* ================================================================ */}
        {/* ADMIN ROUTES - Admins only */}
        {/* ================================================================ */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminOnlyRoute user={user} authChecked={authChecked}>
              <AdminDashboard user={user} setUser={setUser} />
            </AdminOnlyRoute>
          } 
        />
        
        {/* Alternative admin route */}
        <Route 
          path="/admin" 
          element={
            <AdminOnlyRoute user={user} authChecked={authChecked}>
              <AdminDashboard user={user} setUser={setUser} />
            </AdminOnlyRoute>
          } 
        />

        {/* ================================================================ */}
        {/* OTHER ROUTES */}
        {/* ================================================================ */}

        {/* Order Confirmation page */}
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

        {/* Default route: redirect '/' and any unmatched route to Home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
