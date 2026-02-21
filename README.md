# TutorBooking - Booking.com for Tuition Classes

A full-stack mobile application for discovering, booking, and managing tuition classes. Built with React Native (Expo) and Node.js/Express.

## Architecture

```
tutuion-app/
├── mobile/          # React Native (Expo) mobile app
├── backend/         # Node.js + Express REST API
└── SRS.txt          # Software Requirements Specification
```

## Features
| Push Notifications | Firebase Cloud Messaging (FCM) + Expo Notifications |

### Prerequisites
- Node.js 18+

# Run database migrations
node src/database/migrate.js

# (Optional) Seed sample data
node src/database/seed.js

# Start the server
npm run dev
```

The backend runs on `http://localhost:5000` by default.

#### Seed Data Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tutorbooking.com | password123 |

Note: Seed data is intentionally minimal (admin only). Create tutors/students from the Admin app.

#### Reset DB (remove placeholder data)
This will truncate tables and reseed the admin:

```bash
cd backend
npm run reset
```

### Build Android APK (EAS)
This builds a standalone APK (not Expo Go). Since the backend stays local, you must bake in your LAN API URL at build time.

Example (replace with your PC LAN IP):

```bash
cd mobile

## Production Deployment (SRS Plan)

This repo is prepared for:
- Backend API: Render (Free)
- Database: Supabase Postgres (Free tier)
- Mobile builds: Expo EAS (Android AAB + iOS IPA)

### 1) Create Supabase Postgres
- Create a Supabase project.
- Copy the connection string as `DATABASE_URL`.

### 2) Deploy Backend API to Render
This repo includes a Render Blueprint: [render.yaml](render.yaml)

On Render:
- New → **Blueprint** → select your GitHub repo.
- Set required env vars (Render Dashboard → Environment):
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `CORS_ORIGIN` (example: `https://your-admin.vercel.app` or leave `*` for mobile-only)
	- `STRIPE_SECRET_KEY` (optional if promotions are used)
	- `STRIPE_WEBHOOK_SECRET` (optional)
	- `FIREBASE_SERVICE_ACCOUNT` (optional; base64 JSON recommended)

Notes:
- The Render start command runs migrations automatically (`npm run start:prod`).
- Push notifications via FCM require Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT`).

### 3) Build Production Mobile Apps (EAS)
Set the deployed API URL and build store artifacts:

```bash
cd mobile
npm i -g eas-cli
eas login
eas init

# Set your production backend URL for the build
set EXPO_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api

# Android (Play Store AAB)
eas build -p android --profile production

# iOS (App Store IPA)
eas build -p ios --profile production
```

Tip: you can also edit the `production.env.EXPO_PUBLIC_API_URL` value in [mobile/eas.json](mobile/eas.json).

# Install EAS CLI once
npm i -g eas-cli

# Login + initialize project
eas login
eas init

# Build an APK (set API URL for the build)
set EXPO_PUBLIC_API_URL=http://<your-pc-lan-ip>:5000/api
eas build -p android --profile preview-apk
```

### 2. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

#### Expo Go version (important)
Expo Go must match the project SDK. If you have Expo Go for a newer SDK installed, install Expo Go for SDK 52:
- Android: https://expo.dev/go?sdkVersion=52&platform=android&device=true

#### Configure API URL
By default, the mobile app will try to derive the backend host from the Expo dev server IP and use `http://<dev-server-ip>:5000/api`.

To override explicitly, set `EXPO_PUBLIC_API_URL` (recommended for production/deployed backends).

#### Troubleshooting: "Network error: cannot reach API"
- Confirm the backend is reachable on your PC: `http://127.0.0.1:5000/api/health`
- Your phone must be on the same Wi‑Fi/LAN as your PC.
- Ensure Windows Firewall allows inbound connections to port `5000`.
- If needed, explicitly set `EXPO_PUBLIC_API_URL=http://<your-pc-lan-ip>:5000/api` before running `npx expo start`.

## Production Deployment (SRS Plan)

This repo is prepared for:
- Backend API: Render (Free)
- Database: Supabase Postgres (Free tier)
- Mobile builds: Expo EAS (Android AAB + iOS IPA)

### 1) Create Supabase Postgres
- Create a Supabase project.
- Copy the connection string as `DATABASE_URL`.

### 2) Deploy Backend API to Render
This repo includes a Render Blueprint: [render.yaml](render.yaml)

On Render:
- New → **Blueprint** → select your GitHub repo.
- Set required env vars (Render Dashboard → Environment):
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `CORS_ORIGIN` (example: `https://your-admin.vercel.app` or leave `*` for mobile-only)
	- `STRIPE_SECRET_KEY` (optional if promotions are used)
	- `STRIPE_WEBHOOK_SECRET` (optional)
	- `FIREBASE_SERVICE_ACCOUNT` (optional; base64 JSON recommended)

Notes:
- The Render start command runs migrations automatically (`npm run start:prod`).
- Push notifications via FCM require Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT`).

### 3) Build Production Mobile Apps (EAS)
Set the deployed API URL and build store artifacts:

```bash
cd mobile
npm i -g eas-cli
eas login
eas init

# Set your production backend URL for the build
set EXPO_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api

# Android (Play Store AAB)
eas build -p android --profile production

# iOS (App Store IPA)
eas build -p ios --profile production
```

Tip: you can also edit the `production.env.EXPO_PUBLIC_API_URL` value in [mobile/eas.json](mobile/eas.json).

## Tutor class requests
- Tutor submits a "new class" request.
- Admin approves/rejects the request.
- If approved, the class is created and becomes visible to students.

### 3. Firebase Setup (Push Notifications)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Generate a service account key and save as `backend/firebase-service-account.json`
4. Update `backend/.env` with Firebase configuration

### 4. Stripe Setup (Promotions)

1. Create a Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your publishable and secret keys
3. Update `mobile/src/config/index.js` with publishable key
4. Update `backend/.env` with secret key

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/profile | Get profile (auth) |
| PUT | /api/auth/profile | Update profile (auth) |

Registration fields:
- `role`: `student` or `tutor`
- `name`, `email`, `password`, `contact_no`
- `grade` is required for `student`

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/classes | Search/list classes |
| GET | /api/classes/:id | Class details |
| POST | /api/classes/:id/enroll | Enroll in class (student) |
| POST | /api/classes/:id/review | Submit review (student) |
| GET | /api/classes/:id/reviews | Get class reviews |

### Tutor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tutor/classes | My classes |
| POST | /api/tutor/classes | Create class |
| PUT | /api/tutor/classes/:id | Update class |
| DELETE | /api/tutor/classes/:id | Delete class |
| GET | /api/tutor/classes/:id/enrollments | View enrolled students |
| POST | /api/tutor/classes/:id/announcement | Post announcement |
| GET | /api/tutor/classes/:id/announcements | Get announcements |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/tutors | List tutors |
| POST | /api/admin/tutors/:id/approve | Approve tutor |
| POST | /api/admin/tutors/:id/reject | Reject tutor |
| GET | /api/admin/analytics | Platform analytics |
| GET | /api/admin/classes | All classes |
| DELETE | /api/admin/classes/:id | Remove class |

### Promotions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/promotions/pay | Create promotion |
| GET | /api/promotions | My promotions (tutor) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | My notifications |
| PUT | /api/notifications/:id/read | Mark as read |
| POST | /api/notifications/token | Register push token |
| POST | /api/notifications/send | Send notification (admin) |

## Database Schema

The PostgreSQL database has the following tables:
- **users** - All users (students, tutors, admins)
- **tutors** - Tutor profile extensions (bio, qualifications)
- **classes** - Tuition class listings
- **enrollments** - Student-class enrollments
- **reviews** - Class ratings and reviews
- **announcements** - Tutor announcements per class
- **promotions** - Paid class promotions
- **notifications** - In-app notifications

## Design System

- **Primary Color**: `#4F46E5` (Indigo)
- **Background**: `#F8FAFC`
- **Cards**: White with subtle shadows
- **Typography**: System fonts, clean hierarchy
- **Icons**: Ionicons (via @expo/vector-icons)

## Scripts

### Backend
```bash
npm start       # Start production server
npm run dev     # Start with nodemon (auto-reload)
```

### Mobile
```bash
npx expo start           # Start Expo dev server
npx expo start --android # Open on Android
npx expo start --ios     # Open on iOS
npx expo start --web     # Open in browser
```

## License

MIT
