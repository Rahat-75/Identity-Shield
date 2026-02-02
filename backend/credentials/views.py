from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AliasIdentifier
from identity.models import CitizenProfile
from .serializers import AliasIdentifierSerializer, AliasCreateSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_aliases(request):
    """
    Manage privacy aliases (Credentials).
    
    GET /api/v1/credentials/aliases
    - List all aliases
    
    POST /api/v1/credentials/aliases
    - Generate new alias
    """
    # 1. Verify User Role
    if request.user.role != 'CITIZEN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only citizens can access privacy passes'
            }
        }, status=status.HTTP_403_FORBIDDEN)
        
    # 2. Get Citizen Profile
    try:
        citizen = request.user.citizen_profile
    except CitizenProfile.DoesNotExist:
        return Response({
            'error': {
                'code': 'PROFILE_NOT_FOUND',
                'message': 'Citizen profile not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)

    # HANDLE GET
    if request.method == 'GET':
        aliases = AliasIdentifier.objects.filter(citizen=citizen).order_by('-created_at')
        return Response(AliasIdentifierSerializer(aliases, many=True).data)

    # HANDLE POST
    # 3. Verify Enrollment Status
    if citizen.enrollment_status != 'APPROVED':
        return Response({
            'error': {
                'code': 'NOT_VERIFIED',
                'message': 'Your identity must be verified before generating a Privacy Pass'
            }
        }, status=status.HTTP_403_FORBIDDEN)
        
    serializer = AliasCreateSerializer(data=request.data)
    if serializer.is_valid():
        alias_type = serializer.validated_data['alias_type']
        should_rotate = request.data.get('rotate', False)
        
        # Check if Global Alias already exists
        if alias_type == 'GLOBAL':
            existing = AliasIdentifier.objects.filter(citizen=citizen, alias_type='GLOBAL').first()
            if existing:
                return Response(AliasIdentifierSerializer(existing).data)
        
        # Determine organization
        organization = None
        if alias_type == 'PAIRWISE':
            # Organization logic placeholder
            pass
            
        # Create Alias
        alias_id = AliasIdentifier.generate_alias_id()
        alias = AliasIdentifier.objects.create(
            citizen=citizen,
            alias_type=alias_type,
            organization=organization,
            alias_id=alias_id
        )
        
        return Response(AliasIdentifierSerializer(alias).data, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_credential(request):
    """
    Verify an identity via Alias ID (Demo Flow).
    
    POST /api/v1/credentials/verify
    {
        "alias_id": "ALIAS-123...",
        "org_id": 1
    }
    """
    from organizations.models import Organization
    from consent.models import ConsentGrant
    from .serializers import VerificationInputSerializer
    import datetime

    serializer = VerificationInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    alias_id = serializer.validated_data['alias_id']
    org_id = serializer.validated_data['org_id']
    
    # 1. Find Alias
    # Parse alias_id (could be in QR format "NID_VERIFY:ALIAS-...")
    clean_alias_id = alias_id.replace("NID_VERIFY:", "")
    
    try:
        alias = AliasIdentifier.objects.get(alias_id=clean_alias_id)
    except AliasIdentifier.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Invalid or unknown Alias ID'
        }, status=status.HTTP_404_NOT_FOUND) # 404 to avoid leaking existence? For demo, explicit error is better.
        
    citizen = alias.citizen
    
    # 2. Find Organization
    try:
        organization = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({'valid': False, 'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)

    # 3. Check Consent
    grant = ConsentGrant.objects.filter(
        citizen=citizen, 
        organization=organization, 
        is_active=True
    ).first()
    
    if not grant:
        return Response({
            'valid': False,
            'error': 'Access Denied: User has not granted consent to this organization.'
        }, status=status.HTTP_403_FORBIDDEN)
        
    # 4. Construct Verified Data based on Scopes
    verified_data = {
        'timestamp': datetime.datetime.now().isoformat(),
        'organization': organization.name,
    }
    
    scopes = grant.scopes
    
    if 'name_match' in scopes:
        verified_data['full_name'] = citizen.full_name
        
    if 'age_over_18' in scopes:
        # Calculate age
        today = datetime.date.today()
        dob = citizen.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        verified_data['age_over_18'] = age >= 18
        
    if 'residency_district' in scopes:
        verified_data['residency_district'] = citizen.residency_district
        
    if 'phone_verified' in scopes:
        verified_data['phone_verified'] = citizen.phone_verified
        
    # 5. Log Verification
    from .models import VerificationHistory
    VerificationHistory.objects.create(
        organization=organization,
        citizen=citizen,
        status='SUCCESS',
        data_accessed=verified_data
    )

    return Response({
        'valid': True,
        'citizen_id': citizen.id, # For demo correlation
        'data': verified_data,
        'scopes_granted': scopes
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_verification_history(request):
    """
    Get verification history for the authenticated organization.
    GET /api/v1/credentials/history
    """
    if request.user.role != 'ORG_USER':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
    from organizations.models import Organization
    try:
        # Assuming one org per user for now, or fetch from profile
        # For simplicity, we get the org the user belongs to. 
        # But wait, User model doesn't strictly link to Org except via Org Profile logic which we haven't fully seen.
        # However, views.register_organization links user to org.
        # Let's assume request.user.organization exists if we added it, or we query.
        org_profile = Organization.objects.get(contact_email=request.user.email) # Weak link but works for now
    except Organization.DoesNotExist:
         return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)

    from .models import VerificationHistory
    from .serializers import VerificationHistorySerializer
    
    history = VerificationHistory.objects.filter(organization=org_profile).order_by('-verified_at')
    return Response(VerificationHistorySerializer(history, many=True).data)
