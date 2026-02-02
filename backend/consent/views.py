from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ConsentGrant
from identity.models import CitizenProfile
from organizations.models import Organization
from .serializers import ConsentGrantSerializer, ConsentCreateSerializer
from django.utils import timezone

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_grants(request):
    """
    Manage consent grants.
    
    GET /api/v1/consent/grants
    - List active grants
    
    POST /api/v1/consent/grants
    - Grant new consent
    """
    if request.user.role != 'CITIZEN':
         return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only citizens can manage consents'
            }
        }, status=status.HTTP_403_FORBIDDEN)
        
    citizen = request.user.citizen_profile

    # HANDLE GET
    if request.method == 'GET':
        grants = ConsentGrant.objects.filter(citizen=citizen, is_active=True).order_by('-granted_at')
        return Response(ConsentGrantSerializer(grants, many=True).data)

    # HANDLE POST
    serializer = ConsentCreateSerializer(data=request.data)
    if serializer.is_valid():
        org_id = serializer.validated_data['organization_id']
        scopes = serializer.validated_data['scopes']
        
        try:
            organization = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Update existing or create new
        grant, created = ConsentGrant.objects.update_or_create(
            citizen=citizen,
            organization=organization,
            defaults={
                'scopes': scopes,
                'is_active': True,
                'revoked_at': None,
                'granted_at': timezone.now() # Update timestamp if re-granting
            }
        )
        
        return Response(ConsentGrantSerializer(grant).data, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_consent(request, grant_id):
    """
    Revoke a consent grant.
    
    POST /api/v1/consent/grants/{id}/revoke
    """
    try:
        citizen = request.user.citizen_profile
        grant = ConsentGrant.objects.get(id=grant_id, citizen=citizen)
        grant.revoke()
        return Response({'status': 'revoked'})
    except (CitizenProfile.DoesNotExist, ConsentGrant.DoesNotExist):
        return Response({'error': 'Grant not found'}, status=status.HTTP_404_NOT_FOUND)
