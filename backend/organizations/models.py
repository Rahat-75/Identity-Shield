from django.db import models
from django.conf import settings


class Organization(models.Model):
    """
    Verifier organization (banks, telecoms, etc.).
    Organizations can request identity verification.
    """
    
    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    name = models.CharField(max_length=255)
    org_type = models.CharField(max_length=100, help_text="e.g., Bank, Telecom, Government")
    registration_number = models.CharField(max_length=100, unique=True)
    contact_email = models.EmailField(null=True, blank=True)
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='PENDING'
    )
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.org_type})"


class OrgUser(models.Model):
    """
    Organization user - links User to Organization.
    Org users can create verification requests.
    """
    
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('VERIFIER', 'Verifier'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='org_user'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users'
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='VERIFIER')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'org_users'
        verbose_name = 'Organization User'
        verbose_name_plural = 'Organization Users'
    
    def __str__(self):
        return f"{self.user.email} @ {self.organization.name}"
