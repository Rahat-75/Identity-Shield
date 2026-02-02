import os
import django
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from credentials.models import AliasIdentifier

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()
client = APIClient()

# Get the admin user we created
user = User.objects.get(email='admin@gmail.com')

# Wait, the view requires CITIZEN role
# Let's change his role for testing or use a citizen user
user.role = 'CITIZEN'
user.save()

# We need a citizen profile too
from identity.models import CitizenProfile
profile, _ = CitizenProfile.objects.get_or_create(
    user=user,
    defaults={
        'full_name': 'Test Admin',
        'date_of_birth': '1990-01-01',
        'residency_district': 'Dhaka',
        'enrollment_status': 'APPROVED'
    }
)
profile.enrollment_status = 'APPROVED'
profile.set_nid('1234567890')
profile.save()

client.force_authenticate(user=user)

print("Testing POST /api/v1/credentials/aliases...")
try:
    response = client.post('/api/v1/credentials/aliases', {'alias_type': 'GLOBAL'}, format='json')
    print(f"Status: {response.status_code}")
    print(f"Content: {response.content}")
except Exception as e:
    import traceback
    print("Caught Exception:")
    traceback.print_exc()
