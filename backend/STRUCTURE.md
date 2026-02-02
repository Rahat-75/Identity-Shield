# Backend Folder Structure

```
backend/
├── config/                      # Django project configuration
│   ├── __init__.py
│   ├── settings.py             # Main settings
│   ├── urls.py                 # Root URL configuration
│   ├── wsgi.py                 # WSGI application
│   └── asgi.py                 # ASGI application
│
├── accounts/                    # User authentication & management
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # User model
│   ├── serializers.py          # User serializers
│   ├── views.py                # Auth views (register, login, etc.)
│   ├── urls.py                 # Auth endpoints
│   ├── permissions.py          # Custom permissions
│   └── admin.py                # Admin configuration
│
├── identity/                    # Citizen profiles & enrollment
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # CitizenProfile, EnrollmentCase, EnrollmentDocument
│   ├── serializers.py          # Identity serializers
│   ├── views.py                # Enrollment views
│   ├── urls.py                 # Identity endpoints
│   ├── utils.py                # NID hashing utilities
│   └── admin.py
│
├── organizations/               # Verifier organizations
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # Organization, OrgUser
│   ├── serializers.py
│   ├── views.py                # Organization management
│   ├── urls.py
│   └── admin.py
│
├── consent/                     # Consent management
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # ConsentGrant
│   ├── serializers.py
│   ├── views.py                # Consent grant/revoke
│   ├── urls.py
│   └── admin.py
│
├── credentials/                 # Aliases & verification
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # AliasIdentifier, VerificationRequest, VerificationEvent
│   ├── serializers.py
│   ├── views.py                # Token issuance, verification
│   ├── urls.py
│   ├── utils.py                # JWT utilities, QR generation
│   └── admin.py
│
├── uploads/                     # Cloudinary integration
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # UploadAsset
│   ├── serializers.py
│   ├── views.py                # Signature generation, asset registration
│   ├── urls.py
│   ├── utils.py                # Cloudinary helpers
│   └── admin.py
│
├── audit/                       # Audit trail
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py               # AuditEvent (append-only)
│   ├── serializers.py
│   ├── views.py                # Audit log views
│   ├── urls.py
│   ├── middleware.py           # Audit logging middleware
│   └── admin.py
│
├── core/                        # Shared utilities
│   ├── __init__.py
│   ├── exceptions.py           # Custom exceptions
│   ├── pagination.py           # Custom pagination
│   ├── permissions.py          # Shared permissions
│   └── utils.py                # Helper functions
│
├── management/                  # Management commands
│   └── commands/
│       ├── __init__.py
│       └── seed_demo_data.py   # Seed data script
│
├── static/                      # Static files
├── media/                       # Media files (if any)
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore
├── manage.py                    # Django management script
├── requirements.txt             # Python dependencies
└── README.md                    # Backend documentation
```

## Key Files Explanation

### config/settings.py

- Database configuration (Neon)
- Cloudinary setup
- JWT authentication
- CORS settings
- Email configuration
- Security settings

### accounts/models.py

- Custom User model with email/phone authentication
- Role-based user types (CITIZEN, ORG_USER, ADMIN)

### identity/models.py

- **CitizenProfile**: User identity data (NID hashed)
- **EnrollmentCase**: Enrollment submissions with status
- **EnrollmentDocument**: Links to uploaded documents

### credentials/models.py

- **AliasIdentifier**: Global and pairwise aliases
- **VerificationRequest**: Verification sessions
- **VerificationEvent**: Completed verifications (audit)

### audit/models.py

- **AuditEvent**: Immutable event log
- Tracks all system actions with metadata

### uploads/utils.py

- Cloudinary signature generation
- File validation
- Asset metadata extraction
