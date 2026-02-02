from django.db import models
from django.conf import settings


class ConsentGrant(models.Model):
    """
    Consent grant from citizen to organization.
    Defines what data scopes the organization can access.
    """
    
    citizen = models.ForeignKey(
        'identity.CitizenProfile',
        on_delete=models.CASCADE,
        related_name='consent_grants'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='consent_grants'
    )
    scopes = models.JSONField(
        help_text="List of allowed scopes: name_match, age_over_18, phone_verified, residency_district"
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'consent_grants'
        verbose_name = 'Consent Grant'
        verbose_name_plural = 'Consent Grants'
        unique_together = ['citizen', 'organization']
        ordering = ['-granted_at']
    
    def __str__(self):
        status = "Active" if self.is_active else "Revoked"
        return f"{self.citizen.full_name} → {self.organization.name} ({status})"
    
    def revoke(self):
        """Revoke consent."""
        from django.utils import timezone
        self.is_active = False
        self.revoked_at = timezone.now()
        self.save()
    
    def has_scope(self, scope):
        """Check if consent includes a specific scope."""
        return self.is_active and scope in self.scopes
