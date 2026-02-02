# API Documentation

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register

**POST** `/auth/register`

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "phone": "+8801712345678",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "role": "CITIZEN"
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "+8801712345678",
    "role": "CITIZEN",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "CITIZEN"
  }
}
```

### Refresh Token

**POST** `/auth/refresh`

**Request Body:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Get Current User

**GET** `/auth/me`

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "phone": "+8801712345678",
  "role": "CITIZEN",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Enrollment

### Create Enrollment Case

**POST** `/enrollment/cases/create`

**Permissions:** CITIZEN only

**Request Body:**

```json
{
  "nid_number": "1234567890123",
  "full_name": "Ahmed Rahman",
  "date_of_birth": "1990-01-15",
  "residency_district": "Dhaka"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "citizen": 1,
  "citizen_name": "Ahmed Rahman",
  "status": "PENDING_REVIEW",
  "submitted_at": "2024-01-15T10:30:00Z",
  "reviewed_by": null,
  "reviewed_by_email": null,
  "reviewed_at": null,
  "admin_notes": ""
}
```

### List Enrollment Cases

**GET** `/enrollment/cases`

**Permissions:**

- CITIZEN: sees own cases
- ADMIN: sees all cases

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "citizen": 1,
    "citizen_name": "Ahmed Rahman",
    "status": "PENDING_REVIEW",
    "submitted_at": "2024-01-15T10:30:00Z"
  }
]
```

### Review Enrollment Case

**PATCH** `/enrollment/cases/{id}/review`

**Permissions:** ADMIN only

**Request Body:**

```json
{
  "status": "APPROVED",
  "admin_notes": "All documents verified successfully"
}
```

**Response:** `200 OK`

### Add Document to Case

**POST** `/enrollment/cases/{id}/documents`

**Request Body:**

```json
{
  "document_type": "NID_FRONT",
  "upload_asset": 12
}
```

## Uploads

### Generate Upload Signature

**POST** `/uploads/signature`

Generate Cloudinary signature for client-side uploads.

**Request Body:**

```json
{
  "upload_preset": "nid_documents",
  "folder": "enrollments/user_123"
}
```

**Response:** `200 OK`

```json
{
  "signature": "abc123...",
  "timestamp": 1705315800,
  "upload_preset": "nid_documents",
  "folder": "enrollments/user_123",
  "api_key": "123456789",
  "cloud_name": "your-cloud-name"
}
```

### Register Upload

**POST** `/uploads/register`

Register uploaded asset metadata after Cloudinary upload.

**Request Body:**

```json
{
  "public_id": "user_123/nid_front_abc123",
  "secure_url": "https://res.cloudinary.com/...",
  "resource_type": "image",
  "format": "jpg",
  "bytes": 245678,
  "checksum": "abc123..."
}
```

### List Uploads

**GET** `/uploads`

**Response:** `200 OK`

## Organizations

### Create Organization

**POST** `/organizations/create`

**Permissions:** ADMIN only

**Request Body:**

```json
{
  "name": "Bangladesh Bank",
  "org_type": "Bank",
  "registration_number": "REG123456"
}
```

### List Organizations

**GET** `/organizations`

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Bangladesh Bank",
    "org_type": "Bank",
    "registration_number": "REG123456",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Add Organization User

**POST** `/organizations/{id}/users/add`

**Permissions:** ADMIN only

**Request Body:**

```json
{
  "user": 5,
  "role": "VERIFIER"
}
```

## Error Responses

All endpoints return consistent error formats:

**400 Bad Request:**

```json
{
  "field_name": ["Error message"]
}
```

**401 Unauthorized:**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "field": "email"
  }
}
```

**403 Forbidden:**

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Only admins can perform this action"
  }
}
```

**404 Not Found:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```
