from rest_framework import serializers
from .models import UploadAsset


class UploadAssetSerializer(serializers.ModelSerializer):
    """Serializer for UploadAsset."""
    
    class Meta:
        model = UploadAsset
        fields = [
            'id', 'user', 'public_id', 'secure_url', 'resource_type',
            'format', 'bytes', 'checksum', 'created_at', 'size_mb'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'size_mb']


class CloudinarySignatureRequestSerializer(serializers.Serializer):
    """Serializer for requesting Cloudinary upload signature."""
    
    upload_preset = serializers.CharField(max_length=100)
    folder = serializers.CharField(max_length=200, required=False)
