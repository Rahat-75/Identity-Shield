from django.urls import path
from . import views

urlpatterns = [
    path('cases', views.list_enrollment_cases, name='list-enrollment-cases'),
    path('cases/create', views.create_enrollment_case, name='create-enrollment-case'),
    path('cases/<int:case_id>', views.get_enrollment_case, name='get-enrollment-case'),
    path('admin/stats', views.get_admin_stats, name='get-admin-stats'),
    path('cases/<int:case_id>/review', views.review_enrollment_case, name='review-enrollment-case'),
    path('cases/<int:case_id>/documents', views.manage_enrollment_documents, name='manage-enrollment-documents'),
]
