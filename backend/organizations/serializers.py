from rest_framework import serializers
from .models import Organization, OrgUser
from accounts.models import User


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization."""
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'org_type', 'registration_number', 'contact_email', 'approval_status', 'is_active', 'created_at']
        read_only_fields = ['id', 'approval_status', 'created_at']


class OrgUserSerializer(serializers.ModelSerializer):
    """Serializer for OrgUser."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = OrgUser
        fields = ['id', 'user', 'user_email', 'organization', 'organization_name', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrganizationRegistrationSerializer(serializers.Serializer):
    """Serializer for organization self-registration."""
    
    # Organization fields
    name = serializers.CharField(max_length=255)
    org_type = serializers.ChoiceField(choices=[
        ('FINANCIAL', 'Financial Institution'),
        ('HEALTHCARE', 'Healthcare Provider'),
        ('TELECOM', 'Telecommunications'),
        ('GOVERNMENT', 'Government Agency'),
        ('RETAIL', 'Retail/E-commerce'),
        ('OTHER', 'Other'),
    ])
    registration_number = serializers.CharField(max_length=100)
    contact_email = serializers.EmailField()
    
    # User credentials
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validate registration data."""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        
        # Check if organization already exists
        if Organization.objects.filter(registration_number=data['registration_number']).exists():
            raise serializers.ValidationError("Organization with this registration number already exists")
            
        # Check if email already exists
        if User.objects.filter(email=data['contact_email']).exists():
            raise serializers.ValidationError("User with this email already exists")
        
        return data
