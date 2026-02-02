from django.urls import path
from . import views

urlpatterns = [
    path('aliases', views.manage_aliases, name='manage-aliases'),
    path('verify', views.verify_credential, name='verify-credential'),
    path('history', views.get_verification_history, name='verification-history'),
]
