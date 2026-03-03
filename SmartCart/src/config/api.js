// API Configuration for SmartCart
// In production, set VITE_API_URL environment variable to your deployed backend URL

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://3.226.254.81:8080';

export const API_URL = API_BASE_URL;

export const API_ENDPOINTS = {
  // Auth endpoints
  login: `${API_BASE_URL}/accounts/login/`,
  adminLogin: `${API_BASE_URL}/accounts/login/admin/`,
  vendorLogin: `${API_BASE_URL}/accounts/login/vendor/`,
  userLogin: `${API_BASE_URL}/accounts/login/user/`,
  signup: `${API_BASE_URL}/accounts/signup/`,
  logout: `${API_BASE_URL}/accounts/logout/`,
  currentUser: `${API_BASE_URL}/accounts/current-user/`,
  registerVendor: `${API_BASE_URL}/accounts/register_vendor/`,
  upgradeToVendor: `${API_BASE_URL}/accounts/upgrade_to_vendor/`,
  
  // Store endpoints
  products: `${API_BASE_URL}/api/products/`,
  cart: `${API_BASE_URL}/api/cart/`,
  cartAdd: `${API_BASE_URL}/api/cart/add/`,
  cartUpdate: `${API_BASE_URL}/api/cart/update/`,
  cartRemove: `${API_BASE_URL}/api/cart/remove/`,
  orders: `${API_BASE_URL}/api/orders/`,
  categories: `${API_BASE_URL}/api/categories/`,
  occasions: `${API_BASE_URL}/api/occasions/`,
  recommendations: (id) => `${API_BASE_URL}/api/recommendations/${id}/`,
  
  // User endpoints
  userProfile: `${API_BASE_URL}/api/user/profile/`,
  userProfileUpdate: `${API_BASE_URL}/api/user/profile/update/`,
  userOrders: `${API_BASE_URL}/api/user/orders/`,
  
  // Stripe endpoints
  stripeConfig: `${API_BASE_URL}/api/stripe/config/`,
  stripeCreatePayment: `${API_BASE_URL}/api/stripe/create-payment-intent/`,
  stripeConfirmPayment: `${API_BASE_URL}/api/stripe/confirm-payment/`,
  
  // Vendor endpoints
  vendorProfile: (id) => `${API_BASE_URL}/api/vendor/${id}/profile/`,
  vendorStats: (id) => `${API_BASE_URL}/api/vendor/${id}/stats/`,
  vendorProducts: (id) => `${API_BASE_URL}/api/vendor/${id}/products/`,
  vendorOrders: (id) => `${API_BASE_URL}/api/vendor/${id}/orders/`,
  vendorEarnings: (id, period) => `${API_BASE_URL}/api/vendor/${id}/earnings/?period=${period}`,
  vendorPayouts: (id) => `${API_BASE_URL}/api/vendor/${id}/payouts/`,
  vendorAddProduct: `${API_BASE_URL}/api/vendor/add_product/`,
  vendorEditProduct: (id) => `${API_BASE_URL}/api/vendor/edit_product/${id}/`,
  vendorUpdateProfile: (id) => `${API_BASE_URL}/api/vendor/${id}/update_profile/`,
  vendorOrderUpdateStatus: `${API_BASE_URL}/api/vendor/order/update_status/`,
  
  // Admin endpoints
  adminReport: `${API_BASE_URL}/api/admin/report/`,
  
  // Virtual Try-on
  virtualTryon: `${API_BASE_URL}/api/virtual-tryon/`,
};

// Helper to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

export default API_BASE_URL;
