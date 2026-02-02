from django.urls import path
from . import views

urlpatterns = [
    path('grants', views.manage_grants, name='manage-grants'),
    path('grants/<int:grant_id>/revoke', views.revoke_consent, name='revoke-consent'),
]
