from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/enrollment/', include('identity.urls')),
    path('api/v1/uploads/', include('uploads.urls')),
    path('api/v1/organizations/', include('organizations.urls')),
    path('api/v1/credentials/', include('credentials.urls')),
    path('api/v1/consent/', include('consent.urls')),
]
