# Identity Shield Backend

Django REST API for privacy-preserving identity verification system.

## Setup

1. Create virtual environment:

```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment:

```bash
copy .env.example .env
# Edit .env with your credentials
```

4. Run migrations:

```bash
python manage.py migrate
```

5. Create superuser:

```bash
python manage.py createsuperuser
```

6. Run development server:

```bash
python manage.py runserver
```

## Project Structure

```
backend/
├── config/              # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/            # User authentication
│   ├── models.py        # User model
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── identity/            # Citizen profiles & enrollment
│   ├── models.py        # CitizenProfile, EnrollmentCase
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── organizations/       # Verifier organizations
│   ├── models.py        # Organization, OrgUser
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── consent/             # Consent management
│   ├── models.py        # ConsentGrant
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── credentials/         # Aliases & verification
│   ├── models.py        # AliasIdentifier, VerificationRequest
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── uploads/             # Cloudinary integration
│   ├── models.py        # UploadAsset
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── audit/               # Audit trail
│   ├── models.py        # AuditEvent
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── manage.py
└── requirements.txt
```

## API Endpoints

Base URL: `http://localhost:8000/api/v1/`

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

### Enrollment

- `POST /enrollment/cases` - Create enrollment
- `GET /enrollment/cases` - List enrollments
- `PATCH /enrollment/cases/{id}/review` - Admin review

### Uploads

- `POST /uploads/signature` - Get Cloudinary signature
- `POST /uploads/register` - Register uploaded file

### Consent

- `POST /consent/grants` - Grant consent
- `DELETE /consent/grants/{id}` - Revoke consent
- `GET /consent/grants` - List consents

### Verification

- `POST /verification/requests` - Create request
- `POST /verification/approve` - Approve request
- `POST /verification/verify` - Verify token

### Audit

- `GET /audit/events` - List audit events

## Development

```bash
# Create new Django app
python manage.py startapp app_name

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Django shell
python manage.py shell

# Run tests
python manage.py test
```
