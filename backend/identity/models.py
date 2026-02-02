import hashlib
from django.db import models
from django.conf import settings


def hash_nid(nid_number):
    """Hash NID number with salt for secure storage."""
    salt = settings.NID_HASH_SALT
    return hashlib.sha256(f"{nid_number}{salt}".encode()).hexdigest()


class CitizenProfile(models.Model):
    """
    Citizen profile with identity information.
    NID number is hashed and never exposed via APIs.
    """
    
    ENROLLMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending Enrollment'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='citizen_profile'
    )
    full_name = models.CharField(max_length=255)
    nid_number_hash = models.CharField(max_length=255, unique=True, db_index=True)
    date_of_birth = models.DateField()
    phone_verified = models.BooleanField(default=False)
    residency_district = models.CharField(max_length=100)
    enrollment_status = models.CharField(
        max_length=20,
        choices=ENROLLMENT_STATUS_CHOICES,
        default='PENDING'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'citizen_profiles'
        verbose_name = 'Citizen Profile'
        verbose_name_plural = 'Citizen Profiles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} - {self.get_enrollment_status_display()}"
    
    def set_nid(self, nid_number):
        """Hash and store NID number."""
        self.nid_number_hash = hash_nid(nid_number)
    
    def verify_nid(self, nid_number):
        """Verify NID number against stored hash."""
        return self.nid_number_hash == hash_nid(nid_number)
    
    @property
    def is_approved(self):
        """Check if citizen is approved."""
        return self.enrollment_status == 'APPROVED'


class EnrollmentCase(models.Model):
    """
    Enrollment case for citizen identity verification.
    Admin reviews and approves/rejects cases.
    """
    
    STATUS_CHOICES = [
        ('PENDING_REVIEW', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    citizen = models.ForeignKey(
        CitizenProfile,
        on_delete=models.CASCADE,
        related_name='enrollment_cases'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING_REVIEW'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_cases'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'enrollment_cases'
        verbose_name = 'Enrollment Case'
        verbose_name_plural = 'Enrollment Cases'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"Case #{self.id} - {self.citizen.full_name} ({self.get_status_display()})"


class EnrollmentDocument(models.Model):
    """
    Documents uploaded for enrollment case.
    Links to Cloudinary assets.
    """
    
    DOCUMENT_TYPE_CHOICES = [
        ('NID_FRONT', 'NID Front'),
        ('NID_BACK', 'NID Back'),
        ('SELFIE', 'Selfie'),
        ('PROOF', 'Proof Document'),
    ]
    
    case = models.ForeignKey(
        EnrollmentCase,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    upload_asset = models.ForeignKey(
        'uploads.UploadAsset',
        on_delete=models.PROTECT,
        related_name='enrollment_documents'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'enrollment_documents'
        verbose_name = 'Enrollment Document'
        verbose_name_plural = 'Enrollment Documents'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.get_document_type_display()} for {self.case.citizen.full_name}"


