from django.db import models
from django.conf import settings


class UploadAsset(models.Model):
    """
    Cloudinary upload asset metadata.
    Stores references to files uploaded to Cloudinary.
    """
    
    RESOURCE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('raw', 'Raw File'),
        ('video', 'Video'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploads'
    )
    public_id = models.CharField(max_length=255, unique=True)
    secure_url = models.URLField(max_length=500)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPE_CHOICES)
    format = models.CharField(max_length=10)
    bytes = models.IntegerField(help_text="File size in bytes")
    checksum = models.CharField(max_length=64, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'upload_assets'
        verbose_name = 'Upload Asset'
        verbose_name_plural = 'Upload Assets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.public_id} ({self.format})"
    
    @property
    def size_mb(self):
        """Get file size in MB."""
        return round(self.bytes / (1024 * 1024), 2)
