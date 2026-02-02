from rest_framework import serializers
from .models import AliasIdentifier

class AliasIdentifierSerializer(serializers.ModelSerializer):
    """Serializer for AliasIdentifier."""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = AliasIdentifier
        fields = ['id', 'alias_type', 'alias_id', 'organization', 'organization_name', 'created_at']
        read_only_fields = ['id', 'alias_id', 'created_at']
        
    def validate(self, data):
        """
        Validate alias creation.
        """
        if data.get('alias_type') == 'PAIRWISE' and not data.get('organization'):
            raise serializers.ValidationError("Organization is required for PAIRWISE alias.")
            
        if data.get('alias_type') == 'GLOBAL' and data.get('organization'):
            raise serializers.ValidationError("Organization cannot be set for GLOBAL alias.")
            
        return data

class AliasCreateSerializer(serializers.Serializer):
    """Serializer for creating an alias."""
    alias_type = serializers.ChoiceField(choices=['GLOBAL', 'PAIRWISE'])
    organization_id = serializers.IntegerField(required=False)

class VerificationInputSerializer(serializers.Serializer):
    """Serializer for verifying an identity."""
    alias_id = serializers.CharField()
    org_id = serializers.IntegerField()
    # In real world, org_id would come from the authenticated org user, 
    # but for demo we allow passing it to simulate different orgs.

class VerificationHistorySerializer(serializers.ModelSerializer):
    """Serializer for verification history."""
    citizen_name = serializers.CharField(source='citizen.full_name', read_only=True)
    
    class Meta:
        from .models import VerificationHistory # Local import to avoid circular dependency if any
        model = VerificationHistory
        fields = ['id', 'verified_at', 'status', 'data_accessed', 'citizen_name', 'citizen_id']
