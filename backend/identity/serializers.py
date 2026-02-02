from rest_framework import serializers
from .models import CitizenProfile, EnrollmentCase, EnrollmentDocument


class CitizenProfileSerializer(serializers.ModelSerializer):
    """Serializer for CitizenProfile."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = CitizenProfile
        fields = [
            'id', 'user', 'user_email', 'full_name', 'date_of_birth',
            'phone_verified', 'residency_district', 'enrollment_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'enrollment_status', 'created_at', 'updated_at']
        extra_kwargs = {
            'nid_number_hash': {'write_only': True}  # Never expose NID hash
        }


class EnrollmentCaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating enrollment case."""
    
    nid_number = serializers.CharField(write_only=True, max_length=20)
    full_name = serializers.CharField(max_length=255)
    date_of_birth = serializers.DateField()
    residency_district = serializers.CharField(max_length=100)
    
    class Meta:
        model = EnrollmentCase
        fields = ['nid_number', 'full_name', 'date_of_birth', 'residency_district']
    
    def create(self, validated_data):
        """Create citizen profile and enrollment case."""
        from django.db import IntegrityError
        from .models import hash_nid

        user = self.context['request'].user
        nid_number = validated_data.pop('nid_number')
        hashed_nid = hash_nid(nid_number)

        # Check if NID is already used by another user to give clear error
        if CitizenProfile.objects.filter(nid_number_hash=hashed_nid).exclude(user=user).exists():
            raise serializers.ValidationError({"nid_number": "This NID number is already registered."})
        
        try:
            # Create or update citizen profile with ALL fields including hash
            citizen, created = CitizenProfile.objects.update_or_create(
                user=user,
                defaults={
                    'full_name': validated_data['full_name'],
                    'date_of_birth': validated_data['date_of_birth'],
                    'residency_district': validated_data['residency_district'],
                    'nid_number_hash': hashed_nid
                }
            )
            
            # Create enrollment case
            case = EnrollmentCase.objects.create(citizen=citizen)
            return case

        except IntegrityError:
            raise serializers.ValidationError({"detail": "Database integrity error. Check if NID is unique."})


class EnrollmentCaseSerializer(serializers.ModelSerializer):
    """Serializer for EnrollmentCase."""
    
    citizen_name = serializers.CharField(source='citizen.full_name', read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)
    
    class Meta:
        model = EnrollmentCase
        fields = [
            'id', 'citizen', 'citizen_name', 'status', 'submitted_at',
            'reviewed_by', 'reviewed_by_email', 'reviewed_at', 'admin_notes'
        ]
        read_only_fields = ['id', 'citizen', 'submitted_at', 'reviewed_by', 'reviewed_at']


class EnrollmentReviewSerializer(serializers.Serializer):
    """Serializer for admin review of enrollment."""
    
    status = serializers.ChoiceField(choices=['APPROVED', 'REJECTED'])
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class EnrollmentDocumentSerializer(serializers.ModelSerializer):
    """Serializer for EnrollmentDocument."""
    
    file_url = serializers.CharField(source='upload_asset.secure_url', read_only=True)
    
    class Meta:
        model = EnrollmentDocument
        fields = ['id', 'case', 'document_type', 'upload_asset', 'file_url', 'uploaded_at']
        read_only_fields = ['id', 'case', 'uploaded_at', 'file_url']


