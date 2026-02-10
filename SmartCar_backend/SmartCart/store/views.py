import json
from decimal import Decimal
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count, Q
import os, uuid

from .models import Product, Occasion, Category, Cart, CartItem, Order, OrderItem, Vendor, Payout
from django.contrib.auth import get_user_model
from accounts.models import AuthToken


# ============== VENDOR PROFILE ENDPOINTS ==============

@csrf_exempt
def vendor_profile(request, vendor_id):
    """Get vendor profile data"""
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        return add_cors_headers(JsonResponse({
            "success": True,
            "vendor": {
                "id": vendor.id,
                "name": vendor.name,
                "email": vendor.email,
                "phone": vendor.phone,
                "address": vendor.address,
                "description": vendor.description if hasattr(vendor, 'description') else "",
                "commission_rate": str(vendor.commission_rate),
                "is_active": vendor.is_active,
                "created_at": vendor.created_at.strftime("%Y-%m-%d")
            }
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)


@csrf_exempt
def vendor_update_profile(request, vendor_id):
    """Update vendor profile"""
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        data = json.loads(request.body.decode('utf-8'))
        
        if data.get('name'):
            vendor.name = data['name']
        if 'email' in data:
            vendor.email = data['email']
        if 'phone' in data:
            vendor.phone = data['phone']
        if 'address' in data:
            vendor.address = data['address']
        if 'description' in data:
            vendor.description = data['description']
        
        vendor.save()
        return add_cors_headers(JsonResponse({"success": True, "message": "Profile updated!"}), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== VENDOR STATS ENDPOINT ==============

@csrf_exempt
def vendor_stats(request, vendor_id):
    """Get vendor dashboard statistics"""
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        
        # Product count
        total_products = vendor.products.count()
        active_products = vendor.products.filter(is_active=True).count()
        
        # Stock alerts
        low_stock_products = []
        out_of_stock_products = []
        for p in vendor.products.all():
            if hasattr(p, 'stock_quantity'):
                if p.stock_quantity == 0:
                    out_of_stock_products.append({"id": p.id, "name": p.name, "stock": p.stock_quantity})
                elif p.stock_quantity <= p.low_stock_threshold:
                    low_stock_products.append({"id": p.id, "name": p.name, "stock": p.stock_quantity, "threshold": p.low_stock_threshold})
        
        # Order items for this vendor
        vendor_items = OrderItem.objects.filter(product__vendor=vendor)
        
        # Calculate overall stats
        total_orders = vendor_items.values('order').distinct().count()
        pending_orders = vendor_items.filter(status='pending').values('order').distinct().count()
        
        total_sales = sum(float(item.price) * item.quantity for item in vendor_items)
        total_commission = sum(float(item.commission) for item in vendor_items)
        total_earnings = total_sales - total_commission
        
        # Time-based analytics
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Today's stats
        today_items = vendor_items.filter(order__created_at__date=today)
        today_sales = sum(float(item.price) * item.quantity for item in today_items)
        today_orders = today_items.values('order').distinct().count()
        
        # This week's stats
        week_items = vendor_items.filter(order__created_at__gte=week_ago)
        week_sales = sum(float(item.price) * item.quantity for item in week_items)
        week_orders = week_items.values('order').distinct().count()
        
        # This month's stats
        month_items = vendor_items.filter(order__created_at__gte=month_ago)
        month_sales = sum(float(item.price) * item.quantity for item in month_items)
        month_orders = month_items.values('order').distinct().count()
        
        # Daily sales for last 7 days (for chart)
        daily_sales = []
        for i in range(7):
            day = today - timedelta(days=i)
            day_items = vendor_items.filter(order__created_at__date=day)
            day_total = sum(float(item.price) * item.quantity for item in day_items)
            daily_sales.append({
                "date": day.strftime("%Y-%m-%d"),
                "day": day.strftime("%a"),
                "sales": f"{day_total:.2f}",
                "orders": day_items.values('order').distinct().count()
            })
        daily_sales.reverse()  # Oldest to newest
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "stats": {
                "totalProducts": total_products,
                "activeProducts": active_products,
                "totalOrders": total_orders,
                "pendingOrders": pending_orders,
                "totalSales": f"{total_sales:.2f}",
                "totalEarnings": f"{total_earnings:.2f}",
                "todaySales": f"{today_sales:.2f}",
                "todayOrders": today_orders,
                "weekSales": f"{week_sales:.2f}",
                "weekOrders": week_orders,
                "monthSales": f"{month_sales:.2f}",
                "monthOrders": month_orders,
                "lowStockCount": len(low_stock_products),
                "outOfStockCount": len(out_of_stock_products)
            },
            "stockAlerts": {
                "lowStock": low_stock_products[:10],  # Top 10
                "outOfStock": out_of_stock_products[:10]  # Top 10
            },
            "dailySales": daily_sales
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== VENDOR STOCK ALERTS ENDPOINT ==============

@csrf_exempt
def vendor_stock_alerts(request, vendor_id):
    """Get detailed stock alerts for a vendor"""
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        
        low_stock_products = []
        out_of_stock_products = []
        
        for p in vendor.products.all():
            product_data = {
                "id": p.id,
                "name": p.name,
                "stock_quantity": p.stock_quantity if hasattr(p, 'stock_quantity') else 0,
                "low_stock_threshold": p.low_stock_threshold if hasattr(p, 'low_stock_threshold') else 10,
                "price": str(p.price),
                "image": p.image.url if p.image else None,
                "is_active": p.is_active if hasattr(p, 'is_active') else True
            }
            
            if hasattr(p, 'stock_quantity'):
                if p.stock_quantity == 0:
                    out_of_stock_products.append(product_data)
                elif p.stock_quantity <= p.low_stock_threshold:
                    low_stock_products.append(product_data)
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "lowStock": low_stock_products,
            "outOfStock": out_of_stock_products,
            "lowStockCount": len(low_stock_products),
            "outOfStockCount": len(out_of_stock_products)
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== VENDOR TOGGLE PRODUCT STATUS ==============

@csrf_exempt
def vendor_toggle_product_status(request, product_id):
    """Toggle a product's active status"""
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        product = Product.objects.get(id=product_id)
        product.is_active = not product.is_active
        product.save()
        return add_cors_headers(JsonResponse({
            "success": True, 
            "message": f"Product {'activated' if product.is_active else 'deactivated'}!",
            "is_active": product.is_active
        }), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== VENDOR UPDATE STOCK ==============

@csrf_exempt
def vendor_update_stock(request, product_id):
    """Update product stock quantity"""
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        data = json.loads(request.body.decode('utf-8'))
        stock_quantity = data.get('stock_quantity')
        
        if stock_quantity is None:
            return add_cors_headers(JsonResponse({"success": False, "message": "stock_quantity required"}), request)
        
        product = Product.objects.get(id=product_id)
        product.stock_quantity = int(stock_quantity)
        product.save()
        
        return add_cors_headers(JsonResponse({
            "success": True, 
            "message": "Stock updated!",
            "stock_quantity": product.stock_quantity,
            "is_low_stock": product.stock_quantity <= product.low_stock_threshold,
            "is_out_of_stock": product.stock_quantity == 0
        }), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== VENDOR ORDER ENDPOINTS ==============

@csrf_exempt
def vendor_orders(request, vendor_id):
    """Get all orders for a vendor's products"""
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        
        # Get all order items for this vendor's products
        order_items = OrderItem.objects.filter(product__vendor=vendor).select_related('order', 'product').order_by('-order__created_at')
        
        orders = []
        for item in order_items:
            orders.append({
                "order_id": item.order.id,
                "item_id": item.id,
                "product_name": item.product.name if item.product else "Unknown",
                "product_image": item.product.image.url if item.product and item.product.image else None,
                "quantity": item.quantity,
                "price": str(item.price),
                "commission": str(item.commission),
                "status": item.status,
                "date": item.order.created_at.strftime("%Y-%m-%d %H:%M"),
                "customer_name": item.order.full_name or item.order.user.username,
                "shipping_address": f"{item.order.address}, {item.order.city}, {item.order.country}" if item.order.address else None
            })
        
        return add_cors_headers(JsonResponse({"success": True, "orders": orders}), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def vendor_update_order_status(request):
    """Update order item status"""
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        data = json.loads(request.body.decode('utf-8'))
        item_id = data.get('item_id')
        new_status = data.get('status')
        
        if not item_id or not new_status:
            return add_cors_headers(JsonResponse({"success": False, "message": "item_id and status required"}), request)
        
        item = OrderItem.objects.get(id=item_id)
        item.status = new_status
        item.save()
        
        return add_cors_headers(JsonResponse({"success": True, "message": "Status updated!"}), request)
    except OrderItem.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Order item not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== VENDOR EARNINGS ENDPOINTS ==============

@csrf_exempt
def vendor_earnings(request, vendor_id):
    """Get vendor earnings with period filtering"""
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        period = request.GET.get('period', 'all')
        
        # Base queryset
        items = OrderItem.objects.filter(product__vendor=vendor)
        
        # Apply period filter
        now = timezone.now()
        if period == 'today':
            items = items.filter(order__created_at__date=now.date())
        elif period == 'week':
            week_ago = now - timedelta(days=7)
            items = items.filter(order__created_at__gte=week_ago)
        elif period == 'month':
            month_ago = now - timedelta(days=30)
            items = items.filter(order__created_at__gte=month_ago)
        
        # Calculate earnings
        total_sales = sum(float(item.price) * item.quantity for item in items)
        total_commission = sum(float(item.commission) for item in items)
        net_earnings = total_sales - total_commission
        
        # Payout info
        payouts = Payout.objects.filter(vendor=vendor)
        paid_out = sum(float(p.amount) for p in payouts.filter(status='completed'))
        pending_payout = net_earnings - paid_out
        if pending_payout < 0:
            pending_payout = 0
        
        # Transaction list
        transactions = []
        for item in items.select_related('order', 'product').order_by('-order__created_at')[:50]:
            sale_amount = float(item.price) * item.quantity
            commission = float(item.commission)
            transactions.append({
                "date": item.order.created_at.strftime("%Y-%m-%d"),
                "order_id": item.order.id,
                "product_name": item.product.name if item.product else "Unknown",
                "sale_amount": f"{sale_amount:.2f}",
                "commission": f"{commission:.2f}",
                "net_earning": f"{sale_amount - commission:.2f}"
            })
        
        return add_cors_headers(JsonResponse({
            "success": True,
            "earnings": {
                "totalSales": f"{total_sales:.2f}",
                "totalCommission": f"{total_commission:.2f}",
                "netEarnings": f"{net_earnings:.2f}",
                "pendingPayout": f"{pending_payout:.2f}",
                "paidOut": f"{paid_out:.2f}",
                "commissionRate": str(vendor.commission_rate)
            },
            "transactions": transactions
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


@csrf_exempt
def vendor_payouts(request, vendor_id):
    """Get vendor payout history"""
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        payouts = Payout.objects.filter(vendor=vendor).order_by('-created_at')
        
        payout_list = [
            {
                "payout_id": p.id,
                "date": p.created_at.strftime("%Y-%m-%d"),
                "amount": str(p.amount),
                "status": p.status,
                "method": p.payment_method,
                "transaction_id": p.transaction_id
            }
            for p in payouts
        ]
        
        return add_cors_headers(JsonResponse({"success": True, "payouts": payout_list}), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# ============== PRODUCT DELETE ENDPOINT ==============

@csrf_exempt
def vendor_delete_product(request, product_id):
    """Delete a vendor's product"""
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        product = Product.objects.get(id=product_id)
        product.delete()
        return add_cors_headers(JsonResponse({"success": True, "message": "Product deleted!"}), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)


# Admin sales and commission report API
@csrf_exempt
def admin_report(request):
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        from .models import OrderItem
        items = OrderItem.objects.all()
        total_sales = sum(float(item.price) * item.quantity for item in items)
        total_commission = sum(float(item.commission) for item in items)
        orders = [
            {
                "order_id": item.order.id,
                "date": item.order.created_at.strftime("%Y-%m-%d"),
                "vendor": item.product.vendor.name if item.product and item.product.vendor else "-",
                "product": item.product.name if item.product else "-",
                "quantity": item.quantity,
                "price": str(item.price),
                "commission": str(item.commission)
            }
            for item in items
        ]
        return add_cors_headers(JsonResponse({
            "success": True,
            "total_sales": f"{total_sales:.2f}",
            "total_commission": f"{total_commission:.2f}",
            "orders": orders
        }), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
# Vendor sales and commission report API
@csrf_exempt
def vendor_report(request, vendor_id):
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        from .models import Vendor, OrderItem
        vendor = Vendor.objects.get(id=vendor_id)
        items = OrderItem.objects.filter(product__vendor=vendor)
        total_sales = sum(float(item.price) * item.quantity for item in items)
        total_commission = sum(float(item.commission) for item in items)
        orders = [
            {
                "order_id": item.order.id,
                "date": item.order.created_at.strftime("%Y-%m-%d"),
                "product": item.product.name if item.product else "-",
                "quantity": item.quantity,
                "price": str(item.price),
                "commission": str(item.commission)
            }
            for item in items
        ]
        return add_cors_headers(JsonResponse({
            "success": True,
            "total_sales": f"{total_sales:.2f}",
            "total_commission": f"{total_commission:.2f}",
            "orders": orders
        }), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
# Admin: List all vendors (for admin dashboard)
@csrf_exempt
def admin_vendors(request):
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        from .models import Vendor
        vendors = Vendor.objects.all()
        vendor_list = [
            {
                "id": v.id,
                "name": v.name,
                "email": v.email,
                "phone": v.phone,
                "commission_rate": str(v.commission_rate),
                "is_active": v.is_active
            }
            for v in vendors
        ]
        return add_cors_headers(JsonResponse({"success": True, "vendors": vendor_list}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
# Vendor edit product API (for vendor dashboard)
@csrf_exempt
def vendor_edit_product(request, product_id):
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        from .models import Product, Occasion
        product = Product.objects.get(id=product_id)
        name = request.POST.get("name")
        price = request.POST.get("price")
        discount = request.POST.get("discount")
        occasion_name = request.POST.get("occasion")
        category_name = request.POST.get("category")
        description = request.POST.get("description")
        sizes = request.POST.get("sizes")
        colors = request.POST.get("colors")
        stock_quantity = request.POST.get("stock_quantity")
        low_stock_threshold = request.POST.get("low_stock_threshold")
        is_active = request.POST.get("is_active")
        image = request.FILES.get("image")
        
        if name:
            product.name = name
        if price:
            product.price = price
        if discount is not None:
            product.discount = Decimal(discount) if discount else Decimal('0')
        if occasion_name:
            occasion, _ = Occasion.objects.get_or_create(name=occasion_name)
            product.occasion = occasion
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
            product.category = category
        if description is not None:
            product.description = description
        if sizes is not None:
            product.sizes = sizes
        if colors is not None:
            product.colors = colors
        if stock_quantity is not None:
            product.stock_quantity = int(stock_quantity)
        if low_stock_threshold is not None:
            product.low_stock_threshold = int(low_stock_threshold)
        if is_active is not None:
            product.is_active = is_active.lower() == 'true' if isinstance(is_active, str) else bool(is_active)
        if image:
            product.image = image
        
        product.save()
        return add_cors_headers(JsonResponse({"success": True, "message": "Product updated!"}), request)
    except Product.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Product not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
# Vendor add product API (for vendor dashboard)
@csrf_exempt
def vendor_add_product(request):
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor_id = request.POST.get("vendor_id")
        name = request.POST.get("name")
        price = request.POST.get("price")
        discount = request.POST.get("discount", "0")
        occasion_name = request.POST.get("occasion")
        category_name = request.POST.get("category")
        description = request.POST.get("description")
        sizes = request.POST.get("sizes")
        colors = request.POST.get("colors")
        stock_quantity = request.POST.get("stock_quantity", "0")
        low_stock_threshold = request.POST.get("low_stock_threshold", "10")
        image = request.FILES.get("image")
        
        if not all([vendor_id, name, price]):
            return add_cors_headers(JsonResponse({"success": False, "message": "Name, price, and vendor are required."}), request)
        
        vendor = Vendor.objects.get(id=vendor_id)
        occasion = None
        category = None
        if occasion_name:
            occasion, _ = Occasion.objects.get_or_create(name=occasion_name)
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
        
        product = Product.objects.create(
            name=name,
            price=price,
            discount=Decimal(discount) if discount else Decimal('0'),
            occasion=occasion,
            category=category,
            description=description or "",
            sizes=sizes or "",
            colors=colors or "",
            stock_quantity=int(stock_quantity) if stock_quantity else 0,
            low_stock_threshold=int(low_stock_threshold) if low_stock_threshold else 10,
            vendor=vendor,
            image=image,
            is_active=True,
            is_approved=True  # Auto-approve for now, can be changed to False for manual approval
        )
        return add_cors_headers(JsonResponse({"success": True, "message": "Product added!", "product_id": product.id}), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)
# Vendor product listing API (for vendor dashboard)
@csrf_exempt
def vendor_products(request, vendor_id):
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid request method"}), request)
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        products = vendor.products.all()
        product_list = [
            {
                "id": p.id,
                "name": p.name,
                "price": str(p.price),
                "discount": str(p.discount) if hasattr(p, 'discount') else "0",
                "occasion": p.occasion.name if p.occasion else None,
                "category": p.category.name if p.category else None,
                "description": p.description,
                "sizes": p.sizes if hasattr(p, 'sizes') else "",
                "colors": p.colors if hasattr(p, 'colors') else "",
                "image": p.image.url if p.image else None,
                "stock_quantity": p.stock_quantity if hasattr(p, 'stock_quantity') else 0,
                "low_stock_threshold": p.low_stock_threshold if hasattr(p, 'low_stock_threshold') else 10,
                "is_active": p.is_active if hasattr(p, 'is_active') else True,
                "is_approved": p.is_approved if hasattr(p, 'is_approved') else True,
                "is_low_stock": p.stock_quantity <= p.low_stock_threshold if hasattr(p, 'stock_quantity') else False,
                "is_out_of_stock": p.stock_quantity == 0 if hasattr(p, 'stock_quantity') else False,
            }
            for p in products
        ]
        return add_cors_headers(JsonResponse({"success": True, "products": product_list}), request)
    except Vendor.DoesNotExist:
        return add_cors_headers(JsonResponse({"success": False, "message": "Vendor not found"}), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({"success": False, "message": str(e)}), request)

# Generic payment gateway integration endpoint (SRS scaffold)
@csrf_exempt
@require_POST
def initiate_payment(request):
    """
    Scaffold endpoint for payment gateway integration.
    Expects: order_id, amount, payment_method
    Returns: payment_url or payment_token for frontend to redirect/handle
    """
    try:
        data = json.loads(request.body.decode())
        order_id = data.get('order_id')
        amount = data.get('amount')
        payment_method = data.get('payment_method', 'Card')
        # Validate order
        from .models import Order
        order = Order.objects.get(id=order_id)
        # Here, integrate with payment provider (Stripe, Razorpay, etc.)
        # For now, return a mock payment URL/token
        payment_url = f"https://payment-gateway.example.com/pay?order_id={order_id}&amount={amount}"
        response = {
            'success': True,
            'payment_url': payment_url,
            'message': 'Payment initiated (mock)'
        }
        return add_cors_headers(JsonResponse(response), request)
    except Exception as e:
        return add_cors_headers(JsonResponse({'success': False, 'message': str(e)}), request)

from .models import Product, Occasion, Cart, CartItem, Order, OrderItem
from django.contrib.auth import get_user_model
from accounts.models import AuthToken


def add_cors_headers(response, request=None):
    """Helper function to add CORS headers to a response"""
    # When using credentials, we cannot use '*' - must specify origin
    if request:
        origin = request.META.get('HTTP_ORIGIN') or request.META.get('Origin') or 'http://localhost:5173'
        # For development, allow any localhost origin
        allowed_origins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            'http://localhost:5174',
            'http://127.0.0.1:5174'
        ]
        
        # Check if origin is in allowed list or is a localhost variant
        if origin in allowed_origins or 'localhost' in origin.lower() or '127.0.0.1' in origin:
            response["Access-Control-Allow-Origin"] = origin
        else:
            # Default to localhost:5173 for development
            response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    else:
        # Fallback for when request is not available
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Auth-Token, Accept, X-Requested-With"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Max-Age"] = "3600"
    return response


def _get_user_from_request(request):
    # prefer session-authenticated user
    if hasattr(request, 'user') and request.user.is_authenticated:
        print(f"store.views: user from session: {request.user.username}")
        return request.user
    # fallback: check X-Auth-Token header
    token = None
    # Django stores HTTP headers in request.META as HTTP_<HEADER_NAME>
    if request.META.get('HTTP_X_AUTH_TOKEN'):
        token = request.META.get('HTTP_X_AUTH_TOKEN')
    elif request.META.get('HTTP_AUTHORIZATION'):
        # accept 'Token <key>' or raw key
        auth = request.META.get('HTTP_AUTHORIZATION')
        if auth.startswith('Token '):
            token = auth.split(' ', 1)[1].strip()
        else:
            token = auth.strip()
    if token:
        try:
            at = AuthToken.objects.select_related('user').get(key=token)
            print(f"store.views: user from token header: {at.user.username}")
            return at.user
        except AuthToken.DoesNotExist:
            print(f"store.views: invalid token provided: {token}")
            return None
    return None


def serialize_product(p: Product):
    image_url = p.image.url if p.image else ""
    # Calculate discounted price
    discounted_price = float(p.price)
    discount = float(p.discount) if hasattr(p, 'discount') and p.discount else 0
    if discount > 0:
        discounted_price = float(p.price) * (1 - discount / 100)
    
    return {
        "id": p.id,
        "name": p.name,
        "price": str(p.price),
        "discount": str(discount),
        "discounted_price": f"{discounted_price:.2f}",
        "image": image_url,
        "occasion": p.occasion.name if p.occasion else None,
        "category": p.category.name if p.category else None,
        "description": p.description,
        "sizes": p.sizes if hasattr(p, 'sizes') else "",
        "colors": p.colors if hasattr(p, 'colors') else "",
        "stock_quantity": p.stock_quantity if hasattr(p, 'stock_quantity') else 0,
        "is_in_stock": p.stock_quantity > 0 if hasattr(p, 'stock_quantity') else True,
        "vendor_name": p.vendor.name if p.vendor else None,
    }


def get_or_create_cart(user: User):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


# Product list (optionally filter by occasion)
# Only shows active and approved products (includes out of stock for display)
@csrf_exempt
def products_list(request):
    occ = request.GET.get('occasion')
    hide_out_of_stock = request.GET.get('hide_out_of_stock', 'false').lower() == 'true'
    
    # Base queryset - only active and approved products
    qs = Product.objects.filter(is_active=True, is_approved=True)
    
    if occ:
        qs = qs.filter(occasion__name__iexact=occ)
    
    # Optionally hide out of stock products (default: show them)
    if hide_out_of_stock:
        qs = qs.filter(stock_quantity__gt=0)
    
    data = [serialize_product(p) for p in qs]
    response = JsonResponse({"success": True, "products": data})
    return add_cors_headers(response)


@csrf_exempt
def occasions_list(request):
    qs = Occasion.objects.all().order_by('id')  # Order by ID for consistency
    data = [{"id": o.id, "name": o.name, "image": ""} for o in qs] # Added image placeholder if needed
    print(f"✓ Returning {len(data)} occasions to frontend")
    response = JsonResponse({"success": True, "occasions": data})
    return add_cors_headers(response)


@csrf_exempt
def recommendations(request, occasion_id):
    qs = Product.objects.filter(occasion_id=occasion_id)
    data = [serialize_product(p) for p in qs]
    response = JsonResponse({"success": True, "products": data})
    return add_cors_headers(response)


@csrf_exempt
def virtual_try_on(request):
    # Handle CORS preflight OPTIONS request
    if request.method == "OPTIONS":
        response = JsonResponse({}, status=200)
        return add_cors_headers(response)
    
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    
    image_file = request.FILES.get('image')
    product_id = request.POST.get('product_id')
    
    if not image_file:
        response = JsonResponse({"success": False, "message": "Image required"}, status=400)
        return add_cors_headers(response)

    try:
        # Import the virtual try-on service
        from .virtual_tryon_service import VirtualTryOnService
        
        # Get product image if product_id is provided
        product_image_url = None
        if product_id:
            try:
                product = Product.objects.get(pk=product_id)
                if product.image:
                    # Get the full path or URL to the product image
                    if hasattr(product.image, 'url'):
                        product_image_url = product.image.url
                    elif hasattr(product.image, 'path'):
                        product_image_url = product.image.path
                    else:
                        product_image_url = str(product.image)
                    print(f"Product image URL: {product_image_url}")
            except Product.DoesNotExist:
                print(f"Product not found: {product_id}")
        
        # Initialize service and process try-on
        service = VirtualTryOnService()
        result = service.process_try_on(
            user_image=image_file,
            product_image_url=product_image_url,
            product_id=product_id
        )
        
        if result['success']:
            response = JsonResponse({
                "success": True,
                "result_image": result['result_image_url'],
                "message": result['message']
            })
        else:
            response = JsonResponse({
                "success": False,
                "message": result.get('message', 'Virtual try-on failed')
            }, status=500)
        
        return add_cors_headers(response)
        
    except Exception as e:
        import traceback
        print(f"Error in virtual_try_on view: {str(e)}")
        print(traceback.format_exc())
        response = JsonResponse({
            "success": False,
            "message": f"Error processing try-on: {str(e)}"
        }, status=500)
        return add_cors_headers(response)


@csrf_exempt
def product_detail(request, pk):
    p = get_object_or_404(Product, pk=pk)
    response = JsonResponse({"success": True, "product": serialize_product(p)})
    return add_cors_headers(response)


# ------- Cart endpoints -------
@csrf_exempt
def view_cart(request):
    # Handle CORS preflight OPTIONS request
    if request.method == "OPTIONS":
        response = JsonResponse({}, status=200)
        return add_cors_headers(response)
    
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    cart = get_or_create_cart(user)
    items = []
    for it in cart.items.select_related('product'):
        items.append({
            "id": it.id,
            "product": serialize_product(it.product),
            "quantity": it.quantity,
        })
    response = JsonResponse({"success": True, "cart": {"items": items, "total": str(cart.total())}})
    return add_cors_headers(response)


@csrf_exempt
def add_to_cart(request):
    """
    Add product to cart with comprehensive error handling.
    Always returns valid JSON response.
    """
    # Handle CORS preflight OPTIONS request
    # Note: corsheaders middleware should handle this, but we'll handle it explicitly too
    if request.method == "OPTIONS":
        origin = request.META.get('HTTP_ORIGIN') or request.META.get('Origin') or 'http://localhost:5173'
        print(f"✓ Handling OPTIONS preflight for /api/cart/add/")
        print(f"  Origin: {origin}")
        print(f"  Request method: {request.method}")
        print(f"  Request META keys: {[k for k in request.META.keys() if 'HTTP' in k or 'ORIGIN' in k.upper()]}")
        
        # Create response with proper CORS headers
        response = JsonResponse({"status": "ok"}, status=200)
        response = add_cors_headers(response, request)
        
        # Ensure all required CORS headers are present
        allowed_origin = response.get('Access-Control-Allow-Origin', 'NOT SET')
        print(f"  ✓ Set Access-Control-Allow-Origin: {allowed_origin}")
        print(f"  ✓ Access-Control-Allow-Methods: {response.get('Access-Control-Allow-Methods', 'NOT SET')}")
        print(f"  ✓ Access-Control-Allow-Headers: {response.get('Access-Control-Allow-Headers', 'NOT SET')}")
        print(f"  ✓ Access-Control-Allow-Credentials: {response.get('Access-Control-Allow-Credentials', 'NOT SET')}")
        
        return response
    
    try:
        # Validate HTTP method
        if request.method != "POST":
            print(f"❌ Invalid method: {request.method}")
            response = JsonResponse({"success": False, "message": "Invalid method. Use POST."}, status=405)
            return add_cors_headers(response, request)
        
        print(f"✓ Received POST request to /api/cart/add/")
        print(f"  Headers: {dict(request.META)}")
        print(f"  Body: {request.body.decode('utf-8') if request.body else 'Empty'}")
        
        # Check authentication
        user = _get_user_from_request(request)
        print(f"  User: {user.username if user else 'Not authenticated'}")
        if not user:
            response = JsonResponse({
                "success": False, 
                "message": "Authentication required. Please log in to add items to cart."
            }, status=401)
            return add_cors_headers(response, request)
        
        # Parse request data
        try:
            if request.body:
                data = json.loads(request.body.decode('utf-8'))
            else:
                data = request.POST.dict() if hasattr(request.POST, 'dict') else dict(request.POST)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            response = JsonResponse({
                "success": False,
                "message": "Invalid request format. Expected JSON."
            }, status=400)
            return add_cors_headers(response, request)
        
        # Validate product_id
        product_id = data.get('product_id')
        if not product_id:
            response = JsonResponse({
                "success": False,
                "message": "Product ID is required."
            }, status=400)
            return add_cors_headers(response, request)
        
        # Validate product_id is numeric
        try:
            product_id = int(product_id)
        except (ValueError, TypeError):
            response = JsonResponse({
                "success": False,
                "message": "Invalid product ID format."
            }, status=400)
            return add_cors_headers(response, request)
        
        # Validate quantity
        try:
            qty = int(data.get('quantity', 1))
            if qty < 1:
                qty = 1
        except (ValueError, TypeError):
            qty = 1
        
        # Check if product exists
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            response = JsonResponse({
                "success": False,
                "message": f"Product with ID {product_id} not found."
            }, status=404)
            return add_cors_headers(response, request)
        except Exception as e:
            response = JsonResponse({
                "success": False,
                "message": "Error retrieving product information."
            }, status=500)
            return add_cors_headers(response, request)
        
        # Get or create cart
        try:
            cart = get_or_create_cart(user)
        except Exception as e:
            response = JsonResponse({
                "success": False,
                "message": "Error accessing cart. Please try again."
            }, status=500)
            return add_cors_headers(response, request)
        
        # Add or update cart item
        try:
            item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            if not created:
                item.quantity = item.quantity + qty
            else:
                item.quantity = qty
            item.save()
        except Exception as e:
            response = JsonResponse({
                "success": False,
                "message": "Error adding product to cart. Please try again."
            }, status=500)
            return add_cors_headers(response, request)
        
        # Success response
        print(f"✓ Product {product_id} added to cart for user {user.username}")
        response = JsonResponse({
            "success": True,
            "message": "Product added to cart successfully.",
            "cart_item_id": item.id,
            "quantity": item.quantity
        })
        return add_cors_headers(response, request)
        
    except Exception as e:
        # Catch-all error handler - ensures we always return valid JSON
        import traceback
        error_msg = str(e)
        print(f"❌ Unexpected error in add_to_cart: {error_msg}")
        print(traceback.format_exc())
        response = JsonResponse({
            "success": False,
            "message": f"An unexpected error occurred: {error_msg}. Please try again later."
        }, status=500)
        return add_cors_headers(response, request)


@csrf_exempt
def update_cart_item(request):
    # Handle CORS preflight OPTIONS request
    if request.method == "OPTIONS":
        response = JsonResponse({}, status=200)
        return add_cors_headers(response)
    
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST
    item_id = data.get('item_id')
    qty = data.get('quantity')
    if not item_id or qty is None:
        response = JsonResponse({"success": False, "message": "item_id and quantity required"}, status=400)
        return add_cors_headers(response)
    item = get_object_or_404(CartItem, pk=item_id, cart__user=user)
    item.quantity = int(qty)
    if item.quantity <= 0:
        item.delete()
    else:
        item.save()
    response = JsonResponse({"success": True, "message": "Cart updated"})
    return add_cors_headers(response)


@csrf_exempt
def remove_cart_item(request):
    # Handle CORS preflight OPTIONS request
    if request.method == "OPTIONS":
        response = JsonResponse({}, status=200)
        return add_cors_headers(response)
    
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST
    item_id = data.get('item_id')
    if not item_id:
        response = JsonResponse({"success": False, "message": "item_id required"}, status=400)
        return add_cors_headers(response)
    item = get_object_or_404(CartItem, pk=item_id, cart__user=user)
    item.delete()
    response = JsonResponse({"success": True, "message": "Removed"})
    return add_cors_headers(response)


# Buy now (single product)
@csrf_exempt
def buy_now(request):
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST
    product_id = data.get('product_id')
    qty = int(data.get('quantity') or 1)
    if not product_id:
        response = JsonResponse({"success": False, "message": "product_id required"}, status=400)
        return add_cors_headers(response)
    product = get_object_or_404(Product, pk=product_id)
    
    # Calculate commission if product has vendor
    commission = Decimal(0)
    if product.vendor:
        commission_rate = product.vendor.commission_rate
        commission = (Decimal(product.price) * qty * commission_rate / 100)
    
    order = Order.objects.create(user=user, total=Decimal(product.price) * qty)
    OrderItem.objects.create(
        order=order, 
        product=product, 
        quantity=qty, 
        price=product.price,
        commission=commission
    )
    response = JsonResponse({"success": True, "message": "Order created", "order_id": order.id})
    return add_cors_headers(response)


# Buy everything in cart
@csrf_exempt
def buy_cart(request):
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    cart = get_or_create_cart(user)
    items = list(cart.items.select_related('product', 'product__vendor'))
    if not items:
        response = JsonResponse({"success": False, "message": "Cart is empty"}, status=400)
        return add_cors_headers(response)
    
    total = Decimal(0)
    order = Order.objects.create(
        user=user, 
        total=0,
        full_name=data.get('full_name', ''),
        address=data.get('address', ''),
        city=data.get('city', ''),
        zip_code=data.get('zip_code', ''),
        country=data.get('country', ''),
        payment_method=data.get('payment_method', 'Card'),
        payment_status='Paid'
    )

    for it in items:
        price = it.product.price
        # Calculate commission if product has vendor
        commission = Decimal(0)
        if it.product.vendor:
            commission_rate = it.product.vendor.commission_rate
            commission = (Decimal(price) * it.quantity * commission_rate / 100)
        
        OrderItem.objects.create(
            order=order, 
            product=it.product, 
            quantity=it.quantity, 
            price=price,
            commission=commission
        )
        total += Decimal(price) * it.quantity
    
    order.total = total
    order.save()
    cart.clear()
    response = JsonResponse({"success": True, "message": "Order created from cart", "order_id": order.id})
    return add_cors_headers(response)


# ============== STRIPE PAYMENT ENDPOINTS ==============

import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt
def get_stripe_config(request):
    """Return Stripe publishable key for frontend"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}))
    response = JsonResponse({
        "success": True,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    })
    return add_cors_headers(response)


@csrf_exempt
def create_payment_intent(request):
    """Create a Stripe PaymentIntent for the cart total"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}))
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = {}
    
    cart = get_or_create_cart(user)
    items = list(cart.items.select_related('product'))
    
    if not items:
        response = JsonResponse({"success": False, "message": "Cart is empty"}, status=400)
        return add_cors_headers(response)
    
    # Calculate total in cents for Stripe
    total = sum(Decimal(it.product.price) * it.quantity for it in items)
    amount_cents = int(total * 100)
    
    if amount_cents < 50:  # Stripe minimum is 50 cents
        response = JsonResponse({"success": False, "message": "Order total too low"}, status=400)
        return add_cors_headers(response)
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            metadata={
                'user_id': user.id,
                'user_email': user.email
            }
        )
        response = JsonResponse({
            "success": True,
            "client_secret": intent.client_secret,
            "amount": str(total)
        })
        return add_cors_headers(response)
    except stripe.error.StripeError as e:
        response = JsonResponse({"success": False, "message": str(e)}, status=400)
        return add_cors_headers(response)


@csrf_exempt
def confirm_stripe_payment(request):
    """Confirm payment and create order after successful Stripe payment"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}))
    if request.method != "POST":
        response = JsonResponse({"success": False, "message": "Invalid method"}, status=405)
        return add_cors_headers(response)
    
    user = _get_user_from_request(request)
    if not user:
        response = JsonResponse({"success": False, "message": "Authentication required"}, status=401)
        return add_cors_headers(response)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = {}
    
    payment_intent_id = data.get('payment_intent_id')
    if not payment_intent_id:
        response = JsonResponse({"success": False, "message": "Payment intent ID required"}, status=400)
        return add_cors_headers(response)
    
    try:
        # Verify payment with Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            response = JsonResponse({"success": False, "message": "Payment not completed"}, status=400)
            return add_cors_headers(response)
        
        # Create the order
        cart = get_or_create_cart(user)
        items = list(cart.items.select_related('product', 'product__vendor'))
        
        if not items:
            response = JsonResponse({"success": False, "message": "Cart is empty"}, status=400)
            return add_cors_headers(response)
        
        total = Decimal(0)
        order = Order.objects.create(
            user=user,
            total=0,
            full_name=data.get('full_name', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            zip_code=data.get('zip_code', ''),
            country=data.get('country', ''),
            payment_method='Stripe',
            payment_status='Paid'
        )
        
        for it in items:
            price = it.product.price
            commission = Decimal(0)
            if it.product.vendor:
                commission_rate = it.product.vendor.commission_rate
                commission = (Decimal(price) * it.quantity * commission_rate / 100)
            
            OrderItem.objects.create(
                order=order,
                product=it.product,
                quantity=it.quantity,
                price=price,
                commission=commission
            )
            total += Decimal(price) * it.quantity
        
        order.total = total
        order.save()
        cart.clear()
        
        response = JsonResponse({
            "success": True,
            "message": "Payment successful! Order created.",
            "order_id": order.id
        })
        return add_cors_headers(response)
        
    except stripe.error.StripeError as e:
        response = JsonResponse({"success": False, "message": str(e)}, status=400)
        return add_cors_headers(response)


# ============== USER DASHBOARD ENDPOINTS ==============

@csrf_exempt
def user_orders(request):
    """Get all orders for the logged-in user"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}))
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid method"}))
    
    user = _get_user_from_request(request)
    if not user:
        return add_cors_headers(JsonResponse({"success": False, "message": "Authentication required"}, status=401))
    
    orders = Order.objects.filter(user=user).order_by('-created_at')
    orders_data = []
    
    for order in orders:
        items_data = []
        for item in order.items.select_related('product'):
            items_data.append({
                "name": item.product.name if item.product else "Product removed",
                "quantity": item.quantity,
                "price": str(item.price),
                "image": item.product.image.url if item.product and item.product.image else None
            })
        
        orders_data.append({
            "id": order.id,
            "date": order.created_at.strftime("%B %d, %Y") if order.created_at else "N/A",
            "status": order.status or "Pending",
            "total": str(order.total),
            "items": items_data,
            "full_name": order.full_name or "",
            "address": order.address or "",
            "city": order.city or "",
            "country": order.country or "",
            "payment_method": order.payment_method or "",
            "payment_status": order.payment_status or ""
        })
    
    return add_cors_headers(JsonResponse({"success": True, "orders": orders_data}))


@csrf_exempt
def user_profile(request):
    """Get user profile data with stats"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}))
    if request.method != "GET":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid method"}))
    
    user = _get_user_from_request(request)
    if not user:
        return add_cors_headers(JsonResponse({"success": False, "message": "Authentication required"}, status=401))
    
    # Get user profile if exists
    from accounts.models import UserProfile
    profile = None
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        pass
    
    # Calculate stats
    orders = Order.objects.filter(user=user)
    total_orders = orders.count()
    pending_orders = orders.filter(status__in=['Pending', 'Processing', 'Shipped']).count()
    completed_orders = orders.filter(status='Delivered').count()
    # Only count paid orders in total spent
    total_spent = orders.filter(payment_status='Paid').aggregate(total=Sum('total'))['total'] or Decimal('0.00')
    
    return add_cors_headers(JsonResponse({
        "success": True,
        "profile": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": profile.phone if profile and hasattr(profile, 'phone') else "",
            "address": profile.address if profile and hasattr(profile, 'address') else ""
        },
        "stats": {
            "totalOrders": total_orders,
            "pendingOrders": pending_orders,
            "completedOrders": completed_orders,
            "totalSpent": str(total_spent)
        }
    }))


@csrf_exempt
def user_profile_update(request):
    """Update user profile"""
    if request.method == "OPTIONS":
        return add_cors_headers(JsonResponse({"success": True}))
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"success": False, "message": "Invalid method"}))
    
    user = _get_user_from_request(request)
    if not user:
        return add_cors_headers(JsonResponse({"success": False, "message": "Authentication required"}, status=401))
    
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST
    
    # Update Django User fields
    if data.get('first_name'):
        user.first_name = data['first_name']
    if data.get('last_name'):
        user.last_name = data['last_name']
    if data.get('email'):
        user.email = data['email']
    user.save()
    
    # Update UserProfile fields
    from accounts.models import UserProfile
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    if 'phone' in data:
        profile.phone = data['phone']
    if 'address' in data:
        profile.address = data['address']
    profile.save()
    
    return add_cors_headers(JsonResponse({"success": True, "message": "Profile updated successfully!"}))
