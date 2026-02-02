from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_organizations, name='list-organizations'),
    path('register', views.register_organization, name='register-organization'),
    path('dashboard', views.get_org_dashboard, name='org-dashboard'),
    path('<int:org_id>', views.get_organization, name='get-organization'),
    path('<int:org_id>/approve', views.approve_organization, name='approve-organization'),
    path('<int:org_id>/users', views.list_org_users, name='list-org-users'),
    path('<int:org_id>/users/add', views.add_org_user, name='add-org-user'),
]
