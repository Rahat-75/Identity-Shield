from django.urls import path
from . import views

urlpatterns = [
    path('upload', views.handle_file_upload, name='upload-file'),
    path('', views.list_uploads, name='list-uploads'),
    path('<int:upload_id>', views.get_upload, name='get-upload'),
]
