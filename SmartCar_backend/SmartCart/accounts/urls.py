"""
URL configuration for SmartCart project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# accounts/urls.py
from django.urls import path
from .views import signup_view, login_view, login_user_view, login_vendor_view, login_admin_view, current_user, logout_view, register_vendor, upgrade_to_vendor

urlpatterns = [
    path("signup/", signup_view, name="signup"),
    path("login/", login_view, name="login"),  # Generic login (backwards compatible)
    path("login/user/", login_user_view, name="login_user"),  # User-specific login
    path("login/vendor/", login_vendor_view, name="login_vendor"),  # Vendor-specific login
    path("login/admin/", login_admin_view, name="login_admin"),  # Admin-specific login
    path("current-user/", current_user, name="current_user"),
    path("logout/", logout_view, name="logout"),
    path("register_vendor/", register_vendor, name="register_vendor"),
    path("upgrade_to_vendor/", upgrade_to_vendor, name="upgrade_to_vendor"),
]

