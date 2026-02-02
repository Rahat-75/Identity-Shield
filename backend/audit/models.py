from django.db import models
from django.conf import settings


class AuditEvent(models.Model):
    """
    Immutable audit event log.
    Records all significant system actions for compliance and security.
    """
    
    EVENT_TYPE_CHOICES = [
        # Enrollment events
        ('ENROLLMENT_SUBMITTED', 'Enrollment Submitted'),
        ('ENROLLMENT_APPROVED', 'Enrollment Approved'),
        ('ENROLLMENT_REJECTED', 'Enrollment Rejected'),
        
        # Consent events
        ('CONSENT_GRANTED', 'Consent Granted'),
        ('CONSENT_REVOKED', 'Consent Revoked'),
        
        # Verification events
        ('VERIFICATION_REQUESTED', 'Verification Requested'),
        ('VERIFICATION_APPROVED', 'Verification Approved'),
        ('VERIFICATION_DENIED', 'Verification Denied'),
        ('VERIFICATION_COMPLETED', 'Verification Completed'),
        
        # Alias events
        ('ALIAS_GENERATED', 'Alias Generated'),
        ('ALIAS_ROTATED', 'Alias Rotated'),
        
        # Security events
        ('LOGIN_SUCCESS', 'Login Success'),
        ('LOGIN_FAILED', 'Login Failed'),
        ('PASSWORD_CHANGED', 'Password Changed'),
        
        # Other
        ('OTHER', 'Other Event'),
    ]
    
    event_type = models.CharField(max_length=100, choices=EVENT_TYPE_CHOICES)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_actions'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_targets'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_events'
    )
    metadata = models.JSONField(default=dict, help_text="Event-specific data")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_events'
        verbose_name = 'Audit Event'
        verbose_name_plural = 'Audit Events'
        ordering = ['-created_at']
        permissions = [
            ('view_audit', 'Can view audit logs'),
        ]
    
    def __str__(self):
        actor_str = self.actor.email if self.actor else "System"
        return f"{self.get_event_type_display()} by {actor_str} @ {self.created_at}"
    
    def save(self, *args, **kwargs):
        """Override save to prevent updates after creation."""
        if self.pk:
            raise ValueError("Audit events are immutable and cannot be updated")
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Prevent deletion of audit events."""
        raise ValueError("Audit events cannot be deleted")
