from django.contrib import admin
from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    """Admin configuration for AuditEvent (read-only)."""
    
    list_display = ['id', 'event_type', 'actor', 'target_user', 'organization', 'created_at']
    list_filter = ['event_type', 'created_at']
    search_fields = ['actor__email', 'target_user__email', 'organization__name']
    readonly_fields = ['event_type', 'actor', 'target_user', 'organization', 'metadata', 'ip_address', 'user_agent', 'created_at']
    
    def has_add_permission(self, request):
        """Prevent manual creation of audit events."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent editing of audit events."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of audit events."""
        return False
