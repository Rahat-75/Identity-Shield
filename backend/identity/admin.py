from django.contrib import admin
from .models import CitizenProfile, EnrollmentCase, EnrollmentDocument


@admin.register(CitizenProfile)
class CitizenProfileAdmin(admin.ModelAdmin):
    """Admin configuration for CitizenProfile."""
    
    list_display = ['full_name', 'user', 'enrollment_status', 'phone_verified', 'residency_district', 'created_at']
    list_filter = ['enrollment_status', 'phone_verified', 'residency_district', 'created_at']
    search_fields = ['full_name', 'user__email', 'nid_number_hash']
    readonly_fields = ['nid_number_hash', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User Info', {'fields': ('user', 'full_name')}),
        ('Identity', {'fields': ('nid_number_hash', 'date_of_birth', 'residency_district')}),
        ('Status', {'fields': ('enrollment_status', 'phone_verified')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(EnrollmentCase)
class EnrollmentCaseAdmin(admin.ModelAdmin):
    """Admin configuration for EnrollmentCase."""
    
    list_display = ['id', 'citizen', 'status', 'submitted_at', 'reviewed_by', 'reviewed_at']
    list_filter = ['status', 'submitted_at', 'reviewed_at']
    search_fields = ['citizen__full_name', 'citizen__user__email', 'admin_notes']
    readonly_fields = ['submitted_at']
    
    fieldsets = (
        ('Case Info', {'fields': ('citizen', 'status')}),
        ('Review', {'fields': ('reviewed_by', 'reviewed_at', 'admin_notes')}),
        ('Timestamps', {'fields': ('submitted_at',)}),
    )


@admin.register(EnrollmentDocument)
class EnrollmentDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for EnrollmentDocument."""
    
    list_display = ['id', 'case', 'document_type', 'upload_asset', 'uploaded_at']
    list_filter = ['document_type', 'uploaded_at']
    search_fields = ['case__citizen__full_name']
    readonly_fields = ['uploaded_at']
