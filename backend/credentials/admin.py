from django.contrib import admin
from .models import AliasIdentifier, VerificationRequest, VerificationEvent


@admin.register(AliasIdentifier)
class AliasIdentifierAdmin(admin.ModelAdmin):
    """Admin configuration for AliasIdentifier."""
    
    list_display = ['alias_id', 'citizen', 'alias_type', 'organization', 'created_at', 'rotated_at']
    list_filter = ['alias_type', 'created_at', 'rotated_at']
    search_fields = ['alias_id', 'citizen__full_name']
    readonly_fields = ['created_at', 'rotated_at']


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    """Admin configuration for VerificationRequest."""
    
    list_display = ['id', 'organization', 'citizen', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'created_at', 'expires_at']
    search_fields = ['organization__name', 'citizen__full_name']
    readonly_fields = ['created_at', 'approved_at']


@admin.register(VerificationEvent)
class VerificationEventAdmin(admin.ModelAdmin):
    """Admin configuration for VerificationEvent."""
    
    list_display = ['id', 'organization', 'citizen', 'verified_at', 'ip_address']
    list_filter = ['verified_at']
    search_fields = ['organization__name', 'citizen__full_name', 'token_jti']
    readonly_fields = ['request', 'organization', 'citizen', 'token_jti', 'scopes_disclosed', 'verified_at', 'ip_address', 'user_agent']
    
    def has_add_permission(self, request):
        """Prevent manual creation of verification events."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent editing of verification events."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of verification events."""
        return False
