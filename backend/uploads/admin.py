from django.contrib import admin
from .models import UploadAsset


@admin.register(UploadAsset)
class UploadAssetAdmin(admin.ModelAdmin):
    """Admin configuration for UploadAsset."""
    
    list_display = ['public_id', 'user', 'resource_type', 'format', 'size_mb', 'created_at']
    list_filter = ['resource_type', 'format', 'created_at']
    search_fields = ['public_id', 'user__email']
    readonly_fields = ['created_at', 'size_mb']
    
    def size_mb(self, obj):
        """Display file size in MB."""
        return f"{obj.size_mb} MB"
    size_mb.short_description = 'Size'
