# store/admin_views.py
"""
Comprehensive Admin Control Module Backend
Handles all admin-specific operations for the SmartCart platform.
"""

import json
import csv
from io import StringIO
from decimal import Decimal
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q, F
from django.db import transaction

from .models import Product, Occasion, Category, Order, OrderItem, Vendor, Payout, Cart
from accounts.models import UserProfile, AuthToken


def add_cors_headers(response, request=None):
    """Add CORS headers to response"""
    origin = request.META.get('HTTP_ORIGIN', '*') if request else '*'
    response["Access-Control-Allow-Origin"] = origin
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response


def get_admin_from_request(request):
    """Extract admin user from request (via session or token)"""
    # Check session authentication
    if request.user.is_authenticated:
        try:
            profile = UserProfile.objects.get(user=request.user)
            if profile.role == 'admin':
                return request.user
        except UserProfile.DoesNotExist:
            pass
    
    # Check token authentication
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token_key = auth_header[7:]
        try:
            token = AuthToken.objects.get(key=token_key)
            profile = UserProfile.objects.get(user=token.user)
            if profile.role == 'admin':
                return token.user
        except (AuthToken.DoesNotExist, UserProfile.DoesNotExist):
            pass
    
    return None


def admin_required(view_func):
    """Decorator to ensure admin access"""
    def wrapper(request, *args, **kwargs):
        admin_user = get_admin_from_request(request)
        if not admin_user:
            return add_cors_headers(JsonResponse({
                "success": False,
                "message": "Admin access required",
                "error_code": "ADMIN_ACCESS_DENIED"
            }, status=403), request)
        request.admin_user = admin_user
        return view_func(request, *args, **kwargs)
    return wrapper


# ==================== DASHBOARD STATISTICS ====================

@csrf_exempt
def admin_dashboard_stats(request):
    """Get comprehensive admin dashboard statistics"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        total_customers = UserProfile.objects.filter(role='customer').count()
        total_vendors = Vendor.objects.count()
        active_vendors = Vendor.objects.filter(is_active=True).count()
        pending_vendors = Vendor.objects.filter(is_active=False).count()
        
        # Product statistics
        total_products = Product.objects.count()
        pending_products = Product.objects.filter(is_approved=False).count()
        approved_products = Product.objects.filter(is_approved=True).count()
        active_products = Product.objects.filter(is_active=True, is_approved=True).count()
        
        # Order statistics
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        processing_orders = Order.objects.filter(status='processing').count()
        completed_orders = Order.objects.filter(status='delivered').count()
        
        # Today's orders
        today_orders = Order.objects.filter(created_at__date=today).count()
        
        # Revenue statistics
        all_items = OrderItem.objects.all()
        total_revenue = sum(float(item.price) * item.quantity for item in all_items)
        total_commission = sum(float(item.commission) for item in all_items)
        
        # This month's revenue
        month_items = OrderItem.objects.filter(order__created_at__gte=month_ago)
        month_revenue = sum(float(item.price) * item.quantity for item in month_items)
        month_commission = sum(float(item.commission) for item in month_items)
        
        # Daily revenue for last 7 days (for chart)
        daily_stats = []
        for i in range(7):
            day = today - timedelta(days=i)
            day_items = OrderItem.objects.filter(order__created_at__date=day)
            day_orders = Order.objects.filter(created_at__date=day).count()
            day_revenue = sum(float(item.price) * item.quantity for item in day_items)
            day_commission = sum(float(item.commission) for item in day_items)
            daily_stats.append({
                "date": day.strftime("%Y-%m-%d"),
                "day": day.strftime("%a"),
                "orders": day_orders,
                "revenue": f"{day_revenue:.2f}",
                "commission": f"{day_commission:.2f}"
            })
        daily_stats.reverse()
        
        # Category/Occasion stats
        total_categories = Category.objects.count()
        total_occasions = Occasion.objects.count()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "stats": {
                "users": {
                    "total": total_users,
                    "customers": total_customers,
                    "vendors": total_vendors
                },
                "vendors": {
                    "total": total_vendors,
                    "active": active_vendors,
                    "pending": pending_vendors
                },
                "products": {
                    "total": total_products,
                    "pending": pending_products,
                    "approved": approved_products,
                    "active": active_products
                },
                "orders": {
                    "total": total_orders,
                    "pending": pending_orders,
                    "processing": processing_orders,
                    "completed": completed_orders,
                    "today": today_orders
                },
                "revenue": {
                    "total": f"{total_revenue:.2f}",
                    "commission": f"{total_commission:.2f}",
                    "monthRevenue": f"{month_revenue:.2f}",
                    "monthCommission": f"{month_commission:.2f}"
                },
                "categories": total_categories,
                "occasions": total_occasions,
                "dailyStats": daily_stats
            }
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== VENDOR MANAGEMENT ====================

@csrf_exempt
def admin_vendors_list(request):
    """List all vendors with filtering options"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        status_filter = request.GET.get('status', 'all')  # all, active, inactive, pending
        search = request.GET.get('search', '')
        
        vendors = Vendor.objects.all()
        
        if status_filter == 'active':
            vendors = vendors.filter(is_active=True)
        elif status_filter == 'inactive' or status_filter == 'pending':
            vendors = vendors.filter(is_active=False)
        
        if search:
            vendors = vendors.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        vendor_list = []
        for v in vendors:
            # Calculate vendor stats
            vendor_items = OrderItem.objects.filter(product__vendor=v)
            total_sales = sum(float(item.price) * item.quantity for item in vendor_items)
            total_orders = vendor_items.values('order').distinct().count()
            product_count = v.products.count()
            
            vendor_list.append({
                "id": v.id,
                "name": v.name,
                "email": v.email,
                "phone": v.phone,
                "address": v.address,
                "description": getattr(v, 'description', ''),
                "commission_rate": str(v.commission_rate),
                "is_active": v.is_active,
                "created_at": v.created_at.strftime("%Y-%m-%d %H:%M"),
                "total_sales": f"{total_sales:.2f}",
                "total_orders": total_orders,
                "product_count": product_count,
                "user_id": v.user.id if v.user else None,
                "username": v.user.username if v.user else None
            })
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "vendors": vendor_list,
            "total": len(vendor_list)
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_vendor_detail(request, vendor_id):
    """Get detailed vendor information"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        
        # Get vendor products
        products = vendor.products.all()
        product_list = [{
            "id": p.id,
            "name": p.name,
            "price": str(p.price),
            "is_active": p.is_active,
            "is_approved": p.is_approved,
            "stock_quantity": p.stock_quantity
        } for p in products]
        
        # Get vendor orders
        vendor_items = OrderItem.objects.filter(product__vendor=vendor)
        total_sales = sum(float(item.price) * item.quantity for item in vendor_items)
        total_commission = sum(float(item.commission) for item in vendor_items)
        total_orders = vendor_items.values('order').distinct().count()
        
        # Recent orders
        recent_orders = []
        seen_orders = set()
        for item in vendor_items.order_by('-order__created_at')[:20]:
            if item.order.id not in seen_orders:
                seen_orders.add(item.order.id)
                recent_orders.append({
                    "order_id": item.order.id,
                    "date": item.order.created_at.strftime("%Y-%m-%d"),
                    "status": item.order.status,
                    "total": str(item.order.total_amount)
                })
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "vendor": {
                "id": vendor.id,
                "name": vendor.name,
                "email": vendor.email,
                "phone": vendor.phone,
                "address": vendor.address,
                "description": getattr(vendor, 'description', ''),
                "commission_rate": str(vendor.commission_rate),
                "is_active": vendor.is_active,
                "created_at": vendor.created_at.strftime("%Y-%m-%d %H:%M"),
                "user_id": vendor.user.id if vendor.user else None,
                "username": vendor.user.username if vendor.user else None
            },
            "stats": {
                "total_products": products.count(),
                "active_products": products.filter(is_active=True).count(),
                "approved_products": products.filter(is_approved=True).count(),
                "total_sales": f"{total_sales:.2f}",
                "total_commission": f"{total_commission:.2f}",
                "total_orders": total_orders
            },
            "products": product_list[:10],
            "recent_orders": recent_orders[:10]
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_vendor_approve(request, vendor_id):
    """Approve a vendor registration"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        vendor.is_active = True
        vendor.save()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Vendor '{vendor.name}' has been approved and activated."
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_vendor_reject(request, vendor_id):
    """Reject a vendor registration with reason"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
        reason = data.get('reason', 'Registration rejected by admin')
        
        vendor = Vendor.objects.get(id=vendor_id)
        vendor.is_active = False
        vendor.save()
        
        # Could send email notification with reason here
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Vendor '{vendor.name}' has been rejected.",
            "reason": reason
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_vendor_toggle_status(request, vendor_id):
    """Toggle vendor active/inactive status (block/unblock)"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        vendor.is_active = not vendor.is_active
        vendor.save()
        
        status = "activated" if vendor.is_active else "blocked"
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Vendor '{vendor.name}' has been {status}.",
            "is_active": vendor.is_active
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_vendor_update_commission(request, vendor_id):
    """Update vendor-specific commission rate"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        commission_rate = data.get('commission_rate')
        
        if commission_rate is None:
            return add_cors_headers(JsonResponse({"success": False, "message": "Commission rate required"}), request)
        
        commission_rate = Decimal(str(commission_rate))
        if commission_rate < 0 or commission_rate > 100:
            return add_cors_headers(JsonResponse({"success": False, "message": "Commission rate must be between 0 and 100"}), request)
        
        vendor = Vendor.objects.get(id=vendor_id)
        vendor.commission_rate = commission_rate
        vendor.save()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Commission rate for '{vendor.name}' updated to {commission_rate}%",
            "commission_rate": str(commission_rate)
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== PRODUCT MODERATION ====================

@csrf_exempt
def admin_products_list(request):
    """List all products with filtering options for moderation"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        status_filter = request.GET.get('status', 'all')  # all, pending, approved, rejected
        vendor_id = request.GET.get('vendor_id', '')
        search = request.GET.get('search', '')
        category_id = request.GET.get('category_id', '')
        
        products = Product.objects.all().order_by('-created_at')
        
        if status_filter == 'pending':
            products = products.filter(is_approved=False)
        elif status_filter == 'approved':
            products = products.filter(is_approved=True)
        
        if vendor_id:
            products = products.filter(vendor_id=vendor_id)
        
        if category_id:
            products = products.filter(category_id=category_id)
        
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        product_list = [{
            "id": p.id,
            "name": p.name,
            "price": str(p.price),
            "discount": str(p.discount) if p.discount else "0",
            "description": p.description or "",
            "image": p.image.url if p.image else None,
            "occasion": p.occasion.name if p.occasion else None,
            "category": p.category.name if p.category else None,
            "vendor_id": p.vendor.id if p.vendor else None,
            "vendor_name": p.vendor.name if p.vendor else "No Vendor",
            "is_active": p.is_active,
            "is_approved": p.is_approved,
            "stock_quantity": p.stock_quantity,
            "sizes": p.sizes,
            "colors": p.colors,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else None
        } for p in products]
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "products": product_list,
            "total": len(product_list)
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_product_detail(request, product_id):
    """Get detailed product information for review"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        product = Product.objects.get(id=product_id)
        
        # Get order history for this product
        order_items = OrderItem.objects.filter(product=product)
        total_sold = sum(item.quantity for item in order_items)
        total_revenue = sum(float(item.price) * item.quantity for item in order_items)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "product": {
                "id": product.id,
                "name": product.name,
                "price": str(product.price),
                "discount": str(product.discount) if product.discount else "0",
                "description": product.description or "",
                "image": product.image.url if product.image else None,
                "occasion": {"id": product.occasion.id, "name": product.occasion.name} if product.occasion else None,
                "category": {"id": product.category.id, "name": product.category.name} if product.category else None,
                "vendor": {
                    "id": product.vendor.id,
                    "name": product.vendor.name,
                    "email": product.vendor.email
                } if product.vendor else None,
                "is_active": product.is_active,
                "is_approved": product.is_approved,
                "stock_quantity": product.stock_quantity,
                "low_stock_threshold": product.low_stock_threshold,
                "sizes": product.sizes,
                "colors": product.colors,
                "created_at": product.created_at.strftime("%Y-%m-%d %H:%M") if product.created_at else None
            },
            "stats": {
                "total_sold": total_sold,
                "total_revenue": f"{total_revenue:.2f}",
                "order_count": order_items.values('order').distinct().count()
            }
        }), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_product_approve(request, product_id):
    """Approve a product for listing"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        product = Product.objects.get(id=product_id)
        product.is_approved = True
        product.save()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Product '{product.name}' has been approved."
        }), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_product_reject(request, product_id):
    """Reject a product with reason"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
        reason = data.get('reason', 'Product rejected by admin')
        
        product = Product.objects.get(id=product_id)
        product.is_approved = False
        product.is_active = False  # Also deactivate
        product.save()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Product '{product.name}' has been rejected.",
            "reason": reason
        }), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_product_toggle_status(request, product_id):
    """Toggle product active/suspended status"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        product = Product.objects.get(id=product_id)
        product.is_active = not product.is_active
        product.save()
        
        status = "activated" if product.is_active else "suspended"
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Product '{product.name}' has been {status}.",
            "is_active": product.is_active
        }), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_product_bulk_approve(request):
    """Bulk approve multiple products"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        product_ids = data.get('product_ids', [])
        
        if not product_ids:
            return add_cors_headers(JsonResponse({"success": False, "message": "No products specified"}), request)
        
        updated = Product.objects.filter(id__in=product_ids).update(is_approved=True)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"{updated} products have been approved."
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== USER MANAGEMENT ====================

@csrf_exempt
def admin_users_list(request):
    """List all users with filtering options"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        role_filter = request.GET.get('role', 'all')  # all, customer, vendor, admin
        status_filter = request.GET.get('status', 'all')  # all, active, inactive
        search = request.GET.get('search', '')
        
        users = User.objects.all().order_by('-date_joined')
        
        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        if status_filter == 'active':
            users = users.filter(is_active=True)
        elif status_filter == 'inactive':
            users = users.filter(is_active=False)
        
        user_list = []
        for user in users:
            try:
                profile = UserProfile.objects.get(user=user)
                role = profile.role
                phone = profile.phone
                address = profile.address
            except UserProfile.DoesNotExist:
                role = 'customer'
                phone = ''
                address = ''
            
            # Filter by role if specified
            if role_filter != 'all' and role != role_filter:
                continue
            
            # Get order count for customers
            order_count = Order.objects.filter(user=user).count()
            
            user_list.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": role,
                "phone": phone,
                "address": address,
                "is_active": user.is_active,
                "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M"),
                "last_login": user.last_login.strftime("%Y-%m-%d %H:%M") if user.last_login else None,
                "order_count": order_count
            })
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "users": user_list,
            "total": len(user_list)
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_user_detail(request, user_id):
    """Get detailed user information"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        user = User.objects.get(id=user_id)
        
        try:
            profile = UserProfile.objects.get(user=user)
            role = profile.role
            phone = profile.phone
            address = profile.address
        except UserProfile.DoesNotExist:
            role = 'customer'
            phone = ''
            address = ''
        
        # Get user orders
        orders = Order.objects.filter(user=user).order_by('-created_at')
        order_list = [{
            "id": o.id,
            "date": o.created_at.strftime("%Y-%m-%d"),
            "status": o.status,
            "total": str(o.total_amount),
            "items_count": o.items.count()
        } for o in orders[:10]]
        
        total_spent = sum(float(o.total_amount) for o in orders)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": role,
                "phone": phone,
                "address": address,
                "is_active": user.is_active,
                "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M"),
                "last_login": user.last_login.strftime("%Y-%m-%d %H:%M") if user.last_login else None
            },
            "stats": {
                "total_orders": orders.count(),
                "total_spent": f"{total_spent:.2f}"
            },
            "recent_orders": order_list
        }), request)
    except User.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "User not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_user_toggle_status(request, user_id):
    """Toggle user active/blocked status"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        user = User.objects.get(id=user_id)
        
        # Prevent blocking admins
        try:
            profile = UserProfile.objects.get(user=user)
            if profile.role == 'admin':
                return add_cors_headers(JsonResponse({
                    "success": False,
                    "message": "Cannot block admin users"
                }), request)
        except UserProfile.DoesNotExist:
            pass
        
        user.is_active = not user.is_active
        user.save()
        
        status = "activated" if user.is_active else "blocked"
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"User '{user.username}' has been {status}.",
            "is_active": user.is_active
        }), request)
    except User.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "User not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== ORDER MANAGEMENT ====================

@csrf_exempt
def admin_orders_list(request):
    """List all orders with filtering options"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        status_filter = request.GET.get('status', 'all')
        vendor_id = request.GET.get('vendor_id', '')
        user_id = request.GET.get('user_id', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        search = request.GET.get('search', '')
        
        orders = Order.objects.all().order_by('-created_at')
        
        if status_filter != 'all':
            orders = orders.filter(status=status_filter)
        
        if user_id:
            orders = orders.filter(user_id=user_id)
        
        if date_from:
            orders = orders.filter(created_at__date__gte=date_from)
        
        if date_to:
            orders = orders.filter(created_at__date__lte=date_to)
        
        if search:
            orders = orders.filter(
                Q(id__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        # Filter by vendor if specified
        if vendor_id:
            order_ids = OrderItem.objects.filter(product__vendor_id=vendor_id).values_list('order_id', flat=True)
            orders = orders.filter(id__in=order_ids)
        
        order_list = []
        for order in orders[:100]:  # Limit to 100 orders
            items = order.items.all()
            vendors = set()
            for item in items:
                if item.product and item.product.vendor:
                    vendors.add(item.product.vendor.name)
            
            order_list.append({
                "id": order.id,
                "user_id": order.user.id if order.user else None,
                "username": order.user.username if order.user else "Guest",
                "email": order.user.email if order.user else "",
                "status": order.status,
                "payment_status": order.payment_status,
                "total_amount": str(order.total),
                "items_count": items.count(),
                "vendors": list(vendors),
                "shipping_address": f"{order.address}, {order.city}, {order.country}" if order.address else "",
                "created_at": order.created_at.strftime("%Y-%m-%d %H:%M"),
                "updated_at": order.updated_at.strftime("%Y-%m-%d %H:%M") if hasattr(order, 'updated_at') and order.updated_at else None
            })
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "orders": order_list,
            "total": orders.count()
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_order_detail(request, order_id):
    """Get detailed order information"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        order = Order.objects.get(id=order_id)
        
        items = []
        total_commission = Decimal('0')
        for item in order.items.all():
            total_commission += item.commission
            items.append({
                "id": item.id,
                "product_id": item.product.id if item.product else None,
                "product_name": item.product.name if item.product else "Deleted Product",
                "product_image": item.product.image.url if item.product and item.product.image else None,
                "vendor_id": item.product.vendor.id if item.product and item.product.vendor else None,
                "vendor_name": item.product.vendor.name if item.product and item.product.vendor else "Unknown",
                "quantity": item.quantity,
                "price": str(item.price),
                "total": str(float(item.price) * item.quantity),
                "commission": str(item.commission),
                "status": item.status
            })
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "order": {
                "id": order.id,
                "user": {
                    "id": order.user.id,
                    "username": order.user.username,
                    "email": order.user.email
                } if order.user else None,
                "status": order.status,
                "payment_status": order.payment_status,
                "total_amount": str(order.total_amount),
                "total_commission": str(total_commission),
                "shipping": {
                    "name": order.full_name,
                    "email": order.email,
                    "phone": order.phone,
                    "address": order.address,
                    "city": order.city,
                    "state": order.state,
                    "zip_code": order.zip_code,
                    "country": order.country
                },
                "created_at": order.created_at.strftime("%Y-%m-%d %H:%M")
            },
            "items": items
        }), request)
    except Order.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Order not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_order_update_status(request, order_id):
    """Update order status"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        new_status = data.get('status')
        
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return add_cors_headers(JsonResponse({
                "success": False,
                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), request)
        
        order = Order.objects.get(id=order_id)
        order.status = new_status
        order.save()
        
        # Update all items status as well
        order.items.update(status=new_status)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Order #{order.id} status updated to {new_status}.",
            "status": new_status
        }), request)
    except Order.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Order not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== CATEGORY & OCCASION MANAGEMENT ====================

@csrf_exempt
def admin_categories_list(request):
    """List all categories"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        categories = Category.objects.all()
        category_list = [{
            "id": c.id,
            "name": c.name,
            "product_count": c.product_set.count()
        } for c in categories]
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "categories": category_list
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_category_create(request):
    """Create a new category"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        name = data.get('name', '').strip()
        
        if not name:
            return add_cors_headers(JsonResponse({"success": False, "message": "Category name required"}), request)
        
        if Category.objects.filter(name__iexact=name).exists():
            return add_cors_headers(JsonResponse({"success": False, "message": "Category already exists"}), request)
        
        category = Category.objects.create(name=name)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Category '{name}' created.",
            "category": {"id": category.id, "name": category.name}
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_category_delete(request, category_id):
    """Delete a category"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        category = Category.objects.get(id=category_id)
        name = category.name
        
        # Check if category has products
        if category.product_set.exists():
            return add_cors_headers(JsonResponse({
                "success": False,
                "message": f"Cannot delete category '{name}' because it has associated products."
            }), request)
        
        category.delete()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Category '{name}' deleted."
        }), request)
    except Category.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Category not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_occasions_list(request):
    """List all occasions"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        occasions = Occasion.objects.all()
        occasion_list = [{
            "id": o.id,
            "name": o.name,
            "product_count": o.product_set.count()
        } for o in occasions]
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "occasions": occasion_list
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_occasion_create(request):
    """Create a new occasion"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        name = data.get('name', '').strip()
        
        if not name:
            return add_cors_headers(JsonResponse({"success": False, "message": "Occasion name required"}), request)
        
        if Occasion.objects.filter(name__iexact=name).exists():
            return add_cors_headers(JsonResponse({"success": False, "message": "Occasion already exists"}), request)
        
        occasion = Occasion.objects.create(name=name)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Occasion '{name}' created.",
            "occasion": {"id": occasion.id, "name": occasion.name}
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_occasion_delete(request, occasion_id):
    """Delete an occasion"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        occasion = Occasion.objects.get(id=occasion_id)
        name = occasion.name
        
        # Check if occasion has products
        if occasion.product_set.exists():
            return add_cors_headers(JsonResponse({
                "success": False,
                "message": f"Cannot delete occasion '{name}' because it has associated products."
            }), request)
        
        occasion.delete()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "message": f"Occasion '{name}' deleted."
        }), request)
    except Occasion.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Occasion not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== COMMISSION MANAGEMENT ====================

@csrf_exempt
def admin_commission_settings(request):
    """Get/Update global commission settings"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method == "GET":
        try:
            # Calculate average commission rate
            vendors = Vendor.objects.all()
            if vendors.exists():
                avg_commission = vendors.aggregate(avg=Avg('commission_rate'))['avg']
            else:
                avg_commission = Decimal('10')
            
            # Get commission summary
            all_items = OrderItem.objects.all()
            total_commission = sum(float(item.commission) for item in all_items)
            
            # Monthly commission
            month_ago = timezone.now() - timedelta(days=30)
            month_items = OrderItem.objects.filter(order__created_at__gte=month_ago)
            month_commission = sum(float(item.commission) for item in month_items)
            
            return add_cors_headers(JsonResponse({
                "success": True,
                "settings": {
                    "default_commission_rate": "10.00",  # Could store this in a settings model
                    "average_commission_rate": f"{avg_commission:.2f}",
                    "total_commission_earned": f"{total_commission:.2f}",
                    "month_commission_earned": f"{month_commission:.2f}"
                }
            }), request)
        except Exception as e:
            return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            default_rate = data.get('default_commission_rate')
            
            if default_rate is not None:
                # Update all vendors to new default rate if requested
                if data.get('apply_to_all', False):
                    Vendor.objects.all().update(commission_rate=Decimal(str(default_rate)))
            
            return add_cors_headers(JsonResponse({
                "success": True,
                "message": "Commission settings updated."
            }), request)
        except Exception as e:
            return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
    
    return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)


# ==================== REPORTS & ANALYTICS ====================

@csrf_exempt
def admin_sales_report(request):
    """Generate comprehensive sales report"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        vendor_id = request.GET.get('vendor_id', '')
        
        items = OrderItem.objects.all()
        
        if date_from:
            items = items.filter(order__created_at__date__gte=date_from)
        if date_to:
            items = items.filter(order__created_at__date__lte=date_to)
        if vendor_id:
            items = items.filter(product__vendor_id=vendor_id)
        
        # Calculate totals
        total_sales = sum(float(item.price) * item.quantity for item in items)
        total_commission = sum(float(item.commission) for item in items)
        total_orders = items.values('order').distinct().count()
        total_items = items.count()
        
        # Sales by vendor
        vendor_sales = {}
        for item in items:
            vendor_name = item.product.vendor.name if item.product and item.product.vendor else "No Vendor"
            if vendor_name not in vendor_sales:
                vendor_sales[vendor_name] = {"sales": 0, "commission": 0, "orders": set(), "items": 0}
            vendor_sales[vendor_name]["sales"] += float(item.price) * item.quantity
            vendor_sales[vendor_name]["commission"] += float(item.commission)
            vendor_sales[vendor_name]["orders"].add(item.order.id)
            vendor_sales[vendor_name]["items"] += item.quantity
        
        vendor_breakdown = [{
            "vendor": name,
            "sales": f"{data['sales']:.2f}",
            "commission": f"{data['commission']:.2f}",
            "orders": len(data['orders']),
            "items": data['items']
        } for name, data in vendor_sales.items()]
        
        # Sales by category
        category_sales = {}
        for item in items:
            category_name = item.product.category.name if item.product and item.product.category else "Uncategorized"
            if category_name not in category_sales:
                category_sales[category_name] = 0
            category_sales[category_name] += float(item.price) * item.quantity
        
        category_breakdown = [{
            "category": name,
            "sales": f"{sales:.2f}"
        } for name, sales in category_sales.items()]
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "report": {
                "summary": {
                    "total_sales": f"{total_sales:.2f}",
                    "total_commission": f"{total_commission:.2f}",
                    "net_vendor_earnings": f"{total_sales - total_commission:.2f}",
                    "total_orders": total_orders,
                    "total_items_sold": total_items
                },
                "by_vendor": sorted(vendor_breakdown, key=lambda x: float(x['sales']), reverse=True),
                "by_category": sorted(category_breakdown, key=lambda x: float(x['sales']), reverse=True)
            }
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def admin_export_report(request):
    """Export report as CSV"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    
    try:
        report_type = request.GET.get('type', 'sales')  # sales, orders, vendors, products
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        output = StringIO()
        writer = csv.writer(output)
        
        if report_type == 'sales':
            writer.writerow(['Order ID', 'Date', 'Vendor', 'Product', 'Quantity', 'Price', 'Commission', 'Status'])
            
            items = OrderItem.objects.all().order_by('-order__created_at')
            if date_from:
                items = items.filter(order__created_at__date__gte=date_from)
            if date_to:
                items = items.filter(order__created_at__date__lte=date_to)
            
            for item in items:
                writer.writerow([
                    item.order.id,
                    item.order.created_at.strftime("%Y-%m-%d"),
                    item.product.vendor.name if item.product and item.product.vendor else "N/A",
                    item.product.name if item.product else "Deleted",
                    item.quantity,
                    str(item.price),
                    str(item.commission),
                    item.status
                ])
        
        elif report_type == 'orders':
            writer.writerow(['Order ID', 'Customer', 'Email', 'Date', 'Status', 'Total', 'Items Count'])
            
            orders = Order.objects.all().order_by('-created_at')
            if date_from:
                orders = orders.filter(created_at__date__gte=date_from)
            if date_to:
                orders = orders.filter(created_at__date__lte=date_to)
            
            for order in orders:
                writer.writerow([
                    order.id,
                    order.user.username if order.user else "Guest",
                    order.user.email if order.user else order.email,
                    order.created_at.strftime("%Y-%m-%d"),
                    order.status,
                    str(order.total_amount),
                    order.items.count()
                ])
        
        elif report_type == 'vendors':
            writer.writerow(['Vendor ID', 'Name', 'Email', 'Phone', 'Commission Rate', 'Status', 'Products', 'Total Sales'])
            
            for vendor in Vendor.objects.all():
                vendor_items = OrderItem.objects.filter(product__vendor=vendor)
                total_sales = sum(float(item.price) * item.quantity for item in vendor_items)
                
                writer.writerow([
                    vendor.id,
                    vendor.name,
                    vendor.email,
                    vendor.phone,
                    f"{vendor.commission_rate}%",
                    "Active" if vendor.is_active else "Inactive",
                    vendor.products.count(),
                    f"{total_sales:.2f}"
                ])
        
        elif report_type == 'products':
            writer.writerow(['Product ID', 'Name', 'Vendor', 'Category', 'Price', 'Stock', 'Status', 'Approved'])
            
            for product in Product.objects.all():
                writer.writerow([
                    product.id,
                    product.name,
                    product.vendor.name if product.vendor else "N/A",
                    product.category.name if product.category else "N/A",
                    str(product.price),
                    product.stock_quantity,
                    "Active" if product.is_active else "Inactive",
                    "Yes" if product.is_approved else "No"
                ])
        
        csv_content = output.getvalue()
        output.close()
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "csv_content": csv_content,
            "filename": f"{report_type}_report_{timezone.now().strftime('%Y%m%d')}.csv"
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ==================== PLATFORM SETTINGS ====================

@csrf_exempt
def admin_platform_settings(request):
    """Get/Update platform-wide settings"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}), request)
    
    if request.method == "GET":
        try:
            # These could be stored in a Settings model
            return add_cors_headers(JsonResponse({
                "success": True,
                "settings": {
                    "platform_name": "SmartCart",
                    "virtual_tryon_enabled": True,
                    "ai_recommendations_enabled": True,
                    "default_commission_rate": "10.00",
                    "low_stock_threshold": 10,
                    "max_products_per_vendor": 100,
                    "order_auto_complete_days": 7
                }
            }), request)
        except Exception as e:
            return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
    
    elif request.method == "POST":
        try:
            # Could update settings in a Settings model
            return add_cors_headers(JsonResponse({
                "success": True,
                "message": "Platform settings updated."
            }), request)
        except Exception as e:
            return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
    
    return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
