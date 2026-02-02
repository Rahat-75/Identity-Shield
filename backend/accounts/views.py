from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .utils import send_verification_email


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user.
    
    POST /api/v1/auth/register
    {
        "email": "user@example.com",
        "phone": "+8801712345678",
        "password": "SecurePass123!",
        "password_confirm": "SecurePass123!",
        "role": "CITIZEN"
    }
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send verification email
        send_verification_email(user)
        
        return Response({
            'message': 'Account created. Please check your email for verification.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login user and return JWT tokens.
    
    POST /api/v1/auth/login
    {
        "email": "user@example.com",
        "password": "SecurePass123!"
    }
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(email=email, password=password)
        
        if user is None:
            return Response({
                'error': {
                    'code': 'INVALID_CREDENTIALS',
                    'message': 'Email or password is incorrect',
                    'field': 'email'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'error': {
                    'code': 'ACCOUNT_DISABLED',
                    'message': 'This account has been disabled',
                    'field': 'email'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        if not user.is_email_verified:
            return Response({
                'error': {
                    'code': 'EMAIL_NOT_VERIFIED',
                    'message': 'Please verify your email address before logging in.',
                    'field': 'email'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'user': UserSerializer(user).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user.
    
    GET /api/v1/auth/me
    """
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Logout user (client should delete tokens).
    
    POST /api/v1/auth/logout
    """
    return Response({
        'message': 'Successfully logged out'
    })


@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify email via token.
    
    POST /api/v1/auth/verify-email
    {
        "token": "uuid-token"
    }
    """
    token_str = request.data.get('token') or request.query_params.get('token')
    
    if not token_str:
        return Response({
            'error': 'Token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    from .models import EmailVerificationToken
    try:
        token_obj = EmailVerificationToken.objects.get(token=token_str)
    except (EmailVerificationToken.DoesNotExist, ValueError):
        return Response({
            'error': 'Invalid verification token'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    if token_obj.is_expired():
        return Response({
            'error': 'Verification link has expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    # Verify User
    user = token_obj.user
    user.is_email_verified = True
    user.save()
    
    # Delete token after use
    token_obj.delete()
    
    return Response({
        'message': 'Email verified successfully! You can now log in.'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    """
    Resend verification email.
    
    POST /api/v1/auth/resend-verification
    {
        "email": "user@example.com"
    }
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't leak existence of user for security? 
        # But for UX "If an account exists, email sent" is better.
        return Response({'message': 'If an account exists with this email, a verification link has been sent.'})
        
    if user.is_email_verified:
        return Response({'message': 'This email is already verified. Please log in.'})
        
    send_verification_email(user)
    
    return Response({
        'message': 'New verification link has been sent to your email.'
    })
