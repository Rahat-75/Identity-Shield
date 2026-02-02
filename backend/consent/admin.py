from django.contrib import admin
from .models import ConsentGrant


@admin.register(ConsentGrant)
class ConsentGrantAdmin(admin.ModelAdmin):
    """Admin configuration for ConsentGrant."""
    
    list_display = ['citizen', 'organization', 'is_active', 'granted_at', 'revoked_at']
    list_filter = ['is_active', 'granted_at', 'revoked_at']
    search_fields = ['citizen__full_name', 'organization__name']
    readonly_fields = ['granted_at', 'revoked_at']
    
    def get_readonly_fields(self, request, obj=None):
        """Make scopes readonly after creation."""
        if obj:  # Editing existing object
            return self.readonly_fields + ['citizen', 'organization', 'scopes']
        return self.readonly_fields
