import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import EmailVerificationToken

logger = logging.getLogger(__name__)

def send_verification_email(user):
    """
    Send verification email to user with token link.
    """
    try:
        # 1. Create token
        token_obj, created = EmailVerificationToken.objects.get_or_create(user=user)
        if not created:
             # Refresh token if already exists or reuse? 
             # Let's refresh by creating new one if we want rotation, but for now reuse or update.
             # Actually, if user requests a resend, we might want to rotate.
             # For initial signup, create is fine.
             pass
        
        # 2. Construct link
        # Frontend URL mapping to verification handler
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token_obj.token}"
        
        # 3. Email Content
        subject = 'Verify Your Identity Shield Account'
        message = f'Welcome! Please verify your email by clicking the link below:\n\n{verification_link}\n\nThis link will expire in {getattr(settings, "VERIFICATION_TOKEN_EXPIRY", 60)} minutes.'
        
        # In a real app, use HTML templates
        html_message = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
            <h2 style="color: #2563eb;">Identity Shield</h2>
            <p>Welcome! Thank you for joining our privacy-preserving identity platform.</p>
            <p>Please verify your email address to activate your account:</p>
            <a href="{verification_link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                Verify Email Address
            </a>
            <p style="color: #64748b; font-size: 14px;">
                Alternatively, copy and paste this link in your browser: <br/>
                {verification_link}
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">
                This link will expire in {getattr(settings, "VERIFICATION_TOKEN_EXPIRY", 60)} minutes. 
                If you did not create an account, please ignore this email.
            </p>
        </div>
        """
        
        # 4. Send email
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message
        )
        logger.info(f"Verification email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False
