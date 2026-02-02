from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Organization, OrgUser
from .serializers import OrganizationSerializer, OrgUserSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_organization(request):
    """
    Create new organization (admin only).
    
    POST /api/v1/organizations
    {
        "name": "Bangladesh Bank",
        "org_type": "Bank",
        "registration_number": "REG123456"
    }
    """
    if request.user.role != 'ADMIN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only admins can create organizations'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = OrganizationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_organizations(request):
    """
    List all active organizations.
    
    GET /api/v1/organizations
    """
    organizations = Organization.objects.filter(is_active=True)
    serializer = OrganizationSerializer(organizations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_organization(request, org_id):
    """
    Get specific organization.
    
    GET /api/v1/organizations/{id}
    """
    try:
        organization = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Organization not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = OrganizationSerializer(organization)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_org_user(request, org_id):
    """
    Add user to organization (admin only).
    
    POST /api/v1/organizations/{id}/users
    {
        "user": 5,
        "role": "VERIFIER"
    }
    """
    if request.user.role != 'ADMIN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only admins can add organization users'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        organization = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Organization not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    data = request.data.copy()
    data['organization'] = org_id
    
    serializer = OrgUserSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_org_users(request, org_id):
    """
    List organization users.
    
    GET /api/v1/organizations/{id}/users
    """
    try:
        organization = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Organization not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    users = OrgUser.objects.filter(organization=organization)
    serializer = OrgUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_organization(request):
    """
    Organization self-registration (public endpoint).
    
    POST /api/v1/organizations/register
    {
        "name": "City Bank",
        "org_type": "FINANCIAL",
        "registration_number": "BANK-001",
        "contact_email": "admin@citybank.com",
        "password": "securepass123",
        "confirm_password": "securepass123"
    }
    """
    from .serializers import OrganizationRegistrationSerializer
    from accounts.models import User
    from django.db import transaction
    
    serializer = OrganizationRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        with transaction.atomic():
            # Create User
            user = User.objects.create_user(
                email=data['contact_email'],
                password=data['password'],
                role='ORG_USER'
            )
            
            # Create Organization
            organization = Organization.objects.create(
                name=data['name'],
                org_type=data['org_type'],
                registration_number=data['registration_number'],
                contact_email=data['contact_email'],
                approval_status='PENDING'
            )
            
            # Link User to Organization
            OrgUser.objects.create(
                user=user,
                organization=organization,
                role='ADMIN'
            )
            
            # Send verification email
            from accounts.utils import send_verification_email
            send_verification_email(user)
            
            return Response({
                'message': 'Organization registered successfully. Please verify your email. Awaiting admin approval.',
                'organization_id': organization.id,
                'approval_status': 'PENDING'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_org_dashboard(request):
    """
    Get organization dashboard data.
    
    GET /api/v1/organizations/dashboard
    """
    if request.user.role != 'ORG_USER':
        return Response({
            'error': 'Only organization users can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        org_user = request.user.org_user
        organization = org_user.organization
        
        return Response({
            'organization': OrganizationSerializer(organization).data,
            'user_role': org_user.role,
            'is_approved': organization.approval_status == 'APPROVED'
        })
    except OrgUser.DoesNotExist:
        return Response({
            'error': 'Organization profile not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_organization(request, org_id):
    """
    Approve or reject organization (admin only).
    
    POST /api/v1/organizations/{id}/approve
    {
        "status": "APPROVED"  // or "REJECTED"
    }
    """
    if request.user.role != 'ADMIN':
        return Response({
            'error': 'Only admins can approve organizations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        organization = Organization.objects.get(id=org_id)
    except Organization.DoesNotExist:
        return Response({
            'error': 'Organization not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    if new_status not in ['APPROVED', 'REJECTED']:
        return Response({
            'error': 'Invalid status. Must be APPROVED or REJECTED'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    organization.approval_status = new_status
    organization.save()
    
    return Response({
        'message': f'Organization {new_status.lower()}',
        'organization': OrganizationSerializer(organization).data
    })



