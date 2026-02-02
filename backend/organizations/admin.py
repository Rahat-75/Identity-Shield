from django.contrib import admin
from .models import Organization, OrgUser


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin configuration for Organization."""
    
    list_display = ['name', 'org_type', 'registration_number', 'is_active', 'created_at']
    list_filter = ['org_type', 'is_active', 'created_at']
    search_fields = ['name', 'registration_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OrgUser)
class OrgUserAdmin(admin.ModelAdmin):
    """Admin configuration for OrgUser."""
    
    list_display = ['user', 'organization', 'role', 'created_at']
    list_filter = ['role', 'organization', 'created_at']
    search_fields = ['user__email', 'organization__name']
    readonly_fields = ['created_at']
