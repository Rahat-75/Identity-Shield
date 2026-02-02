import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for email/phone authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model with email/phone authentication.
    Supports three roles: CITIZEN, ORG_USER, ADMIN.
    """
    
    ROLE_CHOICES = [
        ('CITIZEN', 'Citizen'),
        ('ORG_USER', 'Organization User'),
        ('ADMIN', 'Administrator'),
    ]
    
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CITIZEN')
    
    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def is_citizen(self):
        """Check if user is a citizen."""
        return self.role == 'CITIZEN'
    
    @property
    def is_org_user(self):
        """Check if user is an organization user."""
        return self.role == 'ORG_USER'
    
    @property
    def is_admin(self):
        """Check if user is an admin."""
        return self.role == 'ADMIN'


class EmailVerificationToken(models.Model):
    """Token for email verification."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_token')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        """Check if token is expired based on settings."""
        from django.conf import settings
        from django.utils import timezone
        expiry_minutes = getattr(settings, 'VERIFICATION_TOKEN_EXPIRY', 60)
        return timezone.now() > self.created_at + timezone.timedelta(minutes=expiry_minutes)

    class Meta:
        db_table = 'email_verification_tokens'
