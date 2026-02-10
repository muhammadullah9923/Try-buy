# accounts/decorators.py
"""
Role-based access control decorators for API endpoints.
These decorators ensure strict separation between User and Vendor roles.
"""

from functools import wraps
from django.http import JsonResponse
from accounts.models import UserProfile


def get_user_role(user):
    """Get the role of a user from their profile"""
    if not user or not user.is_authenticated:
        return None
    profile = getattr(user, 'profile', None)
    if profile is None:
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            return 'customer'
    return profile.role if profile else 'customer'


def customer_only(view_func):
    """
    Decorator that restricts access to customers only.
    Vendors are blocked from customer-specific endpoints like:
    - Add to cart
    - Checkout
    - Virtual try-on
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "success": False, 
                "message": "Authentication required",
                "error_code": "AUTH_REQUIRED"
            }, status=401)
        
        role = get_user_role(request.user)
        if role == 'vendor':
            return JsonResponse({
                "success": False, 
                "message": "Vendors cannot access shopping features. Please use your vendor dashboard.",
                "error_code": "VENDOR_ACCESS_DENIED"
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def vendor_only(view_func):
    """
    Decorator that restricts access to vendors only.
    Customers are blocked from vendor-specific endpoints like:
    - Product management
    - Stock management
    - Sales analytics
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "success": False, 
                "message": "Authentication required",
                "error_code": "AUTH_REQUIRED"
            }, status=401)
        
        role = get_user_role(request.user)
        if role != 'vendor':
            return JsonResponse({
                "success": False, 
                "message": "Only vendors can access this feature.",
                "error_code": "CUSTOMER_ACCESS_DENIED"
            }, status=403)
        
        # Also verify the user has a vendor profile
        if not hasattr(request.user, 'vendor_profile') or request.user.vendor_profile is None:
            return JsonResponse({
                "success": False, 
                "message": "Vendor profile not found. Please complete vendor registration.",
                "error_code": "VENDOR_PROFILE_MISSING"
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_only(view_func):
    """
    Decorator that restricts access to admins only.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "success": False, 
                "message": "Authentication required",
                "error_code": "AUTH_REQUIRED"
            }, status=401)
        
        role = get_user_role(request.user)
        if role != 'admin':
            return JsonResponse({
                "success": False, 
                "message": "Admin access required.",
                "error_code": "ADMIN_ACCESS_DENIED"
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def authenticated_only(view_func):
    """
    Decorator that just requires authentication without role check.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "success": False, 
                "message": "Authentication required",
                "error_code": "AUTH_REQUIRED"
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def vendor_owns_resource(view_func):
    """
    Decorator that verifies the vendor owns the resource being accessed.
    Used with vendor_id parameter to ensure vendors can only access their own data.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "success": False, 
                "message": "Authentication required",
                "error_code": "AUTH_REQUIRED"
            }, status=401)
        
        role = get_user_role(request.user)
        if role != 'vendor':
            return JsonResponse({
                "success": False, 
                "message": "Only vendors can access this feature.",
                "error_code": "CUSTOMER_ACCESS_DENIED"
            }, status=403)
        
        vendor_profile = getattr(request.user, 'vendor_profile', None)
        if not vendor_profile:
            return JsonResponse({
                "success": False, 
                "message": "Vendor profile not found.",
                "error_code": "VENDOR_PROFILE_MISSING"
            }, status=403)
        
        # Check if vendor_id in URL matches the logged-in vendor
        vendor_id = kwargs.get('vendor_id')
        if vendor_id and int(vendor_id) != vendor_profile.id:
            return JsonResponse({
                "success": False, 
                "message": "You can only access your own vendor data.",
                "error_code": "VENDOR_OWNERSHIP_DENIED"
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    return wrapper
