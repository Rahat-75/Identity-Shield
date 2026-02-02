# Identity Shield

A privacy-preserving identity verification system for Bangladesh that allows citizens to prove their identity and attributes without exposing their actual NID number.

> **⚠️ Portfolio Project Notice**  
> This is a demonstration project. NID validation and identity proofing are **simulated** and not connected to any government systems.

## 🎯 Project Overview

**Problem**: In Bangladesh, people frequently share their NID number or NID copy for everyday verification, creating privacy and security risks.

**Solution**: Identity Shield issues a privacy-preserving alias ID and verifiable QR/token so users can prove identity/attributes without revealing the actual NID number.

### Key Features

- 🔐 **Privacy-First**: Never expose real NID numbers to verifiers
- 🎭 **Alias IDs**: Global and pairwise aliases to prevent tracking
- ✅ **Consent-Based**: User controls what data is shared with whom
- 📊 **Minimal Disclosure**: Share only requested attributes (age verification, name match, etc.)
- 📝 **Audit Trail**: Complete history of all verification events
- 📱 **QR Code Verification**: Easy verification via QR scanning

## 🏗️ Architecture

```
┌─────────────────┐
│  Next.js 15.5.9 │  ← Citizen/Verifier/Admin Portals
│   (Frontend)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Django + DRF    │  ← REST API + JWT Auth
│   (Backend)     │
└────┬────────┬───┘
     │        │
     ↓        ↓
┌─────────┐ ┌──────────┐
│  Neon   │ │Cloudinary│
│PostgreSQL│ │ Storage  │
└─────────┘ └──────────┘
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.17
- **Forms**: React Hook Form + Zod
- **Data Fetching**: React Query + fetch
- **Icons**: Lucide React
- **QR Codes**: qrcode.react

### Backend

- **Framework**: Django 5.x + Django REST Framework
- **Language**: Python 3.11+
- **Auth**: djangorestframework-simplejwt
- **Database**: PostgreSQL (Neon - serverless)
- **File Storage**: Cloudinary
- **Email**: Gmail SMTP

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **Neon Account**: [Sign up here](https://neon.tech)
- **Cloudinary Account**: [Sign up here](https://cloudinary.com)
- **Gmail Account**: For email notifications (optional)

## 🚀 Quick Start

### 1. Clone & Setup

```bash
# Clone the repository
cd f:\projects\rahat_tigerit

# Setup backend
cd backend
python -m venv venv
venv\Scripts\activate      # Windows (PowerShell/CMD)
source venv/Scripts/activate  # Windows (Git Bash)
pip install -r requirements.txt

# Setup frontend (already done)
cd ..\frontend
npm install
```

### 2. Configure Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project: `nid-privacy-pass`
3. Copy your connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/nidprivacypass?sslmode=require
   ```

### 3. Configure Cloudinary

1. Go to [Cloudinary Console](https://console.cloudinary.com)
2. Note your **Cloud Name**, **API Key**, and **API Secret**
3. Create upload presets:
   - Go to Settings → Upload → Upload presets
   - Create preset: `nid_documents` (Signing Mode: **Signed**)
   - Create preset: `nid_selfie` (Signing Mode: **Signed**)

### 4. Configure Environment Variables

#### Backend (.env)

```bash
cd backend
copy .env.example .env
```

Edit `backend\.env` and fill in:

```bash
# Django
SECRET_KEY=your-secret-key-here  # Generate: python -c "import secrets; print(secrets.token_urlsafe(50))"

# Neon Database
DATABASE_URL=postgresql://your-neon-connection-string-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT
JWT_SECRET_KEY=your-jwt-secret  # Generate: python -c "import secrets; print(secrets.token_urlsafe(64))"
JWT_REFRESH_SECRET_KEY=your-refresh-secret  # Generate: python -c "import secrets; print(secrets.token_urlsafe(64))"

# Security
NID_HASH_SALT=your-salt  # Generate: python -c "import secrets; print(secrets.token_urlsafe(32))"
ENCRYPTION_KEY=your-encryption-key  # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Gmail (optional - for email notifications)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-16-char-app-password
```

#### Frontend (.env.local)

```bash
cd ..\frontend
copy .env.example .env.local
```

Edit `frontend\.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_DOCUMENTS=nid_documents
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_SELFIE=nid_selfie
```

### 5. Initialize Database

```bash
cd backend
# PowerShell/CMD: venv\Scripts\activate OR Git Bash: source venv/Scripts/activate

# Run migrations (NeonDB)
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser
```

### 6. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
# PowerShell/CMD: venv\Scripts\activate OR Git Bash: source venv/Scripts/activate
python manage.py runserver
```

Backend will run at: http://localhost:8000

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend will run at: http://localhost:3000

## � Deployment Guide

### Backend (Django + NeonDB)

We recommend **Render.com** or **Railway.app**:

1. **Database**: Your **NeonDB** is already a managed cloud database. No changes are needed!
2. **Environment Variables**: Add all variables from your `.env` to the Render/Railway environment settings.
3. **Build Command**: `pip install -r requirements.txt && python manage.py migrate`
4. **Start Command**: `gunicorn config.wsgi`

### Frontend (Next.js)

We recommend **Vercel**:

1. Connect your GitHub repository.
2. **Environment Variables**: Add `NEXT_PUBLIC_API_URL` (pointing to your production backend) and Cloudinary keys.
3. Vercel will automatically detect Next.js and deploy.

## �📱 User Portals

### Citizen Portal (`/`)

- Sign up and login
- Submit enrollment with documents
- Generate Privacy Pass QR codes
- Manage consent grants
- View verification history

### Verifier Portal (`/org`)

- Organization login
- Create verification requests
- Scan QR codes
- View verification logs

### Admin Portal (`/admin`)

- Review enrollment cases
- Approve/reject enrollments
- Manage organizations
- Search audit logs

## 🔐 Core Concepts

### 1. Enrollment (Simulated Proofing)

- User submits NID + documents
- Admin reviews and approves/rejects
- Only approved users can generate passes

### 2. Alias IDs

- **Global Alias**: One per user, public-facing
- **Pairwise Alias**: Different alias per organization (prevents tracking)

### 3. Minimal Disclosure

Verifiers can request specific claims:

- `name_match`: Does name match?
- `age_over_18`: Is user 18+?
- `phone_verified`: Is phone verified?
- `residency_district`: Which district?

### 4. Consent Management

- User explicitly grants consent to organizations
- Consent can be revoked anytime
- Scopes define what data can be accessed

### 5. Verification Flow

1. Verifier creates request
2. User approves (or pre-consent allows auto)
3. System issues JWT token + QR code
4. Verifier scans and verifies
5. System returns minimal claims only
6. Event logged in audit trail

## 📊 Database Schema

### Core Models

- **User**: Authentication (email/phone)
- **CitizenProfile**: User identity data (NID hashed)
- **EnrollmentCase**: Enrollment submissions
- **Organization**: Verifier organizations
- **ConsentGrant**: User → Org permissions
- **AliasIdentifier**: Global/pairwise aliases
- **VerificationRequest**: Verification sessions
- **VerificationEvent**: Audit log (append-only)
- **UploadAsset**: Cloudinary file metadata

## 🔒 Security Measures

1. **NID Protection**
   - Stored as hashed value only
   - Never logged or returned in APIs
   - Encrypted at rest

2. **Access Control**
   - Role-based permissions (Citizen/Org/Admin)
   - JWT authentication
   - Middleware permission checks

3. **Audit Trail**
   - Immutable event log
   - Records all verifications
   - IP and user-agent tracking

4. **Token Security**
   - One-time use enforcement
   - Short expiration (1 hour)
   - Organization binding

## 📁 Project Structure

```
rahat_tigerit/
├── backend/
│   ├── accounts/          # User authentication
│   ├── identity/          # Citizen profiles & enrollment
│   ├── organizations/     # Verifier organizations
│   ├── consent/           # Consent management
│   ├── credentials/       # Aliases & tokens
│   ├── uploads/           # Cloudinary integration
│   ├── audit/             # Audit trail
│   ├── config/            # Django settings
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/        # Login/register
│   │   ├── (citizen)/     # Citizen portal
│   │   ├── (verifier)/    # Verifier portal
│   │   └── (admin)/       # Admin portal
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   ├── forms/         # Form components
│   │   ├── upload/        # Cloudinary upload
│   │   └── qr/            # QR generation/scanning
│   ├── lib/
│   │   ├── api/           # API client
│   │   ├── hooks/         # React hooks
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── README.md
```

## 🧪 Demo Workflow

### Step 1: Citizen Enrollment

1. Navigate to http://localhost:3000
2. Register as a citizen
3. Submit enrollment with:
   - NID number (simulated)
   - Personal details
   - Upload documents (NID front/back, selfie)
4. Wait for admin approval

### Step 2: Admin Review

1. Navigate to http://localhost:3000/admin
2. Login with superuser credentials
3. Review pending enrollment
4. Approve with notes

### Step 3: Generate Privacy Pass

1. Login as citizen
2. Go to Privacy Pass section
3. Generate QR code token
4. Download/display QR

### Step 4: Grant Consent

1. Go to Consent Management
2. Select organization (e.g., "Example Bank")
3. Choose scopes (name_match, age_over_18)
4. Grant consent

### Step 5: Verification

1. Login as org user at http://localhost:3000/org
2. Create verification request
3. Scan citizen's QR code
4. View minimal disclosure results

### Step 6: Audit Review

1. Citizen: View verification history
2. Admin: Search all audit logs

## 🔧 Development Commands

### Backend

```bash
# Activate virtual environment
cd backend
# PowerShell/CMD: venv\Scripts\activate OR Git Bash: source venv/Scripts/activate

# Run server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Run tests
python manage.py test
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📧 Gmail SMTP Setup (Optional)

To enable email notifications:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Update backend/.env**:
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-16-char-app-password
   ```

## 🐛 Troubleshooting

### Database Connection Issues

- Verify Neon connection string in `.env`
- Ensure `sslmode=require` is in the connection string
- Check Neon dashboard for database status

### Cloudinary Upload Fails

- Verify upload presets are set to "Signed" mode
- Check API credentials in both backend and frontend `.env` files
- Ensure CORS is enabled in Cloudinary settings

### Frontend Can't Connect to Backend

- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Ensure CORS is configured in backend settings

## 📝 API Documentation

API endpoints are available at: http://localhost:8000/api/v1/

### Key Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/enrollment/cases` - Create enrollment
- `POST /api/v1/uploads/signature` - Get Cloudinary signature
- `POST /api/v1/consent/grants` - Grant consent
- `POST /api/v1/verification/verify` - Verify token

Full API documentation: See `implementation_plan.md`

## 🤝 Contributing

This is a portfolio project. Feel free to fork and adapt for your own use!

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Built as a portfolio demonstration project

---

**Remember**: This is a demonstration project. Real-world implementation would require:

- Actual government NID integration
- Enhanced security audits
- Production-grade infrastructure
- Legal compliance review
- Privacy impact assessment
- User data protection policies
