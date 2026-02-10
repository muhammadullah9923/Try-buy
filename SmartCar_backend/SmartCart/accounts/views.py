
import json
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from store.models import Vendor
from .models import UserProfile, AuthToken
import hashlib

@csrf_exempt
def register_vendor(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)

    data = _parse_post(request)
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    phone = data.get("phone", "")
    address = data.get("address", "")
    description = data.get("description", "")

    if not all([username, email, password, name]):
        return JsonResponse({"success": False, "message": "All fields are required."}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"success": False, "message": "Username already exists."}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"success": False, "message": "Email already in use."}, status=400)

    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError
    try:
        validate_password(password)
    except ValidationError as e:
        return JsonResponse({"success": False, "message": " ".join(e.messages)}, status=400)

    # Create user and vendor
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, role="vendor")
    vendor = Vendor.objects.create(
        user=user, 
        name=name, 
        email=email, 
        phone=phone, 
        address=address,
        description=description
    )
    
    # Auto-login the newly registered vendor
    login(request, user)
    
    # Create auth token for the new vendor
    token, _ = AuthToken.objects.get_or_create(user=user)
    
    # Generate Gravatar URL
    profile_image = None
    email_lower = (email or '').strip().lower()
    if email_lower:
        h = hashlib.md5(email_lower.encode('utf-8')).hexdigest()
        profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
    
    return JsonResponse({
        "success": True, 
        "message": "Vendor registration successful!",
        "auto_login": True,
        "username": username,
        "token": token.key,
        "role": "vendor",
        "vendor_id": vendor.id,
        "profile_image": profile_image
    }, status=201)


@csrf_exempt
def upgrade_to_vendor(request):
    """Upgrade an existing customer account to vendor"""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Authentication required"}, status=401)
    
    # Check if already a vendor
    if hasattr(request.user, 'vendor_profile'):
        return JsonResponse({"success": False, "message": "You are already a vendor"}, status=400)
    
    data = _parse_post(request)
    name = data.get("name")
    phone = data.get("phone", "")
    address = data.get("address", "")
    description = data.get("description", "")
    
    if not name:
        return JsonResponse({"success": False, "message": "Store name is required"}, status=400)
    
    try:
        # Update user profile to vendor role
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        profile.role = "vendor"
        profile.save()
        
        # Create vendor profile
        vendor = Vendor.objects.create(
            user=request.user,
            name=name,
            email=request.user.email,
            phone=phone,
            address=address,
            description=description
        )
        
        return JsonResponse({
            "success": True, 
            "message": "Successfully upgraded to vendor!",
            "vendor_id": vendor.id
        }, status=201)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)
# accounts/views.py
import json

from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import logout
from .models import AuthToken
import hashlib


@csrf_exempt
def current_user(request):
    # Returns the current user info for client-side auth checks
    is_auth = request.user.is_authenticated
    profile_image = None
    role = None
    vendor_id = None
    if is_auth:
        # provide a Gravatar based on user's email if present
        email = (request.user.email or '').strip().lower()
        if email:
            h = hashlib.md5(email.encode('utf-8')).hexdigest()
            profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            profile = UserProfile.objects.create(user=request.user, role="customer")
        if profile:
            role = profile.role
            if role == "vendor":
                vendor = getattr(request.user, 'vendor_profile', None)
                if vendor:
                    vendor_id = vendor.id
    return JsonResponse({
        "is_authenticated": is_auth,
        "username": request.user.username if is_auth else None,
        "profile_image": profile_image,
        "role": role,
        "vendor_id": vendor_id
    })


@csrf_exempt
def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)
    logout(request)
    return JsonResponse({"success": True, "message": "Logged out"})


def _parse_post(request):
    """Parse POST payload from JSON or form-encoded body."""
    if request.content_type and "application/json" in request.content_type:
        try:
            return json.loads(request.body.decode("utf-8"))
        except Exception:
            return {}
    # fallback to form-encoded data (handles multipart/form-data and application/x-www-form-urlencoded)
    return request.POST


# ------------------------
# Signup
# Frontend provides: `username`, `password`
# ------------------------
@csrf_exempt
def signup_view(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)

    data = _parse_post(request)
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    confirm = data.get("confirmPassword") or data.get("confirm_password") or data.get("password2")



    if not all([username, email, password, confirm]):
        print('Missing fields:', username, email, password, confirm)
        return JsonResponse({"success": False, "message": "username, email, password and confirmPassword are required."}, status=400)

    if password != confirm:
        print('Passwords do not match')
        return JsonResponse({"success": False, "message": "Passwords do not match."}, status=400)

    if User.objects.filter(username=username).exists():
        print('Username already exists:', username)
        return JsonResponse({"success": False, "message": "Username already exists."}, status=400)

    if User.objects.filter(email=email).exists():
        print('Email already in use:', email)
        return JsonResponse({"success": False, "message": "Email already in use."}, status=400)

    # Validate password using Django's validators
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError

    try:
        validate_password(password)
    except ValidationError as e:
        print('Password validation error:', e.messages)
        # join all validation messages
        return JsonResponse({"success": False, "message": " ".join(e.messages)}, status=400)

    # Create user. Using create_user to ensure password is hashed.
    user = User.objects.create_user(username=username, email=email, password=password)
    
    # Create customer profile for the user
    UserProfile.objects.create(user=user, role="customer")
    
    # Auto-login the newly registered customer
    login(request, user)
    
    # Create auth token for the new customer
    token, _ = AuthToken.objects.get_or_create(user=user)
    
    # Generate Gravatar URL
    profile_image = None
    email_lower = (email or '').strip().lower()
    if email_lower:
        h = hashlib.md5(email_lower.encode('utf-8')).hexdigest()
        profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
    
    return JsonResponse({
        "success": True, 
        "message": "Signup successful!",
        "auto_login": True,
        "username": username,
        "token": token.key,
        "role": "customer",
        "profile_image": profile_image
    }, status=201)


# ------------------------
# Login
# Frontend provides: `username`, `password`
# ------------------------
@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)

    data = _parse_post(request)
    username = data.get("username")
    password = data.get("password")
    login_as = data.get("login_as")  # 'user' or 'vendor' - for role-specific login

    if not username or not password:
        return JsonResponse({"success": False, "message": "Both username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        # Get user role
        role = "customer"
        vendor_id = None
        profile = getattr(user, 'profile', None)
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'customer'})
        if profile:
            role = profile.role
            if role == "vendor":
                vendor = getattr(user, 'vendor_profile', None)
                if vendor:
                    vendor_id = vendor.id
        
        # Role-based access validation
        if login_as == 'user':
            # User login portal - only customers and admins allowed
            if role == 'vendor':
                return JsonResponse({
                    "success": False, 
                    "message": "You are registered as a Vendor. Please use the Vendor login portal.",
                    "error_code": "WRONG_LOGIN_PORTAL"
                }, status=403)
        elif login_as == 'vendor':
            # Vendor login portal - only vendors allowed
            if role != 'vendor':
                return JsonResponse({
                    "success": False, 
                    "message": "You are not authorized to log in as a Vendor. Please use the User login portal.",
                    "error_code": "WRONG_LOGIN_PORTAL"
                }, status=403)
        
        login(request, user)  # sets session cookie
        # create or reuse auth token
        token, _ = AuthToken.objects.get_or_create(user=user)
        
        # Generate Gravatar URL
        profile_image = None
        email = (user.email or '').strip().lower()
        if email:
            h = hashlib.md5(email.encode('utf-8')).hexdigest()
            profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
        
        return JsonResponse({
            "success": True, 
            "message": "Login successful!", 
            "username": user.username, 
            "token": token.key,
            "role": role,
            "vendor_id": vendor_id,
            "profile_image": profile_image
        })

    return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)


# Separate login endpoint for users only
@csrf_exempt
def login_user_view(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)

    data = _parse_post(request)
    
    # Get credentials from the data
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"success": False, "message": "Both username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        # Get user role
        role = "customer"
        vendor_id = None
        profile = getattr(user, 'profile', None)
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'customer'})
        if profile:
            role = profile.role
            if role == "vendor":
                vendor = getattr(user, 'vendor_profile', None)
                if vendor:
                    vendor_id = vendor.id
        
        # Only allow customers and admins through user login
        if role == 'vendor':
            return JsonResponse({
                "success": False, 
                "message": "You are registered as a Vendor. Please use the Vendor login portal.",
                "error_code": "WRONG_LOGIN_PORTAL"
            }, status=403)
        
        login(request, user)
        token, _ = AuthToken.objects.get_or_create(user=user)
        
        # Generate Gravatar URL
        profile_image = None
        email = (user.email or '').strip().lower()
        if email:
            h = hashlib.md5(email.encode('utf-8')).hexdigest()
            profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
        
        return JsonResponse({
            "success": True, 
            "message": "Login successful!", 
            "username": user.username, 
            "token": token.key,
            "role": role,
            "vendor_id": vendor_id,
            "profile_image": profile_image
        })

    return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)


# Separate login endpoint for vendors only
@csrf_exempt
def login_vendor_view(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)

    data = _parse_post(request)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"success": False, "message": "Both username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        # Get user role
        role = "customer"
        vendor_id = None
        profile = getattr(user, 'profile', None)
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'customer'})
        if profile:
            role = profile.role
            if role == "vendor":
                vendor = getattr(user, 'vendor_profile', None)
                if vendor:
                    vendor_id = vendor.id
        
        # Only allow vendors through vendor login
        if role != 'vendor':
            return JsonResponse({
                "success": False, 
                "message": "You are not authorized to log in as a Vendor. Please use the User login portal.",
                "error_code": "WRONG_LOGIN_PORTAL"
            }, status=403)
        
        login(request, user)
        token, _ = AuthToken.objects.get_or_create(user=user)
        
        # Generate Gravatar URL
        profile_image = None
        email = (user.email or '').strip().lower()
        if email:
            h = hashlib.md5(email.encode('utf-8')).hexdigest()
            profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
        
        return JsonResponse({
            "success": True, 
            "message": "Login successful!", 
            "username": user.username, 
            "token": token.key,
            "role": role,
            "vendor_id": vendor_id,
            "profile_image": profile_image
        })

    return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)


# Separate login endpoint for admin only
@csrf_exempt
def login_admin_view(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid request method"}, status=405)

    data = _parse_post(request)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse({"success": False, "message": "Both username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        # Get user role
        role = "customer"
        profile = getattr(user, 'profile', None)
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'customer'})
        if profile:
            role = profile.role
        
        # Only allow admins through admin login
        if role != 'admin':
            return JsonResponse({
                "success": False, 
                "message": "Admin access denied. You do not have administrator privileges.",
                "error_code": "ADMIN_ACCESS_DENIED"
            }, status=403)
        
        login(request, user)
        token, _ = AuthToken.objects.get_or_create(user=user)
        
        # Generate Gravatar URL
        profile_image = None
        email = (user.email or '').strip().lower()
        if email:
            h = hashlib.md5(email.encode('utf-8')).hexdigest()
            profile_image = f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
        
        return JsonResponse({
            "success": True, 
            "message": "Admin login successful!", 
            "username": user.username, 
            "token": token.key,
            "role": role,
            "profile_image": profile_image
        })

    return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)



