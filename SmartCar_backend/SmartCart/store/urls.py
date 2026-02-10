from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    # Admin Dashboard & Stats
    path("admin/dashboard/stats/", admin_views.admin_dashboard_stats, name="admin_dashboard_stats"),
    path("admin/report/", views.admin_report, name="admin_report"),
    
    # Admin Vendor Management
    path("admin/vendors/", admin_views.admin_vendors_list, name="admin_vendors_list"),
    path("admin/vendors/<int:vendor_id>/", admin_views.admin_vendor_detail, name="admin_vendor_detail"),
    path("admin/vendors/<int:vendor_id>/approve/", admin_views.admin_vendor_approve, name="admin_vendor_approve"),
    path("admin/vendors/<int:vendor_id>/reject/", admin_views.admin_vendor_reject, name="admin_vendor_reject"),
    path("admin/vendors/<int:vendor_id>/toggle-status/", admin_views.admin_vendor_toggle_status, name="admin_vendor_toggle_status"),
    path("admin/vendors/<int:vendor_id>/commission/", admin_views.admin_vendor_update_commission, name="admin_vendor_update_commission"),
    
    # Admin Product Moderation
    path("admin/products/", admin_views.admin_products_list, name="admin_products_list"),
    path("admin/products/<int:product_id>/", admin_views.admin_product_detail, name="admin_product_detail"),
    path("admin/products/<int:product_id>/approve/", admin_views.admin_product_approve, name="admin_product_approve"),
    path("admin/products/<int:product_id>/reject/", admin_views.admin_product_reject, name="admin_product_reject"),
    path("admin/products/<int:product_id>/toggle-status/", admin_views.admin_product_toggle_status, name="admin_product_toggle_status"),
    path("admin/products/bulk-approve/", admin_views.admin_product_bulk_approve, name="admin_product_bulk_approve"),
    
    # Admin User Management
    path("admin/users/", admin_views.admin_users_list, name="admin_users_list"),
    path("admin/users/<int:user_id>/", admin_views.admin_user_detail, name="admin_user_detail"),
    path("admin/users/<int:user_id>/toggle-status/", admin_views.admin_user_toggle_status, name="admin_user_toggle_status"),
    
    # Admin Order Management
    path("admin/orders/", admin_views.admin_orders_list, name="admin_orders_list"),
    path("admin/orders/<int:order_id>/", admin_views.admin_order_detail, name="admin_order_detail"),
    path("admin/orders/<int:order_id>/update-status/", admin_views.admin_order_update_status, name="admin_order_update_status"),
    
    # Admin Category & Occasion Management
    path("admin/categories/", admin_views.admin_categories_list, name="admin_categories_list"),
    path("admin/categories/create/", admin_views.admin_category_create, name="admin_category_create"),
    path("admin/categories/<int:category_id>/delete/", admin_views.admin_category_delete, name="admin_category_delete"),
    path("admin/occasions/", admin_views.admin_occasions_list, name="admin_occasions_list"),
    path("admin/occasions/create/", admin_views.admin_occasion_create, name="admin_occasion_create"),
    path("admin/occasions/<int:occasion_id>/delete/", admin_views.admin_occasion_delete, name="admin_occasion_delete"),
    
    # Admin Commission Management
    path("admin/commission/settings/", admin_views.admin_commission_settings, name="admin_commission_settings"),
    
    # Admin Reports & Analytics
    path("admin/reports/sales/", admin_views.admin_sales_report, name="admin_sales_report"),
    path("admin/reports/export/", admin_views.admin_export_report, name="admin_export_report"),
    
    # Admin Platform Settings
    path("admin/settings/", admin_views.admin_platform_settings, name="admin_platform_settings"),
    
    # Vendor profile and stats
    path("vendor/<int:vendor_id>/profile/", views.vendor_profile, name="vendor_profile"),
    path("vendor/<int:vendor_id>/update_profile/", views.vendor_update_profile, name="vendor_update_profile"),
    path("vendor/<int:vendor_id>/stats/", views.vendor_stats, name="vendor_stats"),
    
    # Vendor products
    path("vendor/<int:vendor_id>/products/", views.vendor_products, name="vendor_products"),
    path("vendor/add_product/", views.vendor_add_product, name="vendor_add_product"),
    path("vendor/edit_product/<int:product_id>/", views.vendor_edit_product, name="vendor_edit_product"),
    path("vendor/delete_product/<int:product_id>/", views.vendor_delete_product, name="vendor_delete_product"),
    
    # Vendor stock management
    path("vendor/<int:vendor_id>/stock_alerts/", views.vendor_stock_alerts, name="vendor_stock_alerts"),
    path("vendor/product/<int:product_id>/toggle_status/", views.vendor_toggle_product_status, name="vendor_toggle_product_status"),
    path("vendor/product/<int:product_id>/update_stock/", views.vendor_update_stock, name="vendor_update_stock"),
    
    # Vendor orders
    path("vendor/<int:vendor_id>/orders/", views.vendor_orders, name="vendor_orders"),
    path("vendor/order/update_status/", views.vendor_update_order_status, name="vendor_update_order_status"),
    
    # Vendor earnings and payouts
    path("vendor/<int:vendor_id>/earnings/", views.vendor_earnings, name="vendor_earnings"),
    path("vendor/<int:vendor_id>/payouts/", views.vendor_payouts, name="vendor_payouts"),
    path("vendor/<int:vendor_id>/report/", views.vendor_report, name="vendor_report"),
    
    # User dashboard endpoints
    path("user/orders/", views.user_orders, name="user_orders"),
    path("user/profile/", views.user_profile, name="user_profile"),
    path("user/profile/update/", views.user_profile_update, name="user_profile_update"),
    
    # Public product endpoints
    path("products/", views.products_list, name="products_list"),
    path("occasions/", views.occasions_list, name="occasions_list"),
    path("recommendations/<int:occasion_id>/", views.recommendations, name="recommendations"),
    path("try-on/", views.virtual_try_on, name="try_on"),
    path("products/<int:pk>/", views.product_detail, name="product_detail"),

    # Cart endpoints
    path("cart/", views.view_cart, name="view_cart"),
    path("cart/add/", views.add_to_cart, name="add_to_cart"),
    path("cart/update/", views.update_cart_item, name="update_cart_item"),
    path("cart/remove/", views.remove_cart_item, name="remove_cart_item"),

    # Stripe Payment endpoints
    path("stripe/config/", views.get_stripe_config, name="stripe_config"),
    path("stripe/create-payment-intent/", views.create_payment_intent, name="create_payment_intent"),
    path("stripe/confirm-payment/", views.confirm_stripe_payment, name="confirm_stripe_payment"),

    # Order endpoints
    path("buy/now/", views.buy_now, name="buy_now"),
    path("buy/cart/", views.buy_cart, name="buy_cart"),
]
