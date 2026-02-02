import time
import cloudinary.uploader
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import UploadAsset
from .serializers import UploadAssetSerializer, CloudinarySignatureRequestSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def handle_file_upload(request):
    """
    Handle direct file upload from frontend and save to Cloudinary.
    
    POST /api/v1/uploads/upload
    Form Data:
      file: <file_object>
      folder: (optional) "enrollments/user_123"
    """
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file size (e.g., max 10MB)
    if file_obj.size > 10 * 1024 * 1024:
        return Response({'error': 'File too large (max 10MB)'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Determine folder
        folder = request.data.get('folder', f'user_{request.user.id}')
        
        # Upload to Cloudinary using Python SDK
        upload_result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="auto"
        )
        
        # Save metadata to database
        serializer = UploadAssetSerializer(data={
            'public_id': upload_result.get('public_id'),
            'secure_url': upload_result.get('secure_url'),
            'resource_type': upload_result.get('resource_type'),
            'format': upload_result.get('format'),
            'bytes': upload_result.get('bytes'),
            'checksum': upload_result.get('etag')  # etag is effectively the checksum
        })
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': {
                'code': 'UPLOAD_FAILED',
                'message': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_uploads(request):
    """
    List user's uploads.
    
    GET /api/v1/uploads
    """
    uploads = UploadAsset.objects.filter(user=request.user)
    serializer = UploadAssetSerializer(uploads, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_upload(request, upload_id):
    """
    Get specific upload.
    
    GET /api/v1/uploads/{id}
    """
    try:
        upload = UploadAsset.objects.get(id=upload_id)
    except UploadAsset.DoesNotExist:
        return Response({
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Upload not found'
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if upload.user != request.user and request.user.role != 'ADMIN':
        return Response({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': 'You can only view your own uploads'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = UploadAssetSerializer(upload)
    return Response(serializer.data)
