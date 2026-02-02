import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class AliasIdentifier(models.Model):
    """
    Alias ID for privacy-preserving identification.
    - GLOBAL: One per citizen, public-facing
    - PAIRWISE: Different alias per organization (prevents tracking)
    """
    
    ALIAS_TYPE_CHOICES = [
        ('GLOBAL', 'Global Alias'),
        ('PAIRWISE', 'Pairwise Alias'),
    ]
    
    citizen = models.ForeignKey(
        'identity.CitizenProfile',
        on_delete=models.CASCADE,
        related_name='aliases'
    )
    alias_type = models.CharField(max_length=20, choices=ALIAS_TYPE_CHOICES)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='pairwise_aliases',
        help_text="Required for pairwise aliases"
    )
    alias_id = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    rotated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'alias_identifiers'
        verbose_name = 'Alias Identifier'
        verbose_name_plural = 'Alias Identifiers'
        unique_together = ['citizen', 'alias_type', 'organization']
    
    def __str__(self):
        return f"{self.alias_id} ({self.get_alias_type_display()})"
    
    @staticmethod
    def generate_alias_id(prefix="ALIAS"):
        """Generate unique alias ID."""
        return f"{prefix}-{uuid.uuid4().hex[:12].upper()}"


class VerificationRequest(models.Model):
    """
    Verification request from organization to citizen.
    Citizen must approve before token is issued.
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('DENIED', 'Denied'),
        ('EXPIRED', 'Expired'),
    ]
    
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='verification_requests'
    )
    citizen = models.ForeignKey(
        'identity.CitizenProfile',
        on_delete=models.CASCADE,
        related_name='verification_requests'
    )
    requested_scopes = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'verification_requests'
        verbose_name = 'Verification Request'
        verbose_name_plural = 'Verification Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Request #{self.id} - {self.organization.name} → {self.citizen.full_name}"
    
    @property
    def is_expired(self):
        """Check if request has expired."""
        return timezone.now() > self.expires_at


class VerificationEvent(models.Model):
    """
    Completed verification event (audit log).
    Records what was disclosed and when.
    """
    
    request = models.ForeignKey(
        VerificationRequest,
        on_delete=models.CASCADE,
        related_name='events'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='verification_events'
    )
    citizen = models.ForeignKey(
        'identity.CitizenProfile',
        on_delete=models.CASCADE,
        related_name='verification_events'
    )
    token_jti = models.CharField(max_length=255, unique=True, db_index=True)
    scopes_disclosed = models.JSONField()
    verified_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'verification_events'
        verbose_name = 'Verification Event'
        verbose_name_plural = 'Verification Events'
        ordering = ['-verified_at']
    
    def __str__(self):
        return f"Verification #{self.id} - {self.organization.name} @ {self.verified_at}"


class VerificationHistory(models.Model):
    """
    Simple log of instant verifications.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='verification_history'
    )
    citizen = models.ForeignKey(
        'identity.CitizenProfile',
        on_delete=models.CASCADE,
        related_name='verification_history'
    )
    verified_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='SUCCESS')
    data_accessed = models.JSONField(default=dict)

    class Meta:
        db_table = 'verification_history'
        ordering = ['-verified_at']

    def __str__(self):
        return f"{self.organization} verified {self.citizen} at {self.verified_at}"
