from rest_framework import serializers
from .models import ConsentGrant
from organizations.serializers import OrganizationSerializer

class ConsentGrantSerializer(serializers.ModelSerializer):
    """Serializer for ConsentGrant."""
    
    organization = OrganizationSerializer(read_only=True)
    organization_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ConsentGrant
        fields = ['id', 'citizen', 'organization', 'organization_id', 'scopes', 'granted_at', 'is_active']
        read_only_fields = ['id', 'citizen', 'granted_at', 'is_active']

class ConsentCreateSerializer(serializers.Serializer):
    """Serializer for creating consent."""
    organization_id = serializers.IntegerField()
    scopes = serializers.ListField(child=serializers.CharField())
    
    def validate_scopes(self, value):
        valid_scopes = ['name_match', 'age_over_18', 'phone_verified', 'residency_district']
        for scope in value:
            if scope not in valid_scopes:
                raise serializers.ValidationError(f"Invalid scope: {scope}")
        return value
