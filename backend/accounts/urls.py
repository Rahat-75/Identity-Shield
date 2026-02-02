from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register', views.register, name='register'),
    path('login', views.login, name='login'),
    path('me', views.get_current_user, name='current-user'),
    path('logout', views.logout, name='logout'),
    path('refresh', TokenRefreshView.as_view(), name='token-refresh'),
    path('verify-email', views.verify_email, name='verify-email'),
    path('resend-verification', views.resend_verification, name='resend-verification'),
]
