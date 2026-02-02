from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from .models import CitizenProfile, EnrollmentCase, EnrollmentDocument
from .serializers import (
    CitizenProfileSerializer,
    EnrollmentCaseCreateSerializer,
    EnrollmentCaseSerializer,
    EnrollmentReviewSerializer,
    EnrollmentDocumentSerializer
)
import os
import requests
import tempfile


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_enrollment_case(request):
    """
    Create new enrollment case.
    
    POST /api/v1/enrollment/cases
    {
        "nid_number": "1234567890123",
        "full_name": "Ahmed Rahman",
        "date_of_birth": "1990-01-15",
        "residency_district": "Dhaka"
    }
    """
    if request.user.role != 'CITIZEN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only citizens can create enrollment cases'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = EnrollmentCaseCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        case = serializer.save()
        return Response(
            EnrollmentCaseSerializer(case).data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_enrollment_cases(request):
    """
    List enrollment cases.
    - Citizens see their own cases
    - Admins see all cases
    
    GET /api/v1/enrollment/cases
    """
    if request.user.role == 'ADMIN':
        cases = EnrollmentCase.objects.all()
    elif request.user.role == 'CITIZEN':
        try:
            citizen = request.user.citizen_profile
            cases = EnrollmentCase.objects.filter(citizen=citizen)
        except CitizenProfile.DoesNotExist:
            cases = EnrollmentCase.objects.none()
    else:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'You do not have permission to view enrollment cases'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = EnrollmentCaseSerializer(cases, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enrollment_case(request, case_id):
    """
    Get specific enrollment case.
    
    GET /api/v1/enrollment/cases/{id}
    """
    try:
        case = EnrollmentCase.objects.get(id=case_id)
    except EnrollmentCase.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Enrollment case not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if request.user.role == 'CITIZEN' and case.citizen.user != request.user:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'You can only view your own enrollment cases'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = EnrollmentCaseSerializer(case)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def review_enrollment_case(request, case_id):
    """
    Admin review of enrollment case.
    
    PATCH /api/v1/enrollment/cases/{id}/review
    {
        "status": "APPROVED",
        "admin_notes": "All documents verified"
    }
    """
    if request.user.role != 'ADMIN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only admins can review enrollment cases'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        case = EnrollmentCase.objects.get(id=case_id)
    except EnrollmentCase.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Enrollment case not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = EnrollmentReviewSerializer(data=request.data)
    if serializer.is_valid():
        case.status = serializer.validated_data['status']
        case.admin_notes = serializer.validated_data.get('admin_notes', '')
        case.reviewed_by = request.user
        case.reviewed_at = timezone.now()
        case.save()
        
        # Update citizen profile status
        case.citizen.enrollment_status = serializer.validated_data['status']
        case.citizen.save()
        
        return Response(EnrollmentCaseSerializer(case).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_enrollment_documents(request, case_id):
    """
    Manage enrollment documents.
    
    GET /api/v1/enrollment/cases/{id}/documents
    - List documents for case
    
    POST /api/v1/enrollment/cases/{id}/documents
    - Add new document
    """
    try:
        case = EnrollmentCase.objects.get(id=case_id)
    except EnrollmentCase.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Enrollment case not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if request.user.role == 'CITIZEN' and case.citizen.user != request.user:
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'You can only view/add documents for your own enrollment cases'
            }
        }, status=status.HTTP_403_FORBIDDEN)
        
    if request.user.role == 'ORG_USER':
         return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Organizations cannot view enrollment documents'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        documents = EnrollmentDocument.objects.filter(case=case)
        serializer = EnrollmentDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    # Handle POST
    serializer = EnrollmentDocumentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(case=case)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_stats(request):
    """
    Get statistics for the admin dashboard.
    GET /api/v1/enrollment/admin/stats
    """
    if request.user.role != 'ADMIN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'Only admins can view stats'
            }
        }, status=status.HTTP_403_FORBIDDEN)

    total_citizens = CitizenProfile.objects.count()
    pending_cases = EnrollmentCase.objects.filter(status='PENDING_REVIEW').count()
    approved_cases = EnrollmentCase.objects.filter(status='APPROVED').count()
    rejected_cases = EnrollmentCase.objects.filter(status='REJECTED').count()
    
    total_processed = approved_cases + rejected_cases
    approval_rate = 0
    if total_processed > 0:
        approval_rate = round((approved_cases / total_processed) * 100, 1)

    return Response({
        'total_citizens': total_citizens,
        'enrollment_stats': {
            'pending': pending_cases,
            'approved': approved_cases,
            'rejected': rejected_cases,
            'total': pending_cases + approved_cases + rejected_cases,
            'approval_rate': approval_rate
        },
        'system_status': 'Operational',
    })


