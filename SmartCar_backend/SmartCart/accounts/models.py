
from django.db import models
from django.contrib.auth.models import User
import secrets


# User role management
class UserProfile(models.Model):
	USER_ROLES = (
		("customer", "Customer"),
		("vendor", "Vendor"),
		("admin", "Admin"),
	)
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
	role = models.CharField(max_length=20, choices=USER_ROLES, default="customer")
	phone = models.CharField(max_length=20, blank=True, default="")
	address = models.TextField(blank=True, default="")
	profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)

	def __str__(self):
		return f"{self.user.username} ({self.role})"


class AuthToken(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_tokens')
	key = models.CharField(max_length=64, unique=True, db_index=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def save(self, *args, **kwargs):
		if not self.key:
			self.key = secrets.token_hex(32)
		return super().save(*args, **kwargs)

	def __str__(self):
		return f"AuthToken({self.user.username})"

# Create your models here.
